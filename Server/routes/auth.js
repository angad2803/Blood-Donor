import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import passport from "passport";

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

    // Create new user
    const newUser = new User({
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
    });

    await newUser.save();

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
        location: user.location,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
