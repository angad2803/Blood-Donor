import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Create a new blood request
router.post("/create", verifyToken, async (req, res) => {
  const { bloodGroup, location, urgency } = req.body;
  try {
    const newRequest = new BloodRequest({
      requester: req.user._id,
      bloodGroup,
      location,
      urgency,
    });
    await newRequest.save();
    // Emit socket event only after save
    const io = req.app.get("io");
    if (io) io.emit("new-blood-request", newRequest);
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
router.put("/:id/fulfill", verifyToken, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.fulfilled) {
      return res.status(400).json({ message: "Request is already fulfilled" });
    }

    request.fulfilled = true;
    request.fulfilledBy = req.user.id; // save donor id from token
    await request.save();

    res.status(200).json({ message: "Request marked as fulfilled" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
