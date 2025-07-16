import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitsOffered: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    donorLocation: {
      type: String,
      required: true,
    },
    availability: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for blood request lookups
offerSchema.index({ bloodRequest: 1 });

// Index for donor lookups
offerSchema.index({ donor: 1 });

// Index for status queries
offerSchema.index({ status: 1 });

// TTL index for automatic expiration
offerSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
