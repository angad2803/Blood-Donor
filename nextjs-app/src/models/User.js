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
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Only require password if not Google OAuth user
      },
    },
    isDonor: {
      type: Boolean,
      default: false,
    },
    isHospital: {
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
    profileComplete: {
      type: Boolean,
      default: function () {
        return !this.googleId; // Regular users have complete profiles by default
      },
    },
    profileUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    donationHistory: [
      {
        requestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BloodRequest",
        },
        donationDate: {
          type: Date,
          default: Date.now,
        },
        unitsContributed: {
          type: Number,
          required: true,
        },
        verificationStatus: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
      },
    ],
    verificationBadges: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      phoneVerified: {
        type: Boolean,
        default: false,
      },
      hospitalVerified: {
        type: Boolean,
        default: function () {
          return !this.isHospital; // Non-hospitals are auto-verified
        },
      },
      donorVerified: {
        type: Boolean,
        default: false,
      },
    },
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      donationRadius: {
        type: Number,
        default: 50, // kilometers
        min: 1,
        max: 500,
      },
      urgencyLevels: {
        critical: {
          type: Boolean,
          default: true,
        },
        urgent: {
          type: Boolean,
          default: true,
        },
        normal: {
          type: Boolean,
          default: false,
        },
      },
    },
    stats: {
      totalDonations: {
        type: Number,
        default: 0,
      },
      totalUnitsContributed: {
        type: Number,
        default: 0,
      },
      requestsCreated: {
        type: Number,
        default: 0,
      },
      offersReceived: {
        type: Number,
        default: 0,
      },
      offersSent: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
UserSchema.index({ coordinates: "2dsphere" });

// Index for location-based queries
UserSchema.index({ location: 1 });

// Virtual for full location display
UserSchema.virtual("fullLocation").get(function () {
  if (this.isHospital && this.hospitalAddress) {
    return `${this.hospitalName}, ${this.hospitalAddress}`;
  }
  return this.location;
});

// Method to check if user profile is complete
UserSchema.methods.isProfileComplete = function () {
  const requiredFields = ["name", "email", "bloodGroup", "location"];

  for (const field of requiredFields) {
    if (!this[field] || this[field] === "Unknown") {
      return false;
    }
  }

  // Additional validation for hospital users
  if (this.isHospital) {
    const hospitalFields = [
      "hospitalName",
      "hospitalAddress",
      "hospitalLicense",
    ];
    for (const field of hospitalFields) {
      if (!this[field]) {
        return false;
      }
    }
  }

  return true;
};

// Method to update stats
UserSchema.methods.updateStats = function (type, value = 1) {
  if (!this.stats[type]) {
    this.stats[type] = 0;
  }
  this.stats[type] += value;
  return this.save();
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
