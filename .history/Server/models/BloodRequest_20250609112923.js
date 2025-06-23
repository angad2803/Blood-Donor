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
});

export default mongoose.model("BloodRequest", bloodRequestSchema);
