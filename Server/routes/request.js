import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import verifyToken from "../middleware/auth.js";
import { addEmailJob, urgentNotificationQueue } from "../queues/config.js";

const router = express.Router();

// Helper function to validate that location is not raw coordinates
function isValidLocationString(location) {
  // Check if location looks like coordinates (e.g., "30.644634, 76.837683")
  const coordinatePattern = /^-?\d+\.\d+,?\s*-?\d+\.\d+$/;
  return !coordinatePattern.test(location.trim());
}

// Create a new blood request
router.post("/create", verifyToken, async (req, res) => {
  const { bloodGroup, location, urgency, coordinates } = req.body;

  try {
    // Validate that location is not raw coordinates for privacy
    if (!isValidLocationString(location)) {
      return res.status(400).json({
        message:
          "Invalid location format. Please provide a descriptive location instead of coordinates for privacy reasons.",
      });
    }

    const requestData = {
      requester: req.user._id,
      bloodGroup,
      location,
      urgency,
    };

    // Add coordinates if provided, otherwise use user's coordinates
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      requestData.coordinates = {
        type: "Point",
        coordinates: [coordinates.longitude, coordinates.latitude],
      };
    } else if (req.user.coordinates && req.user.coordinates.coordinates) {
      requestData.coordinates = req.user.coordinates;
    }

    const newRequest = new BloodRequest(requestData);
    await newRequest.save();

    // Queue urgent notification if urgency is high
    if (urgency === "urgent" || urgency === "critical") {
      try {
        await urgentNotificationQueue.add("urgent-blood-request", {
          requestId: newRequest._id,
          bloodGroup,
          location,
          urgency,
          hospital: req.user.hospitalName || "Not specified",
          requesterName: req.user.name,
        });
        console.log(
          `🚨 Urgent notification queued for ${bloodGroup} request in ${location}`
        );
      } catch (queueError) {
        console.error("❌ Failed to queue urgent notification:", queueError);
        // Don't fail the request creation if queue fails
      }
    }

    // Queue regular email notification to requester
    try {
      await addEmailJob({
        to: req.user.email,
        template: "request-created",
        data: {
          requesterName: req.user.name,
          bloodGroup,
          location,
          urgency,
          requestId: newRequest._id,
        },
      });
      console.log(`📧 Request confirmation email queued for ${req.user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to queue confirmation email:", emailError);
    }

    res.status(201).json({
      message: "Blood request created",
      request: newRequest,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all active blood requests
router.get("/all", async (req, res) => {
  try {
    const requests = await BloodRequest.find({ fulfilled: false })
      .populate("requester", "name bloodGroup location coordinates")
      .populate("offers")
      .sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get requests created by the current user
router.get("/my-requests", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await BloodRequest.find({ requester: userId })
      .populate({
        path: "offers",
        populate: {
          path: "donor",
          select: "name bloodGroup location coordinates",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fulfill a blood request (for hospitals)
router.put("/:requestId/fulfill", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { hospitalName } = req.body;

    // Check if user is a hospital
    if (!req.user.isHospital) {
      return res.status(403).json({
        message: "Only hospitals can fulfill blood requests",
      });
    }

    // Find and update the blood request
    const bloodRequest = await BloodRequest.findById(requestId).populate(
      "requester",
      "name email"
    );

    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.fulfilled) {
      return res.status(400).json({
        message: "Blood request is already fulfilled",
      });
    }

    // Mark as fulfilled
    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledBy = req.user._id;
    bloodRequest.fulfilledAt = new Date();
    bloodRequest.hospitalName = hospitalName || req.user.hospitalName;
    await bloodRequest.save();

    // Queue notification email to requester
    try {
      if (bloodRequest.requester?.email) {
        await addEmailJob({
          to: bloodRequest.requester.email,
          template: "request-fulfilled-by-hospital",
          data: {
            requesterName: bloodRequest.requester.name,
            bloodGroup: bloodRequest.bloodGroup,
            location: bloodRequest.location,
            hospitalName: bloodRequest.hospitalName,
            contactEmail: req.user.email,
            requestId: bloodRequest._id,
          },
        });
        console.log(
          `📧 Hospital fulfillment notification queued for ${bloodRequest.requester.email}`
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Failed to queue hospital fulfillment email:",
        emailError
      );
    }

    res.json({
      message: "Blood request marked as fulfilled successfully",
      request: bloodRequest,
    });
  } catch (error) {
    console.error("Error fulfilling request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
