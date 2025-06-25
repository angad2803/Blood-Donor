import express from "express";
import verifyToken from "../middleware/auth.js";
import User from "../models/User.js";
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
      isDonor: true,
      bloodGroup,
      location,
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

    let filter = { isDonor: true, available: true };

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

export default router;
