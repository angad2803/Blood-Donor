import express from "express";
import verifyToken from "../middleware/auth.js";
import User from "../models/User.js";
import { addEmailJob } from "../queues/config.js";
const router = express.Router();


router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user.id,
  });
});


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
    }).select("-password");

    res.status(200).json({ donors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


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


    const updateData = {
      location,
      isDonor: isHospital ? false : isDonor,
      isHospital: isHospital || false,
      needsAccountTypeSelection:
        needsAccountTypeSelection !== undefined
          ? needsAccountTypeSelection
          : false,
    };


    if (isHospital) {
      updateData.hospitalName = hospitalName;
      updateData.hospitalAddress = hospitalAddress;
      updateData.hospitalLicense = hospitalLicense;
      updateData.bloodGroup = undefined;
    } else {
      updateData.bloodGroup = bloodGroup;

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


router.put("/complete-profile", verifyToken, async (req, res) => {
  try {
    const { bloodGroup, location, isDonor } = req.body;


    if (!bloodGroup || !location) {
      return res.status(400).json({
        message: "Blood group and location are required",
      });
    }


    const updateData = {
      bloodGroup,
      location,
      isDonor: isDonor || false,
      profileComplete: true,
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }


    try {
      await addEmailJob({
        to: updatedUser.email,
        template: "profile-completed",
        data: {
          name: updatedUser.name,
          bloodGroup: updatedUser.bloodGroup,
          location: updatedUser.location,
          isDonor: updatedUser.isDonor,
        },
      });
      console.log(
        `📧 Profile completion welcome email queued for ${updatedUser.email}`
      );
    } catch (emailError) {
      console.error("❌ Failed to queue welcome email:", emailError);
    }

    res.json({
      message: "Profile completed successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error completing profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.get("/all-donors", verifyToken, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);
    if (!user?.isHospital) {
      return res
        .status(403)
        .json({ message: "Only hospitals can view all donors" });
    }

    const { location, bloodGroup } = req.query;

    let filter = { available: true };


    if (location) {
      filter.location = location;
    } else if (user.location) {
      filter.location = user.location;
    }


    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    const donors = await User.find(filter)
      .select("-password -email")
      .sort({ lastDonationDate: 1 });

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


    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }


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


    let formattedAddress = address || "Location captured";


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "coordinates.coordinates": [longitude, latitude],
          "coordinates.type": "Point",
          "address.formattedAddress": formattedAddress,
          locationAccuracy: accuracy || 0,
          locationTimestamp: new Date(),
          location: formattedAddress,
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


    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }


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


    let formattedAddress = address || "Location captured";


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "coordinates.coordinates": [longitude, latitude],
          "coordinates.type": "Point",
          "address.formattedAddress": formattedAddress,
          locationAccuracy: accuracy || 0,
          locationTimestamp: new Date(),
          location: formattedAddress,
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


router.post("/reverse-geocode", verifyToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;


    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }


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


    const { default: GeolocationService } = await import(
      "../utils/geolocationService.js"
    );
    const geolocationService = new GeolocationService();

    try {
      const addressData = await geolocationService.reverseGeocode(
        latitude,
        longitude
      );

      res.status(200).json({
        success: true,
        message: "Address retrieved successfully",
        data: {
          address:
            addressData.formattedAddress ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          details: addressData,
          coordinates: { latitude, longitude },
        },
      });
    } catch (geocodeError) {
      console.error("Reverse geocoding failed:", geocodeError);


      res.status(200).json({
        success: true,
        message: "Coordinates captured (address lookup failed)",
        data: {
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          coordinates: { latitude, longitude },
        },
      });
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to reverse geocode location",
    });
  }
});


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
      maxDistance = 50000,
      limit = 20,
      bloodGroup,
      sortBy = "distance",
      includeRoutes = false,
    } = req.query;

    console.log("Finding nearby donors for user:", userId, "with options:", {
      maxDistance,
      limit,
      bloodGroup,
      sortBy,
      includeRoutes,
    });


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


    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }


    let donorsQuery = User.find(query)
      .select(
        "name bloodGroup phone location coordinates address lastDonationDate available locationTimestamp"
      )
      .limit(parseInt(limit));


    if (sortBy === "compatibility") {

      donorsQuery = donorsQuery.sort({ bloodGroup: 1 });
    }

    const donors = await donorsQuery;


    const donorsWithDistance = donors.map((donor) => {
      let distance = 0;
      if (donor.coordinates && donor.coordinates.coordinates) {

        const R = 6371e3;
        const φ1 = (user.coordinates.coordinates[1] * Math.PI) / 180;
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

        distance = R * c;
      }

      return {
        ...donor.toObject(),
        distance: distance,
      };
    });


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



    if (includeRoutes === "true" && donorsWithDistance.length > 0) {
      const geolocationService = (
        await import("../utils/geolocationService.js")
      ).default;

      for (const donor of donorsWithDistance) {
        if (donor.coordinates && donor.coordinates.coordinates) {
          try {
            const route = await geolocationService.calculateRoute(
              user.coordinates.coordinates[1],
              user.coordinates.coordinates[0],
              donor.coordinates.coordinates[1],
              donor.coordinates.coordinates[0]
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
