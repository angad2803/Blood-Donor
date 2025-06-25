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
  const { bloodGroup, location, hospital, urgency } = req.body;
  console.log("Creating request:", {
    bloodGroup,
    location,
    hospital,
    urgency,
    requester: req.user._id,
  });

  try {
    const newRequest = new BloodRequest({
      requester: req.user._id,
      bloodGroup,
      location,
      hospital,
      urgency,
    });
    await newRequest.save();
    console.log("Request saved:", newRequest);

    // Emit socket event only after save
    const io = req.app.get("io");
    if (io) io.emit("new-blood-request", newRequest);
    res
      .status(201)
      .json({ message: "Blood request created", request: newRequest });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all active blood requests
router.get("/all", verifyToken, async (req, res) => {
  try {
    console.log("GET /all called by user:", req.user);
    const requests = await BloodRequest.find()
      .populate("requester", "name bloodGroup location")
      .populate("fulfilledBy", "name")
      .populate("fulfillmentOffers.donor", "name bloodGroup")
      .populate("acceptedOffer", "name");

    console.log("Found requests:", requests.length);
    console.log("Sample request:", requests[0] || "No requests found");

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Error in /all route:", err);
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
    console.log("Processing offer response:", {
      id,
      offerId,
      action,
      userId: req.user._id,
    });

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

    console.log("Found offer:", offer);
    console.log("Offer donor:", offer.donor);

    if (action === "accept") {
      // Accept the offer but DON'T mark as fulfilled yet
      offer.status = "accepted";
      // Fix: Get the donor ID properly - it might be an object or just an ID
      const donorId = offer.donor._id || offer.donor;
      request.acceptedOffer = donorId;
      console.log("Setting acceptedOffer to:", donorId);
      // Note: We don't set fulfilled = true here - that happens only after donation confirmation

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
    console.log("Request saved successfully");

    // Emit socket event to notify donor
    const donorId = offer.donor._id || offer.donor;
    const io = req.app.get("io");
    if (io) {
      io.emit("offer-response", {
        requestId: request._id,
        donorId: donorId,
        action,
        requesterName: req.user.name,
      });
    }

    res.status(200).json({
      message: `Offer ${action}ed successfully`,
      fulfilled: request.fulfilled,
      acceptedDonor: action === "accept" ? offer.donor : null,
    });
  } catch (err) {
    console.error("Error in offer response route:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route: Donor marks blood as donated (replaces old fulfill functionality)
router.put("/:id/mark-donated", verifyToken, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Request already fulfilled" });

    // Check if user is the accepted donor
    if (
      !request.acceptedOffer ||
      request.acceptedOffer.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Only the accepted donor can mark blood as donated" });
    }

    request.bloodDonated = true;
    request.donationConfirmedAt = new Date();

    await request.save();

    // Emit socket event to notify requester for confirmation
    const io = req.app.get("io");
    if (io) {
      io.emit("blood-donation-claim", {
        requestId: request._id,
        donorName: req.user.name,
        hospital: request.hospital,
      });
    }

    res.status(200).json({
      message: "Blood donation marked. Awaiting requester confirmation.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route: Requester confirms blood donation
router.put("/:id/confirm-donation", verifyToken, async (req, res) => {
  try {
    const { confirmed } = req.body; // true/false
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Request already fulfilled" });

    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the requester can confirm donation" });
    }

    if (!request.bloodDonated) {
      return res
        .status(400)
        .json({ message: "Donor hasn't marked blood as donated yet" });
    }

    if (confirmed) {
      // Confirm donation - mark as fulfilled
      request.fulfilled = true;
      request.fulfilledBy = request.acceptedOffer;
      request.fulfilledAt = new Date();
    } else {
      // Reject donation claim - reset back to accepted offer state
      request.bloodDonated = false;
      request.donationConfirmedAt = null;
    }

    await request.save();

    // Emit socket event to notify donor
    const io = req.app.get("io");
    if (io) {
      io.emit("donation-confirmation", {
        requestId: request._id,
        donorId: request.acceptedOffer,
        confirmed,
        requesterName: req.user.name,
      });
    }

    res.status(200).json({
      message: confirmed
        ? "Blood donation confirmed! Request marked as fulfilled."
        : "Donation claim rejected.",
      fulfilled: request.fulfilled,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// NEW: Route for requester/hospital to fulfill accepted offers directly
router.put("/:id/fulfill-offer", verifyToken, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      "requester",
      "name"
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.fulfilled)
      return res.status(400).json({ message: "Request already fulfilled" });

    // Check if there's an accepted offer
    if (!request.acceptedOffer) {
      return res.status(400).json({ message: "No accepted offer to fulfill" });
    }

    // Check if user is the requester or a hospital (for hospital requests)
    const isRequester =
      request.requester._id.toString() === req.user._id.toString();
    const isHospitalForThisRequest =
      req.user.isHospital &&
      req.user.hospitalName &&
      request.hospital === req.user.hospitalName;

    if (!isRequester && !isHospitalForThisRequest) {
      return res
        .status(403)
        .json({
          message:
            "Only the requester or assigned hospital can fulfill this request",
        });
    }

    // Mark as fulfilled
    request.fulfilled = true;
    request.fulfilledBy = request.acceptedOffer;
    request.fulfilledAt = new Date();

    await request.save();

    // Emit socket event to notify donor
    const io = req.app.get("io");
    if (io) {
      io.emit("request-fulfilled", {
        requestId: request._id,
        donorId: request.acceptedOffer,
        fulfilledBy: req.user.name,
        isHospital: req.user.isHospital,
      });
    }

    res.status(200).json({
      message: "Request marked as fulfilled successfully!",
      fulfilled: true,
    });
  } catch (err) {
    console.error("Error in fulfill-offer route:", err);
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

export default router;
