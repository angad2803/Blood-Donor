import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";
import { addEmailJob } from "../queues/config.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login`,
  }),
  (req, res) => {
    const token = req.user.token;

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/oauth-success?token=${token}`);
  },
);

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
      coordinates,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    if (isHospital && (!hospitalName || !hospitalAddress || !hospitalLicense)) {
      return res.status(400).json({
        message:
          "Hospital name, address, and license are required for hospital registration",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      bloodGroup: isHospital ? undefined : bloodGroup,
      location,
      isDonor: isHospital ? false : isDonor,
      isHospital: isHospital || false,
      hospitalName: isHospital ? hospitalName : undefined,
      hospitalAddress: isHospital ? hospitalAddress : undefined,
      hospitalLicense: isHospital ? hospitalLicense : undefined,
      password: hashedPassword,
    };

    if (coordinates && coordinates.latitude && coordinates.longitude) {
      userData.coordinates = {
        type: "Point",
        coordinates: [
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude),
        ],
      };
      userData.locationAccuracy = coordinates.accuracy || null;
      userData.locationTimestamp = new Date();
      console.log(
        `✅ GPS coordinates captured during registration: [${userData.coordinates.coordinates[0]}, ${userData.coordinates.coordinates[1]}]`,
      );
    }

    const newUser = new User(userData);
    await newUser.save();

    console.log(
      `✅ New user registered: ${newUser.email} (${
        isHospital ? "Hospital" : isDonor ? "Donor" : "Recipient"
      })`,
    );
    if (userData.coordinates) {
      console.log(`   Location: ${location} with GPS coordinates`);
    } else {
      console.log(`   Location: ${location} (no GPS coordinates)`);
    }

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
    }

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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

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
    }

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
