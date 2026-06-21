import express from "express";
import Offer from "../models/Offer.js";
import BloodRequest from "../models/BloodRequest.js";
import User from "../models/User.js";
import verifyToken from "../middleware/auth.js";
import { addEmailJob } from "../queues/config.js";

const router = express.Router();


router.post("/send", verifyToken, async (req, res) => {
  try {
    const { requestId, message } = req.body;
    const donorId = req.user._id;


    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.fulfilled) {
      return res
        .status(400)
        .json({ message: "Blood request already fulfilled" });
    }


    const existingOffer = await Offer.findOne({
      bloodRequest: requestId,
      donor: donorId,
    });

    if (existingOffer) {
      return res
        .status(400)
        .json({ message: "You have already sent an offer for this request" });
    }


    const offer = new Offer({
      bloodRequest: requestId,
      donor: donorId,
      message,
    });

    await offer.save();


    bloodRequest.offers.push(offer._id);
    await bloodRequest.save();


    await offer.populate("donor", "name bloodGroup location");


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


router.get("/request/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;


    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (bloodRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }


    const offers = await Offer.find({ bloodRequest: requestId })
      .populate("donor", "name bloodGroup location coordinates")
      .sort({ createdAt: -1 });

    res.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post("/accept/:offerId", verifyToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;


    const offer = await Offer.findById(offerId).populate("bloodRequest");
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }


    if (offer.bloodRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }


    if (offer.bloodRequest.fulfilled) {
      return res
        .status(400)
        .json({ message: "Blood request already fulfilled" });
    }


    offer.status = "accepted";
    offer.respondedAt = new Date();
    await offer.save();


    const bloodRequest = offer.bloodRequest;
    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledBy = offer.donor;
    bloodRequest.fulfilledAt = new Date();
    bloodRequest.acceptedOffer = offerId;
    await bloodRequest.save();


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


    await offer.populate("donor", "name bloodGroup location coordinates");


    try {
      const donor = await User.findById(offer.donor);
      const requester = await User.findById(bloodRequest.requester);


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


router.get("/my-offers", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const offers = await Offer.find({ donor: userId })
      .populate({
        path: "bloodRequest",
        select: "bloodGroup location urgency fulfilled createdAt requester",
        populate: {
          path: "requester",
          select: "name location coordinates"
        }
      })
      .sort({ createdAt: -1 });

    res.json({ offers });
  } catch (error) {
    console.error("Error fetching user offers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


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
