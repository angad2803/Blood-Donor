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

export default router;
