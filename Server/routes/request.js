import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import verifyToken from "../middleware/auth.js";
import { addEmailJob, urgentNotificationQueue } from "../queues/config.js";

const router = express.Router();


function isValidLocationString(location) {

  const coordinatePattern = /^-?\d+\.\d+,?\s*-?\d+\.\d+$/;
  return !coordinatePattern.test(location.trim());
}


router.post("/create", verifyToken, async (req, res) => {
  const { bloodGroup, location, urgency, coordinates } = req.body;

  try {

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

    // Populate requester so the socket payload matches what the frontend expects
    await newRequest.populate("requester", "name bloodGroup location coordinates");

    // Emit real-time event so all connected dashboards update instantly
    const io = req.app.get("io");
    if (io) {
      // Broadcast to all clients (Browse Requests list)
      io.emit("request:created", newRequest);
      // Also emit to the requester's personal room so their "My Requests" tab updates
      io.to(`user:${req.user._id}`).emit("my-request:created", newRequest);
    }

    if (urgency === "High" || urgency === "Emergency") {
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

      }
    }


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


router.put("/:requestId/fulfill", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { hospitalName } = req.body;


    // NOTE: This endpoint is deprecated for hospitals. Hospitals should create a request
    // and accept offers from donors. We leave this here for backwards compatibility or
    // other specific admin/staff overrides if needed, but the primary flow is via offers.
    if (!req.user.isHospital && !req.user.isAdmin) {
      return res.status(403).json({
        message: "Access denied",
      });
    }


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


    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledBy = req.user._id;
    bloodRequest.fulfilledAt = new Date();
    bloodRequest.hospitalName = hospitalName || req.user.hospitalName;
    await bloodRequest.save();


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

router.put("/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const bloodRequest = await BloodRequest.findById(requestId);

    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the requester can mark this as fulfilled" });
    }

    if (bloodRequest.fulfilled) {
      return res.status(400).json({ message: "Blood request is already fulfilled" });
    }

    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledAt = new Date();
    await bloodRequest.save();

    // Real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("request:fulfilled", { requestId: bloodRequest._id });
      io.emit("request:fulfilled", { requestId: bloodRequest._id });
    }

    res.json({
      message: "Blood request marked as fulfilled successfully",
      request: bloodRequest,
    });
  } catch (error) {
    console.error("Error marking request as fulfilled:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
