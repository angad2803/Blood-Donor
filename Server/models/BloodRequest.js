import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  hospital: {
    type: String,
    required: true,
  },
  urgency: {
    type: String,
    enum: ["Low", "Medium", "High", "Emergency"],
    default: "Medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fulfilled: {
    type: Boolean,
    default: false,
  },
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  fulfilledAt: {
    type: Date,
    default: null,
  },
  // New fields for fulfillment offers
  fulfillmentOffers: [
    {
      donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      offeredAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      message: {
        type: String,
        default: "",
      },
    },
  ],
  acceptedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  // New field to track if blood was actually donated
  bloodDonated: {
    type: Boolean,
    default: false,
  },
  donationConfirmedAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("BloodRequest", bloodRequestSchema);
