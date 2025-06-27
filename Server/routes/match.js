import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import User from "../models/User.js";
import verifyToken from "../middleware/auth.js";
import { canDonateTo } from "../utils/compatability.js";
import matchingService from "../utils/matchingService.js";
import geolocationService from "../utils/geolocationService.js";
import { donorMatchingQueue } from "../queues/config.js";

const router = express.Router();

// Legacy endpoint - kept for backward compatibility
router.get("/", verifyToken, async (req, res) => {
  try {
    const donor = req.user;

    const all = await BloodRequest.find({
      fulfilled: false,
      location: donor.location,
    });

    const matches = all
      .filter((r) => canDonateTo(donor.bloodGroup, r.bloodGroup))
      .sort((a, b) => {
        const urgencyOrder = {
          Emergency: 3,
          High: 2,
          Medium: 1,
          Low: 0,
        };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

    res.status(200).json({ matches });
  } catch (error) {
    console.error("Error in legacy match endpoint:", error);
    res.status(500).json({ error: "Failed to find matches" });
  }
});

// Enhanced geolocation-based matching
router.get("/nearby", verifyToken, async (req, res) => {
  try {
    const donorId = req.user._id;
    const {
      maxDistance = 50000,
      limit = 10,
      urgencyFilter,
      includeRoutes = false,
    } = req.query;

    console.log(
      "Finding nearby requests for donor:",
      donorId,
      "with options:",
      {
        maxDistance,
        limit,
        urgencyFilter,
        includeRoutes,
      }
    );

    const options = {
      maxDistance: parseInt(maxDistance),
      limit: parseInt(limit),
      urgencyFilter,
      includeRouteInfo: includeRoutes === "true",
    };

    const result = await matchingService.findNearbyRequests(donorId, options);

    // Always return success, even if no requests found
    res.status(200).json({
      success: true,
      data: result,
      message:
        result.message ||
        (result.totalCount === 0
          ? "No blood requests found in your area"
          : undefined),
    });
  } catch (error) {
    console.error("Error finding nearby requests:", error);

    // Return a user-friendly response instead of 500 error
    res.status(200).json({
      success: true,
      data: {
        requests: [],
        totalCount: 0,
        message:
          "No blood requests found in your area. Please ensure your location is updated.",
      },
      error: error.message,
    });
  }
});

// Find compatible donors for a blood request
router.get("/donors/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const {
      maxDistance = 50000,
      limit = 20,
      sortBy = "mixed",
      includeRoutes = false,
    } = req.query;

    const options = {
      maxDistance: parseInt(maxDistance),
      limit: parseInt(limit),
      sortBy,
      includeRouteInfo: includeRoutes === "true",
    };

    const result = await matchingService.findCompatibleDonors(
      requestId,
      options
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error finding compatible donors:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to find compatible donors",
    });
  }
});

// Update donor's real-time location
router.post("/location", verifyToken, async (req, res) => {
  try {
    const donorId = req.user._id;
    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const result = await matchingService.updateDonorLocation(
      donorId,
      parseFloat(latitude),
      parseFloat(longitude),
      accuracy ? parseInt(accuracy) : null
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating donor location:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update location",
    });
  }
});

// Update user location
router.post("/location", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude, accuracy, address } = req.body;

    console.log("Location update request:", {
      userId,
      latitude,
      longitude,
      accuracy,
    });

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    // Validate coordinate ranges
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinate values",
      });
    }

    // Get address from coordinates if not provided
    let formattedAddress = address;
    if (!formattedAddress) {
      try {
        const reverseGeoResult = await geolocationService.reverseGeocode(
          latitude,
          longitude
        );
        formattedAddress = reverseGeoResult.formattedAddress;
      } catch (error) {
        console.warn("Reverse geocoding failed:", error.message);
        formattedAddress = `${latitude}, ${longitude}`;
      }
    }

    // Update user location
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "coordinates.coordinates": [longitude, latitude],
          "coordinates.type": "Point",
          "address.formattedAddress": formattedAddress,
          locationAccuracy: accuracy || 0,
          locationTimestamp: new Date(),
          location: formattedAddress, // Keep for backward compatibility
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("Location updated successfully for user:", userId);

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        coordinates: [longitude, latitude],
        address: formattedAddress,
        accuracy: accuracy || 0,
        timestamp: new Date(),
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          location: updatedUser.location,
          coordinates: updatedUser.coordinates,
          locationAccuracy: updatedUser.locationAccuracy,
          locationTimestamp: updatedUser.locationTimestamp,
        },
      },
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update location",
    });
  }
});

// Find optimal meeting points
router.get("/meeting-point/:requestId", verifyToken, async (req, res) => {
  try {
    const donorId = req.user._id;
    const { requestId } = req.params;

    const result = await matchingService.findOptimalMeetingPoints(
      donorId,
      requestId
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error finding meeting point:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to find meeting point",
    });
  }
});

// Geocode address to coordinates
router.post("/geocode", verifyToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    const result = await geolocationService.geocodeAddress(address);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error geocoding address:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to geocode address",
    });
  }
});

// Reverse geocode coordinates to address
router.post("/reverse-geocode", verifyToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const result = await geolocationService.reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to reverse geocode",
    });
  }
});

// Calculate route between two points
router.post("/route", verifyToken, async (req, res) => {
  try {
    const {
      startLat,
      startLng,
      endLat,
      endLng,
      travelMode = "driving",
    } = req.body;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        success: false,
        error: "Start and end coordinates are required",
      });
    }

    const result = await geolocationService.calculateRoute(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng),
      travelMode
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to calculate route",
    });
  }
});

// Find nearby places (hospitals, clinics)
router.get("/nearby-places", verifyToken, async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      category = "hospital",
      radius = 10000,
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const result = await geolocationService.findNearbyPlaces(
      parseFloat(latitude),
      parseFloat(longitude),
      category,
      parseInt(radius)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error finding nearby places:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to find nearby places",
    });
  }
});

// Notify nearby donors about urgent request
router.post("/notify-donors/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { maxDistance = 50000 } = req.body;

    // Verify user has permission (hospital or request owner)
    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Blood request not found",
      });
    }

    if (
      request.requester.toString() !== req.user._id.toString() &&
      !req.user.isHospital
    ) {
      return res.status(403).json({
        success: false,
        error: "Permission denied",
      });
    }

    const result = await matchingService.notifyNearbyDonors(requestId, {
      maxDistance: parseInt(maxDistance),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error notifying donors:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to notify donors",
    });
  }
});

export default router;
