import express from "express";
import BloodRequest from "../models/BloodRequest.js";
import verifyToken from "../middleware/auth.js";
import User from "../models/User.js";
import { canDonateTo } from "../utils/compatability.js";
import passport from "passport";
// Ensure you have passport configured properly in your main server file
const router = express.Router();
// Redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login", // frontend fallback
  }),
  (req, res) => {
    // Send JWT token or redirect with token
    const token = req.user.token;
    res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
  }
);
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
    const requests = await BloodRequest.find()
      .populate("requester", "name bloodGroup location")
      .populate("fulfilledBy", "name")
      .populate("fulfillmentOffers.donor", "name bloodGroup")
      .populate("acceptedOffer", "name");

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route: Donor sends fulfillment offer
router.post("/:id/offer", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Request already fulfilled" });

    // Check if donor already made an offer
    const existingOffer = request.fulfillmentOffers.find(
      (offer) => offer.donor.toString() === req.user._id.toString()
    );

    if (existingOffer) {
      return res
        .status(400)
        .json({ message: "You have already made an offer for this request" });
    }

    // Add new offer
    request.fulfillmentOffers.push({
      donor: req.user._id,
      message: message || "I would like to help with this blood request.",
      status: "pending",
    });

    await request.save();

    // Emit socket event to notify requester
    const io = req.app.get("io");
    if (io) {
      io.emit("new-fulfillment-offer", {
        requestId: request._id,
        donorName: req.user.name,
        message,
      });
    }

    res.status(200).json({ message: "Fulfillment offer sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route: Requester accepts/rejects offer
router.put("/:id/offer/:offerId/:action", verifyToken, async (req, res) => {
  try {
    const { id, offerId, action } = req.params;

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be 'accept' or 'reject'" });
    }

    const request = await BloodRequest.findById(id).populate(
      "fulfillmentOffers.donor",
      "name"
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Request already fulfilled" });

    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the requester can accept/reject offers" });
    }

    const offer = request.fulfillmentOffers.id(offerId);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (action === "accept") {
      // Accept the offer and mark request as fulfilled
      offer.status = "accepted";
      request.fulfilled = true;
      request.fulfilledBy = offer.donor._id;
      request.acceptedOffer = offer.donor._id;
      request.fulfilledAt = new Date();

      // Reject all other pending offers
      request.fulfillmentOffers.forEach((otherOffer) => {
        if (
          otherOffer._id.toString() !== offerId &&
          otherOffer.status === "pending"
        ) {
          otherOffer.status = "rejected";
        }
      });
    } else {
      // Reject the offer
      offer.status = "rejected";
    }

    await request.save();

    // Emit socket event to notify donor
    const io = req.app.get("io");
    if (io) {
      io.emit("offer-response", {
        requestId: request._id,
        donorId: offer.donor._id,
        action,
        requesterName: req.user.name,
      });
    }

    res.status(200).json({
      message: `Offer ${action}ed successfully`,
      fulfilled: request.fulfilled,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Legacy route - kept for backward compatibility but now deprecated
router.put("/:id/fulfill", verifyToken, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Already fulfilled" });

    request.fulfilled = true;
    request.fulfilledBy = req.user.id;
    request.fulfilledAt = new Date();

    await request.save();

    res.status(200).json({ message: "Request marked as fulfilled" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/all", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isDonor) {
      return res
        .status(403)
        .json({ message: "Only donors can view nearby requests" });
    }

    const allRequests = await BloodRequest.find({ fulfilled: false });

    const matched = allRequests.filter(
      (req) =>
        canDonateTo(user.bloodGroup, req.bloodGroup) &&
        req.location === user.location
    );

    res.status(200).json({ requests: matched });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
