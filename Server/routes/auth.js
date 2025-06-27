import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";
import { addEmailJob } from "../queues/config.js";

const router = express.Router();
// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
// Handle OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // On success, redirect to frontend with token
    const token = req.user.token;
    // Use CLIENT_URL from .env, fallback to localhost:5173 if not set
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/oauth-success?token=${token}`);
  }
);
// REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bloodGroup,
      location,
      isDonor,
      isHospital,
      hospitalName,
      hospitalAddress,
      hospitalLicense,
      coordinates, // GPS coordinates from frontend
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Validate hospital fields if registering as hospital
    if (isHospital && (!hospitalName || !hospitalAddress || !hospitalLicense)) {
      return res.status(400).json({
        message:
          "Hospital name, address, and license are required for hospital registration",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      name,
      email,
      bloodGroup: isHospital ? undefined : bloodGroup, // Hospitals don't need blood group
      location,
      isDonor: isHospital ? false : isDonor, // Hospitals can't be donors
      isHospital: isHospital || false,
      hospitalName: isHospital ? hospitalName : undefined,
      hospitalAddress: isHospital ? hospitalAddress : undefined,
      hospitalLicense: isHospital ? hospitalLicense : undefined,
      password: hashedPassword,
    };

    // Add GPS coordinates if provided
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      userData.coordinates = {
        type: "Point",
        coordinates: [
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude),
        ], // [longitude, latitude]
      };
      userData.locationAccuracy = coordinates.accuracy || null;
      userData.locationTimestamp = new Date();
      console.log(
        `✅ GPS coordinates captured during registration: [${userData.coordinates.coordinates[0]}, ${userData.coordinates.coordinates[1]}]`
      );
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    console.log(
      `✅ New user registered: ${newUser.email} (${
        isHospital ? "Hospital" : isDonor ? "Donor" : "Recipient"
      })`
    );
    if (userData.coordinates) {
      console.log(`   Location: ${location} with GPS coordinates`);
    } else {
      console.log(`   Location: ${location} (no GPS coordinates)`);
    }

    // Send welcome email
    try {
      const shouldSendWelcomeEmail =
        process.env.ENABLE_WELCOME_EMAILS === "true";
      if (shouldSendWelcomeEmail) {
        await addEmailJob({
          to: newUser.email,
          subject: "Welcome to Blood Donor Connect!",
          template: "welcome",
          data: {
            name: newUser.name,
            accountType: isHospital
              ? "Hospital"
              : isDonor
              ? "Donor"
              : "Recipient",
          },
        });
        console.log(`✅ Welcome email queued for ${newUser.email}`);
      } else {
        console.log(`⏭️ Welcome email disabled for ${newUser.email}`);
      }
    } catch (emailError) {
      console.error("❌ Failed to queue welcome email:", emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        bloodGroup: newUser.bloodGroup,
        isDonor: newUser.isDonor,
        isAdmin: newUser.isAdmin || false,
        location: newUser.location,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Send login notification email (optional - can be disabled in production)
    try {
      const shouldSendLoginEmail = process.env.SEND_LOGIN_EMAILS === "true";
      if (shouldSendLoginEmail) {
        await addEmailJob({
          to: user.email,
          subject: "Login Notification - Blood Donor Connect",
          template: "alert",
          data: {
            name: user.name,
            message: `You have successfully logged in to your Blood Donor Connect account.`,
            actionText: "Login Time",
            actionDetails: new Date().toLocaleString(),
            priority: "Low",
          },
        });
        console.log(`✅ Login notification email queued for ${user.email}`);
      }
    } catch (emailError) {
      console.error("❌ Failed to queue login notification email:", emailError);
      // Don't fail login if email fails
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        isDonor: user.isDonor,
        isAdmin: user.isAdmin || false,
        location: user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
