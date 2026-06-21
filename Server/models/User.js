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
      sparse: true,
    },
    bloodGroup: {
      type: String,
      required: function () {

        return !(this.googleId && this.bloodGroup === "O+");
      },
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    location: {
      type: String,
      required: function () {

        return !(this.googleId && this.location === "Unknown");
      },
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: "2dsphere",
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
      type: Number,
      default: null,
    },
    locationTimestamp: {
      type: Date,
      default: null,
    },
    locationPreferences: {
      shareRealTimeLocation: { type: Boolean, default: false },
      maxTravelDistance: { type: Number, default: 50 },
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


UserSchema.index({ coordinates: "2dsphere" });


UserSchema.methods.updateLocation = function (
  lat,
  lng,
  address = null,
  accuracy = null
) {
  this.coordinates = {
    type: "Point",
    coordinates: [lng, lat],
  };
  this.locationTimestamp = new Date();
  if (accuracy) this.locationAccuracy = accuracy;
  if (address) this.address = address;
  return this.save();
};

UserSchema.methods.getDistanceFrom = function (targetCoords) {

  const R = 6371;
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


if (!UserSchema.path('needsAccountTypeSelection')) {
  UserSchema.add({
    needsAccountTypeSelection: {
      type: Boolean,
      default: false
    }
  });
}

const User = mongoose.model("User", UserSchema);
export default User;
