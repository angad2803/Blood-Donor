import express from "express";
import verifyToken from "../middleware/auth.js";
import User from "../models/User.js";
import { addEmailJob } from "../queues/config.js";
const router = express.Router();

// Example protected route
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user.id,
  });
});
// GET NEARBY DONORS

router.get("/donors", async (req, res) => {
  try {
    const { bloodGroup, location } = req.query;

    if (!bloodGroup || !location) {
      return res
        .status(400)
        .json({ message: "bloodGroup and location are required" });
    }

    const donors = await User.find({
      bloodGroup,
      location,
      available: { $ne: false },
    }).select("-password"); // exclude password from result

    res.status(200).json({ donors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get current user (for OAuth and dashboard)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user profile (for OAuth users completing their profile and account type selection)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const {
      bloodGroup,
      location,
      isDonor,
      isHospital,
      hospitalName,
      hospitalAddress,
      hospitalLicense,
      needsAccountTypeSelection,
    } = req.body;

    // Validate required fields based on user type
    if (isHospital) {
      if (!hospitalName || !hospitalAddress || !hospitalLicense || !location) {
        return res.status(400).json({
          message:
            "Hospital name, address, license, and location are required for hospitals",
        });
      }
    } else {
      if (!bloodGroup || !location) {
        return res.status(400).json({
          message: "Blood group and location are required for individual users",
        });
      }
    }

    // Prepare update object
    const updateData = {
      location,
      isDonor: isHospital ? false : isDonor, // Hospitals can't be donors
      isHospital: isHospital || false,
      needsAccountTypeSelection:
        needsAccountTypeSelection !== undefined
          ? needsAccountTypeSelection
          : false,
    };

    // Add hospital-specific fields
    if (isHospital) {
      updateData.hospitalName = hospitalName;
      updateData.hospitalAddress = hospitalAddress;
      updateData.hospitalLicense = hospitalLicense;
      updateData.bloodGroup = undefined; // Remove blood group for hospitals
    } else {
      updateData.bloodGroup = bloodGroup;
      // Clear hospital fields for individual users
      updateData.hospitalName = undefined;
      updateData.hospitalAddress = undefined;
      updateData.hospitalLicense = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Queue profile update confirmation email
    try {
      await addEmailJob({
        to: updatedUser.email,
        template: "profile-updated",
        data: {
          name: updatedUser.name,
          accountType: isHospital
            ? "Hospital"
            : isDonor
            ? "Donor"
            : "Recipient",
          location: updatedUser.location,
          bloodGroup: updatedUser.bloodGroup,
        },
      });
      console.log(
        `📧 Profile update confirmation queued for ${updatedUser.email}`
      );
    } catch (emailError) {
      console.error("❌ Failed to queue profile update email:", emailError);
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET ALL DONORS (for hospitals)
router.get("/all-donors", verifyToken, async (req, res) => {
  try {
    // Check if user is a hospital
    const user = await User.findById(req.user.id);
    if (!user?.isHospital) {
      return res
        .status(403)
        .json({ message: "Only hospitals can view all donors" });
    }

    const { location, bloodGroup } = req.query;

    let filter = { available: true };

    // Filter by location if provided (preferably hospital's location)
    if (location) {
      filter.location = location;
    } else if (user.location) {
      filter.location = user.location;
    }

    // Filter by blood group if provided
    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    const donors = await User.find(filter)
      .select("-password -email") // exclude sensitive information
      .sort({ lastDonationDate: 1 }); // Sort by last donation date, earliest first

    res.status(200).json({
      donors,
      totalCount: donors.length,
      location: filter.location,
      bloodGroup: filter.bloodGroup,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user location
router.post("/location", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, accuracy, address } = req.body;

    console.log("User location update request:", {
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

    // Simple address format if not provided (avoid raw coordinates for privacy)
    let formattedAddress = address || "Location captured";

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
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("User location updated successfully:", userId);

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        coordinates: [longitude, latitude],
        address: formattedAddress,
        accuracy: accuracy || 0,
        timestamp: new Date(),
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update location",
    });
  }
});

// Update user location (PUT method for compatibility)
router.put("/location", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, accuracy, address } = req.body;

    console.log("User location update request:", {
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

    // Simple address format if not provided (avoid raw coordinates for privacy)
    let formattedAddress = address || "Location captured";

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
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("User location updated successfully:", userId);

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        coordinates: [longitude, latitude],
        address: formattedAddress,
        accuracy: accuracy || 0,
        timestamp: new Date(),
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update location",
    });
  }
});

// Find nearby donors using geolocation
router.get("/nearby-donors", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user has location data
    if (
      !user.coordinates ||
      !user.coordinates.coordinates ||
      (user.coordinates.coordinates[0] === 0 &&
        user.coordinates.coordinates[1] === 0)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "User location not available. Please update your location first.",
      });
    }

    const {
      maxDistance = 50000, // 50km default
      limit = 20,
      bloodGroup,
      sortBy = "distance", // distance, compatibility, mixed
      includeRoutes = false,
    } = req.query;

    console.log("Finding nearby donors for user:", userId, "with options:", {
      maxDistance,
      limit,
      bloodGroup,
      sortBy,
      includeRoutes,
    });

    // Use $near instead of $geoNear to avoid index conflicts
    const query = {
      available: { $ne: false },
      _id: { $ne: user._id },
      coordinates: {
        $near: {
          $geometry: user.coordinates,
          $maxDistance: parseInt(maxDistance),
        },
      },
    };

    // Add blood group filter if specified
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Execute the query
    let donorsQuery = User.find(query)
      .select(
        "name bloodGroup phone location coordinates address lastDonationDate available locationTimestamp"
      )
      .limit(parseInt(limit));

    // Sort based on sortBy parameter (distance sorting is automatic with $near)
    if (sortBy === "compatibility") {
      // For compatibility sorting, we need to handle it differently
      donorsQuery = donorsQuery.sort({ bloodGroup: 1 });
    }

    const donors = await donorsQuery;

    // Calculate distances manually for each donor
    const donorsWithDistance = donors.map((donor) => {
      let distance = 0;
      if (donor.coordinates && donor.coordinates.coordinates) {
        // Calculate distance using Haversine formula
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (user.coordinates.coordinates[1] * Math.PI) / 180; // φ, λ in radians
        const φ2 = (donor.coordinates.coordinates[1] * Math.PI) / 180;
        const Δφ =
          ((donor.coordinates.coordinates[1] -
            user.coordinates.coordinates[1]) *
            Math.PI) /
          180;
        const Δλ =
          ((donor.coordinates.coordinates[0] -
            user.coordinates.coordinates[0]) *
            Math.PI) /
          180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        distance = R * c; // in metres
      }

      return {
        ...donor.toObject(),
        distance: distance,
      };
    });

    // Apply custom sorting if needed
    if (sortBy === "compatibility") {
      donorsWithDistance.sort((a, b) => {
        const aScore =
          a.bloodGroup === user.bloodGroup
            ? 3
            : a.bloodGroup === "O-"
            ? 2
            : a.bloodGroup === "O+"
            ? 1
            : 0;
        const bScore =
          b.bloodGroup === user.bloodGroup
            ? 3
            : b.bloodGroup === "O-"
            ? 2
            : b.bloodGroup === "O+"
            ? 1
            : 0;
        return bScore - aScore || a.distance - b.distance;
      });
    } else if (sortBy === "mixed") {
      donorsWithDistance.sort((a, b) => {
        const aCompatScore =
          a.bloodGroup === user.bloodGroup
            ? 1000
            : a.bloodGroup === "O-"
            ? 800
            : a.bloodGroup === "O+"
            ? 600
            : 400;
        const bCompatScore =
          b.bloodGroup === user.bloodGroup
            ? 1000
            : b.bloodGroup === "O-"
            ? 800
            : b.bloodGroup === "O+"
            ? 600
            : 400;

        const aMixedScore =
          aCompatScore * 0.6 + (parseInt(maxDistance) - a.distance) * 0.4;
        const bMixedScore =
          bCompatScore * 0.6 + (parseInt(maxDistance) - b.distance) * 0.4;

        return bMixedScore - aMixedScore;
      });
    }
    // Distance sorting is already handled by $near

    // Add route information if requested
    if (includeRoutes === "true" && donorsWithDistance.length > 0) {
      const geolocationService = (
        await import("../utils/geolocationService.js")
      ).default;

      for (const donor of donorsWithDistance) {
        if (donor.coordinates && donor.coordinates.coordinates) {
          try {
            const route = await geolocationService.calculateRoute(
              user.coordinates.coordinates[1], // user lat
              user.coordinates.coordinates[0], // user lng
              donor.coordinates.coordinates[1], // donor lat
              donor.coordinates.coordinates[0] // donor lng
            );
            donor.routeInfo = route;
          } catch (error) {
            console.warn(
              `Failed to calculate route for donor ${donor._id}:`,
              error.message
            );
            donor.routeInfo = null;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        donors: donorsWithDistance.map((donor) => ({
          _id: donor._id,
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          phone: donor.phone,
          location: donor.location || donor.address?.formattedAddress,
          coordinates: donor.coordinates,
          distance: Math.round(donor.distance),
          lastDonationDate: donor.lastDonationDate,
          available: donor.available,
          routeInfo: donor.routeInfo,
          locationTimestamp: donor.locationTimestamp,
        })),
        totalCount: donorsWithDistance.length,
        searchCenter: {
          coordinates: user.coordinates.coordinates,
          address: user.address?.formattedAddress || user.location,
        },
        searchRadius: parseInt(maxDistance),
        message:
          donorsWithDistance.length === 0
            ? `No ${
                bloodGroup ? bloodGroup + " " : ""
              }donors found within ${Math.round(
                parseInt(maxDistance) / 1000
              )}km of your location.`
            : undefined,
      },
    });
  } catch (error) {
    console.error("Error finding nearby donors:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to find nearby donors",
    });
  }
});

export default router;
