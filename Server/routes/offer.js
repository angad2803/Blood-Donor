import express from "express";
import Offer from "../models/Offer.js";
import BloodRequest from "../models/BloodRequest.js";
import User from "../models/User.js";
import verifyToken from "../middleware/auth.js";
import { addEmailJob } from "../queues/config.js";

const router = express.Router();

// Send an offer to a blood request
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { requestId, message } = req.body;
    const donorId = req.user._id;

    // Check if the blood request exists and is not fulfilled
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.fulfilled) {
      return res
        .status(400)
        .json({ message: "Blood request already fulfilled" });
    }

    // Check if donor already sent an offer for this request
    const existingOffer = await Offer.findOne({
      bloodRequest: requestId,
      donor: donorId,
    });

    if (existingOffer) {
      return res
        .status(400)
        .json({ message: "You have already sent an offer for this request" });
    }

    // Create the offer
    const offer = new Offer({
      bloodRequest: requestId,
      donor: donorId,
      message,
    });

    await offer.save();

    // Add offer to blood request
    bloodRequest.offers.push(offer._id);
    await bloodRequest.save();

    // Populate donor info for response
    await offer.populate("donor", "name bloodGroup location");

    // Queue email notification to requester about new offer
    try {
      const requester = await User.findById(bloodRequest.requester);
      if (requester) {
        await addEmailJob({
          to: requester.email,
          template: "new-offer-received",
          data: {
            requesterName: requester.name,
            donorName: req.user.name,
            donorBloodGroup: req.user.bloodGroup,
            donorLocation: req.user.location,
            message: message || "No message provided",
            requestBloodGroup: bloodRequest.bloodGroup,
            requestLocation: bloodRequest.location,
            offerId: offer._id,
          },
        });
        console.log(
          `📧 New offer notification queued for requester ${requester.email}`
        );
      }
    } catch (emailError) {
      console.error("❌ Failed to queue offer notification:", emailError);
    }

    res.status(201).json({
      message: "Offer sent successfully",
      offer,
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all offers for a blood request (for requesters)
router.get("/request/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Check if user is the requester
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all offers for this request
    const offers = await Offer.find({ bloodRequest: requestId })
      .populate("donor", "name bloodGroup location coordinates")
      .sort({ createdAt: -1 });

    res.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Accept an offer
router.post("/accept/:offerId", verifyToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;

    // Find the offer
    const offer = await Offer.findById(offerId).populate("bloodRequest");
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the requester
    if (offer.bloodRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if request is already fulfilled
    if (offer.bloodRequest.fulfilled) {
      return res
        .status(400)
        .json({ message: "Blood request already fulfilled" });
    }

    // Accept the offer
    offer.status = "accepted";
    offer.respondedAt = new Date();
    await offer.save();

    // Mark blood request as fulfilled
    const bloodRequest = offer.bloodRequest;
    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledBy = offer.donor;
    bloodRequest.fulfilledAt = new Date();
    bloodRequest.acceptedOffer = offerId;
    await bloodRequest.save();

    // Reject all other pending offers for this request
    await Offer.updateMany(
      {
        bloodRequest: bloodRequest._id,
        _id: { $ne: offerId },
        status: "pending",
      },
      {
        status: "rejected",
        respondedAt: new Date(),
      }
    );

    // Populate donor info for response
    await offer.populate("donor", "name bloodGroup location coordinates");

    // Queue email notifications for offer acceptance
    try {
      const donor = await User.findById(offer.donor);
      const requester = await User.findById(bloodRequest.requester);

      // Notify donor that their offer was accepted
      if (donor) {
        await addEmailJob({
          to: donor.email,
          template: "offer-accepted",
          data: {
            donorName: donor.name,
            requesterName: requester.name,
            bloodGroup: bloodRequest.bloodGroup,
            location: bloodRequest.location,
            urgency: bloodRequest.urgency,
            message: offer.message || "No message provided",
            offerId: offer._id,
          },
        });
        console.log(
          `📧 Offer acceptance notification queued for donor ${donor.email}`
        );
      }

      // Notify requester with donor contact details
      if (requester) {
        await addEmailJob({
          to: requester.email,
          template: "request-fulfilled",
          data: {
            requesterName: requester.name,
            donorName: donor.name,
            donorEmail: donor.email,
            donorPhone: donor.phone || "Not provided",
            bloodGroup: bloodRequest.bloodGroup,
            location: bloodRequest.location,
            urgency: bloodRequest.urgency,
            offerId: offer._id,
          },
        });
        console.log(
          `📧 Request fulfillment notification queued for requester ${requester.email}`
        );
      }

      // Notify other donors that their offers were rejected
      const rejectedOffers = await Offer.find({
        bloodRequest: bloodRequest._id,
        _id: { $ne: offerId },
        status: "rejected",
      }).populate("donor");

      for (const rejectedOffer of rejectedOffers) {
        if (rejectedOffer.donor) {
          await addEmailJob({
            to: rejectedOffer.donor.email,
            template: "offer-rejected",
            data: {
              donorName: rejectedOffer.donor.name,
              bloodGroup: bloodRequest.bloodGroup,
              location: bloodRequest.location,
              offerId: rejectedOffer._id,
            },
          });
        }
      }
      console.log(
        `📧 Rejection notifications queued for ${rejectedOffers.length} other donors`
      );
    } catch (emailError) {
      console.error("❌ Failed to queue acceptance notifications:", emailError);
    }

    res.json({
      message: "Offer accepted successfully",
      offer,
      bloodRequest,
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get offers sent by the current user (for donors)
router.get("/my-offers", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const offers = await Offer.find({ donor: userId })
      .populate(
        "bloodRequest",
        "bloodGroup location urgency fulfilled createdAt"
      )
      .populate("bloodRequest.requester", "name location coordinates")
      .sort({ createdAt: -1 });

    res.json({ offers });
  } catch (error) {
    console.error("Error fetching user offers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get accepted offers for the current user (for donors to get routing info)
router.get("/accepted", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const acceptedOffers = await Offer.find({
      donor: userId,
      status: "accepted",
    })
      .populate({
        path: "bloodRequest",
        populate: {
          path: "requester",
          select: "name email phone location coordinates",
        },
      })
      .sort({ respondedAt: -1 });

    res.json({ acceptedOffers });
  } catch (error) {
    console.error("Error fetching accepted offers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
