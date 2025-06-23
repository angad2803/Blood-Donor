import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new blood request
router.post("/create", protect, async (req, res) => {
  const { bloodGroup, location, urgency } = req.body;

  try {
    const newRequest = new BloodRequest({
      requester: req.user._id,
      bloodGroup,
      location,
      urgency,
    });

    await newRequest.save();
    res
      .status(201)
      .json({ message: "Blood request created", request: newRequest });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all active blood requests
router.get("/all", async (req, res) => {
  try {
    const requests = await BloodRequest.find({ fulfilled: false }).populate(
      "requester",
      "name bloodGroup location"
    );
    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
