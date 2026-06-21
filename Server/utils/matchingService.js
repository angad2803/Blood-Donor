import User from "../models/User.js";
import BloodRequest from "../models/BloodRequest.js";
import { canDonateTo } from "./compatability.js";
import geolocationService from "./geolocationService.js";
import { addEmailJob } from "../queues/config.js";

class MatchingService {
  constructor() {
    this.maxSearchRadius = 100000;
    this.urgencyMultipliers = {
      Emergency: 1.5,
      High: 1.2,
      Medium: 1.0,
      Low: 0.8,
    };
  }


  async findCompatibleDonors(requestId, options = {}) {
    try {
      const request = await BloodRequest.findById(requestId).populate(
        "requester"
      );
      if (!request) throw new Error("Blood request not found");

      const {
        maxDistance = 50000,
        limit = 20,
        includeRouteInfo = false,
        sortBy = "proximity",
      } = options;


      const donors = await User.aggregate([
        {
          $geoNear: {
            near: request.coordinates,
            distanceField: "distance",
            maxDistance: Math.min(maxDistance, this.maxSearchRadius),
            spherical: true,
            query: {
              available: true,
              "locationPreferences.shareRealTimeLocation": true,
            },
          },
        },
        {
          $match: {
            _id: { $ne: request.requester._id },
          },
        },
        {
          $limit: limit * 2,
        },
      ]);


      const compatibleDonors = donors.filter((donor) =>
        canDonateTo(donor.bloodGroup, request.bloodGroup)
      );


      const scoredDonors = await Promise.all(
        compatibleDonors.map(async (donor) => {
          const score = await this.calculateMatchScore(donor, request);
          const donorObj = { ...donor, matchScore: score };


          if (includeRouteInfo && donor.coordinates) {
            try {
              const route = await geolocationService.calculateRoute(
                donor.coordinates.coordinates[1],
                donor.coordinates.coordinates[0],
                request.coordinates.coordinates[1],
                request.coordinates.coordinates[0]
              );
              donorObj.routeInfo = route;
            } catch (error) {
              console.error("Route calculation failed:", error);
              donorObj.routeInfo = null;
            }
          }

          return donorObj;
        })
      );


      const sortedDonors = this.sortDonors(scoredDonors, sortBy);

      return {
        request: request,
        donors: sortedDonors.slice(0, limit),
        totalFound: scoredDonors.length,
        searchRadius: maxDistance,
        searchCenter: {
          latitude: request.coordinates.coordinates[1],
          longitude: request.coordinates.coordinates[0],
        },
      };
    } catch (error) {
      console.error("Error finding compatible donors:", error);
      throw error;
    }
  }


  async findNearbyRequests(donorId, options = {}) {
    try {
      const donor = await User.findById(donorId);
      if (!donor) throw new Error("Donor not found");


      if (
        !donor.coordinates ||
        !donor.coordinates.coordinates ||
        (donor.coordinates.coordinates[0] === 0 &&
          donor.coordinates.coordinates[1] === 0)
      ) {
        return {
          requests: [],
          totalCount: 0,
          message:
            "No location data available for donor. Please update your location to find nearby requests.",
        };
      }

      const {
        maxDistance = 50000,
        limit = 10,
        urgencyFilter,
        includeRouteInfo = false,
      } = options;

      console.log("Finding nearby blood requests using $near query...");


      const query = {
        fulfilled: false,
        coordinates: {
          $near: {
            $geometry: donor.coordinates,
            $maxDistance: Math.min(maxDistance, this.maxSearchRadius),
          },
        },
      };


      if (urgencyFilter) {
        query.urgency = urgencyFilter;
      }


      const donorBloodGroup = donor.bloodGroup;
      let compatibleBloodGroups = [];

      switch (donorBloodGroup) {
        case "O-":
          compatibleBloodGroups = [
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-",
          ];
          break;
        case "O+":
          compatibleBloodGroups = ["A+", "B+", "AB+", "O+"];
          break;
        case "A-":
          compatibleBloodGroups = ["A+", "A-", "AB+", "AB-"];
          break;
        case "A+":
          compatibleBloodGroups = ["A+", "AB+"];
          break;
        case "B-":
          compatibleBloodGroups = ["B+", "B-", "AB+", "AB-"];
          break;
        case "B+":
          compatibleBloodGroups = ["B+", "AB+"];
          break;
        case "AB-":
          compatibleBloodGroups = ["AB+", "AB-"];
          break;
        case "AB+":
          compatibleBloodGroups = ["AB+"];
          break;
        default:
          compatibleBloodGroups = [donorBloodGroup];
      }

      query.bloodGroup = { $in: compatibleBloodGroups };

      console.log("Blood Request Query:", JSON.stringify(query, null, 2));


      let requestsQuery = BloodRequest.find(query)
        .populate("requester", "name hospitalName location bloodGroup")
        .limit(parseInt(limit));

      const requests = await requestsQuery;


      const requestsWithDistance = requests.map((request) => {
        let distance = 0;
        if (request.coordinates && request.coordinates.coordinates) {

          const R = 6371e3;
          const φ1 = (donor.coordinates.coordinates[1] * Math.PI) / 180;
          const φ2 = (request.coordinates.coordinates[1] * Math.PI) / 180;
          const Δφ =
            ((request.coordinates.coordinates[1] -
              donor.coordinates.coordinates[1]) *
              Math.PI) /
            180;
          const Δλ =
            ((request.coordinates.coordinates[0] -
              donor.coordinates.coordinates[0]) *
              Math.PI) /
            180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        }


        const urgencyScore =
          {
            Emergency: 4,
            High: 3,
            Medium: 2,
            Low: 1,
          }[request.urgency] || 1;

        return {
          ...request.toObject(),
          distance: distance,
          urgencyScore: urgencyScore,
        };
      });


      requestsWithDistance.sort((a, b) => {
        if (a.urgencyScore !== b.urgencyScore) {
          return b.urgencyScore - a.urgencyScore;
        }
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });


      if (includeRouteInfo && requestsWithDistance.length > 0) {
        for (const request of requestsWithDistance) {
          try {
            const route = await geolocationService.calculateRoute(
              donor.coordinates.coordinates[1],
              donor.coordinates.coordinates[0],
              request.coordinates.coordinates[1],
              request.coordinates.coordinates[0]
            );
            request.routeInfo = route;
          } catch (error) {
            console.warn(
              `Failed to calculate route for request ${request._id}:`,
              error.message
            );
            request.routeInfo = null;
          }
        }
      }

      return {
        requests: requestsWithDistance.map((request) => ({
          id: request._id,
          bloodGroup: request.bloodGroup,
          urgency: request.urgency,
          hospitalName:
            request.hospital ||
            request.requester?.hospitalName ||
            "Unknown Hospital",
          location: request.location,
          address: request.address,
          distance: Math.round(request.distance),
          coordinates: request.coordinates,
          createdAt: request.createdAt,
          contactInfo: request.contactInfo,
          routeInfo: request.routeInfo,
          requester: {
            name: request.requester?.name,
            hospitalName: request.requester?.hospitalName,
          },
        })),
        totalCount: requestsWithDistance.length,
        donorLocation: {
          coordinates: donor.coordinates.coordinates,
          address: donor.address?.formattedAddress || donor.location,
        },
        searchRadius: maxDistance,
        message:
          requestsWithDistance.length === 0
            ? "No blood requests found in your area. Try expanding your search radius."
            : undefined,
      };
    } catch (error) {
      console.error("Error finding nearby requests:", error);


      return {
        requests: [],
        totalCount: 0,
        error: error.message,
        message: "Failed to find nearby requests. Please try again later.",
      };
    }
  }


  async calculateMatchScore(donor, request) {
    let score = 100;


    const distance = donor.distance || 0;
    const distanceScore = Math.max(0, 50 - distance / 1000);
    score += distanceScore;


    const urgencyMultiplier = this.urgencyMultipliers[request.urgency] || 1.0;
    score *= urgencyMultiplier;


    if (donor.available) score += 20;


    if (donor.lastDonationDate) {
      const daysSinceLastDonation =
        (Date.now() - donor.lastDonationDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastDonation < 56) {

        score *= 0.7;
      }
    }


    if (donor.locationAccuracy && donor.locationAccuracy < 100) {
      score += 10;
    }


    if (donor.locationPreferences?.preferredTravelMethods?.length > 0) {
      score += 5;
    }

    return Math.round(score);
  }


  calculateRequestMatchScore(request, donor, distance) {
    let score = 100;


    const urgencyScores = {
      Emergency: 100,
      High: 80,
      Medium: 60,
      Low: 40,
    };
    score += urgencyScores[request.urgency] || 60;


    const distanceScore = Math.max(0, 50 - distance);
    score += distanceScore;


    const hoursSinceCreated =
      (Date.now() - request.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreated < 24) {
      score += 10;
    }

    return Math.round(score);
  }


  sortDonors(donors, sortBy) {
    switch (sortBy) {
      case "proximity":
        return donors.sort((a, b) => a.distance - b.distance);
      case "compatibility":
        return donors.sort((a, b) => b.matchScore - a.matchScore);
      case "mixed":
      default:
        return donors.sort((a, b) => {

          const aScore = (b.matchScore || 0) - a.distance / 1000;
          const bScore = (a.matchScore || 0) - b.distance / 1000;
          return bScore - aScore;
        });
    }
  }


  async notifyNearbyDonors(requestId, options = {}) {
    try {
      const matchResult = await this.findCompatibleDonors(requestId, {
        ...options,
        limit: 50,
      });

      if (matchResult.donors.length === 0) {
        console.log("No compatible donors found for notification");
        return { notified: 0 };
      }


      const notificationPromises = matchResult.donors.map((donor) => {
        const emailData = {
          to: donor.email,
          type: "urgent_blood_request",
          data: {
            donorName: donor.name,
            bloodGroup: matchResult.request.bloodGroup,
            hospital: matchResult.request.hospital,
            urgency: matchResult.request.urgency,
            distance: Math.round(donor.distance / 1000),
            requestId: matchResult.request._id,
          },
        };

        return addEmailJob(emailData, {
          priority: matchResult.request.urgency === "Emergency" ? 1 : 5,
          attempts: 3,
        });
      });

      await Promise.all(notificationPromises);

      return {
        notified: matchResult.donors.length,
        searchRadius: matchResult.searchRadius,
        averageDistance:
          matchResult.donors.reduce((sum, d) => sum + d.distance, 0) /
          matchResult.donors.length,
      };
    } catch (error) {
      console.error("Error notifying nearby donors:", error);
      throw error;
    }
  }


  async updateDonorLocation(donorId, latitude, longitude, accuracy = null) {
    try {
      const donor = await User.findById(donorId);
      if (!donor) throw new Error("User not found");

      if (!geolocationService.isValidCoordinates(latitude, longitude)) {
        throw new Error("Invalid coordinates");
      }


      const address = await geolocationService.reverseGeocode(
        latitude,
        longitude
      );


      await donor.updateLocation(latitude, longitude, address, accuracy);


      if (donor.locationPreferences?.shareRealTimeLocation) {
        const nearbyRequests = await this.findNearbyRequests(donorId, {
          urgencyFilter: "Emergency",
          maxDistance: 25000,
        });

        if (nearbyRequests.requests.length > 0) {

          const emailData = {
            to: donor.email,
            type: "nearby_emergency_alert",
            data: {
              donorName: donor.name,
              requestsCount: nearbyRequests.requests.length,
              nearestRequest: nearbyRequests.requests[0],
            },
          };

          await addEmailJob(emailData, { priority: 1 });
        }
      }

      return {
        success: true,
        location: {
          latitude,
          longitude,
          address: address.formattedAddress,
        },
        nearbyEmergencyRequests: donor.locationPreferences
          ?.shareRealTimeLocation
          ? nearbyRequests?.requests.length || 0
          : null,
      };
    } catch (error) {
      console.error("Error updating donor location:", error);
      throw error;
    }
  }


  async findOptimalMeetingPoints(donorId, requestId) {
    try {
      const donor = await User.findById(donorId);
      const request = await BloodRequest.findById(requestId);

      if (!donor || !request) throw new Error("Donor or request not found");

      const meetingPoint = await geolocationService.findOptimalMeetingPoint(
        donor.coordinates.coordinates[1],
        donor.coordinates.coordinates[0],
        request.coordinates.coordinates[1],
        request.coordinates.coordinates[0]
      );


      const [donorRoute, hospitalRoute] = await Promise.all([
        geolocationService.calculateRoute(
          donor.coordinates.coordinates[1],
          donor.coordinates.coordinates[0],
          meetingPoint.latitude,
          meetingPoint.longitude
        ),
        geolocationService.calculateRoute(
          request.coordinates.coordinates[1],
          request.coordinates.coordinates[0],
          meetingPoint.latitude,
          meetingPoint.longitude
        ),
      ]);

      return {
        meetingPoint,
        donorRoute,
        hospitalRoute,
        totalDistance: donorRoute.distance + hospitalRoute.distance,
        maxTravelTime: Math.max(donorRoute.duration, hospitalRoute.duration),
      };
    } catch (error) {
      console.error("Error finding optimal meeting point:", error);
      throw error;
    }
  }
}

export default new MatchingService();
