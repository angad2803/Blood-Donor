import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["normal", "urgent", "critical"],
      default: "normal",
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "fulfilled", "cancelled", "expired"],
      default: "active",
    },
    offers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
    ],
    acceptedOffers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
    ],
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
    expiresAt: {
      type: Date,
      default: function () {
        const expiryDays =
          this.urgency === "critical" ? 1 : this.urgency === "urgent" ? 3 : 7;
        return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
      },
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    sharedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
bloodRequestSchema.index({ coordinates: "2dsphere" });

// Index for status and urgency queries
bloodRequestSchema.index({ status: 1, urgency: 1 });

// Index for requester lookups
bloodRequestSchema.index({ requester: 1 });

// Index for blood type queries
bloodRequestSchema.index({ bloodType: 1 });

// TTL index for automatic expiration
bloodRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BloodRequest ||
  mongoose.model("BloodRequest", bloodRequestSchema);
