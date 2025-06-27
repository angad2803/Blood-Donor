import User from "../models/User.js";
import BloodRequest from "../models/BloodRequest.js";
import { canDonateTo } from "./compatability.js";
import geolocationService from "./geolocationService.js";
import { addEmailJob } from "../queues/config.js";

class MatchingService {
  constructor() {
    this.maxSearchRadius = 100000; // 100km in meters
    this.urgencyMultipliers = {
      Emergency: 1.5,
      High: 1.2,
      Medium: 1.0,
      Low: 0.8,
    };
  }

  /**
   * Find compatible donors for a blood request with geolocation
   */
  async findCompatibleDonors(requestId, options = {}) {
    try {
      const request = await BloodRequest.findById(requestId).populate(
        "requester"
      );
      if (!request) throw new Error("Blood request not found");

      const {
        maxDistance = 50000, // 50km default
        limit = 20,
        includeRouteInfo = false,
        sortBy = "proximity", // 'proximity', 'compatibility', 'mixed'
      } = options;

      // Find donors within radius using geospatial query
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
            _id: { $ne: request.requester._id }, // Exclude requester
          },
        },
        {
          $limit: limit * 2, // Get more to filter by blood compatibility
        },
      ]);

      // Filter by blood type compatibility
      const compatibleDonors = donors.filter((donor) =>
        canDonateTo(donor.bloodGroup, request.bloodGroup)
      );

      // Calculate match scores
      const scoredDonors = await Promise.all(
        compatibleDonors.map(async (donor) => {
          const score = await this.calculateMatchScore(donor, request);
          const donorObj = { ...donor, matchScore: score };

          // Add route information if requested
          if (includeRouteInfo && donor.coordinates) {
            try {
              const route = await geolocationService.calculateRoute(
                donor.coordinates.coordinates[1], // latitude
                donor.coordinates.coordinates[0], // longitude
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

      // Sort donors based on criteria
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

  /**
   * Find nearby blood requests for a donor
   */
  async findNearbyRequests(donorId, options = {}) {
    try {
      const donor = await User.findById(donorId);
      if (!donor) throw new Error("Donor not found");

      // Check if donor has location data
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
        maxDistance = 50000, // 50km default
        limit = 10,
        urgencyFilter,
        includeRouteInfo = false,
      } = options;

      console.log("Finding nearby blood requests using $near query...");

      // Use $near instead of $geoNear to avoid index conflicts
      const query = {
        fulfilled: false,
        coordinates: {
          $near: {
            $geometry: donor.coordinates,
            $maxDistance: Math.min(maxDistance, this.maxSearchRadius),
          },
        },
      };

      // Add urgency filter if specified
      if (urgencyFilter) {
        query.urgency = urgencyFilter;
      }

      // Blood compatibility filter - include requests that this donor can help with
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
          compatibleBloodGroups = [donorBloodGroup]; // Same blood group at minimum
      }

      query.bloodGroup = { $in: compatibleBloodGroups };

      console.log("Blood Request Query:", JSON.stringify(query, null, 2));

      // Execute the query with population
      let requestsQuery = BloodRequest.find(query)
        .populate("requester", "name hospitalName location bloodGroup")
        .limit(parseInt(limit));

      const requests = await requestsQuery;

      // Calculate distances manually and add urgency scoring
      const requestsWithDistance = requests.map((request) => {
        let distance = 0;
        if (request.coordinates && request.coordinates.coordinates) {
          // Calculate distance using Haversine formula
          const R = 6371e3; // Earth's radius in meters
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

        // Add urgency score
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

      // Sort by urgency (highest first), then by distance (closest first), then by creation date (newest first)
      requestsWithDistance.sort((a, b) => {
        if (a.urgencyScore !== b.urgencyScore) {
          return b.urgencyScore - a.urgencyScore; // Higher urgency first
        }
        if (a.distance !== b.distance) {
          return a.distance - b.distance; // Closer distance first
        }
        return new Date(b.createdAt) - new Date(a.createdAt); // Newer requests first
      });

      // Add route information if requested
      if (includeRouteInfo && requestsWithDistance.length > 0) {
        for (const request of requestsWithDistance) {
          try {
            const route = await geolocationService.calculateRoute(
              donor.coordinates.coordinates[1], // donor lat
              donor.coordinates.coordinates[0], // donor lng
              request.coordinates.coordinates[1], // request lat
              request.coordinates.coordinates[0] // request lng
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

      // Return empty results instead of throwing
      return {
        requests: [],
        totalCount: 0,
        error: error.message,
        message: "Failed to find nearby requests. Please try again later.",
      };
    }
  }

  /**
   * Calculate match score for a donor-request pair
   */
  async calculateMatchScore(donor, request) {
    let score = 100; // Base score

    // Distance factor (closer = better)
    const distance = donor.distance || 0;
    const distanceScore = Math.max(0, 50 - distance / 1000); // Max 50 points for distance
    score += distanceScore;

    // Urgency factor
    const urgencyMultiplier = this.urgencyMultipliers[request.urgency] || 1.0;
    score *= urgencyMultiplier;

    // Availability factor
    if (donor.available) score += 20;

    // Recent donation factor (prefer donors who haven't donated recently)
    if (donor.lastDonationDate) {
      const daysSinceLastDonation =
        (Date.now() - donor.lastDonationDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastDonation < 56) {
        // Less than 8 weeks
        score *= 0.7; // Reduce score
      }
    }

    // Location accuracy factor
    if (donor.locationAccuracy && donor.locationAccuracy < 100) {
      score += 10; // Bonus for accurate location
    }

    // Preferred travel methods
    if (donor.locationPreferences?.preferredTravelMethods?.length > 0) {
      score += 5;
    }

    return Math.round(score);
  }

  /**
   * Calculate match score for a request from donor's perspective
   */
  calculateRequestMatchScore(request, donor, distance) {
    let score = 100;

    // Urgency factor (higher urgency = higher score)
    const urgencyScores = {
      Emergency: 100,
      High: 80,
      Medium: 60,
      Low: 40,
    };
    score += urgencyScores[request.urgency] || 60;

    // Distance factor (closer = better)
    const distanceScore = Math.max(0, 50 - distance);
    score += distanceScore;

    // Time factor (newer requests get slight bonus)
    const hoursSinceCreated =
      (Date.now() - request.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreated < 24) {
      score += 10;
    }

    return Math.round(score);
  }

  /**
   * Sort donors based on different criteria
   */
  sortDonors(donors, sortBy) {
    switch (sortBy) {
      case "proximity":
        return donors.sort((a, b) => a.distance - b.distance);
      case "compatibility":
        return donors.sort((a, b) => b.matchScore - a.matchScore);
      case "mixed":
      default:
        return donors.sort((a, b) => {
          // Combine distance and match score
          const aScore = (b.matchScore || 0) - a.distance / 1000;
          const bScore = (a.matchScore || 0) - b.distance / 1000;
          return bScore - aScore;
        });
    }
  }

  /**
   * Send real-time notifications to nearby donors
   */
  async notifyNearbyDonors(requestId, options = {}) {
    try {
      const matchResult = await this.findCompatibleDonors(requestId, {
        ...options,
        limit: 50, // Notify more donors for urgent requests
      });

      if (matchResult.donors.length === 0) {
        console.log("No compatible donors found for notification");
        return { notified: 0 };
      }

      // Send notifications via queue
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

  /**
   * Update donor's real-time location
   */
  async updateDonorLocation(donorId, latitude, longitude, accuracy = null) {
    try {
      const donor = await User.findById(donorId);
      if (!donor) throw new Error("User not found");

      if (!geolocationService.isValidCoordinates(latitude, longitude)) {
        throw new Error("Invalid coordinates");
      }

      // Reverse geocode to get address
      const address = await geolocationService.reverseGeocode(
        latitude,
        longitude
      );

      // Update donor location
      await donor.updateLocation(latitude, longitude, address, accuracy);

      // Check for nearby urgent requests and notify
      if (donor.locationPreferences?.shareRealTimeLocation) {
        const nearbyRequests = await this.findNearbyRequests(donorId, {
          urgencyFilter: "Emergency",
          maxDistance: 25000, // 25km for emergency notifications
        });

        if (nearbyRequests.requests.length > 0) {
          // Notify donor about nearby emergency requests
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

  /**
   * Find optimal meeting points for donor-hospital pairs
   */
  async findOptimalMeetingPoints(donorId, requestId) {
    try {
      const donor = await User.findById(donorId);
      const request = await BloodRequest.findById(requestId);

      if (!donor || !request) throw new Error("Donor or request not found");

      const meetingPoint = await geolocationService.findOptimalMeetingPoint(
        donor.coordinates.coordinates[1], // latitude
        donor.coordinates.coordinates[0], // longitude
        request.coordinates.coordinates[1],
        request.coordinates.coordinates[0]
      );

      // Calculate routes from both points to meeting point
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
