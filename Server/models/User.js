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
    phone: {
      type: String,
      required: false,
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
    // Enhanced geolocation fields - GeoJSON Point
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
        index: "2dsphere", // Enable geospatial queries
      },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
      formattedAddress: { type: String },
    },
    locationAccuracy: {
      type: Number, // accuracy in meters
      default: null,
    },
    locationTimestamp: {
      type: Date,
      default: null,
    },
    locationPreferences: {
      shareRealTimeLocation: { type: Boolean, default: false },
      maxTravelDistance: { type: Number, default: 50 }, // in kilometers
      preferredTravelMethods: [
        { type: String, enum: ["driving", "walking", "public_transport"] },
      ],
    },
    password: {
      type: String,
      required: true,
    },
    isDonor: {
      type: Boolean,
      default: false,
    },
    isHospital: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    hospitalName: {
      type: String,
      required: function () {
        return this.isHospital;
      },
    },
    hospitalAddress: {
      type: String,
      required: function () {
        return this.isHospital;
      },
    },
    hospitalLicense: {
      type: String,
      required: function () {
        return this.isHospital;
      },
    },
    lastDonationDate: {
      type: Date,
    },
    available: {
      type: Boolean,
      default: true,
    },
    needsAccountTypeSelection: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
UserSchema.index({ coordinates: "2dsphere" });

// Add methods for geolocation
UserSchema.methods.updateLocation = function (
  lat,
  lng,
  address = null,
  accuracy = null
) {
  this.coordinates = {
    type: "Point",
    coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
  };
  this.locationTimestamp = new Date();
  if (accuracy) this.locationAccuracy = accuracy;
  if (address) this.address = address;
  return this.save();
};

UserSchema.methods.getDistanceFrom = function (targetCoords) {
  // Simple distance calculation (in km)
  const R = 6371; // Earth's radius in km
  const dLat =
    ((targetCoords[1] - this.coordinates.coordinates[1]) * Math.PI) / 180;
  const dLon =
    ((targetCoords[0] - this.coordinates.coordinates[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.coordinates.coordinates[1] * Math.PI) / 180) *
      Math.cos((targetCoords[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default mongoose.model("User", UserSchema);
