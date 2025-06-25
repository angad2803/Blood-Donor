import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
    },
    bloodGroup: {
      type: String,
      required: function () {
        // Only require if not a Google OAuth user with default values
        return !(this.googleId && this.bloodGroup === "O+");
      },
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    location: {
      type: String,
      required: function () {
        // Only require if not a Google OAuth user with default values
        return !(this.googleId && this.location === "Unknown");
      },
    },
    password: {
      type: String,
      required: true,
    },
    isDonor: {
      type: Boolean,
      default: false,
    },
    lastDonationDate: {
      type: Date,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
