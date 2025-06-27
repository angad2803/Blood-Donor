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
  offers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
  ],
  acceptedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    default: null,
  },
  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
});

// Create 2dsphere index for geospatial queries
bloodRequestSchema.index({ coordinates: "2dsphere" });

export default mongoose.model("BloodRequest", bloodRequestSchema);
