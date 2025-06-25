import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // your user schema
const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";

router.get("/google", (req, res) => {
  const scope = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;

  res.redirect(authUrl);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { data } = await axios.post(
      `https://oauth2.googleapis.com/token`,
      {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const accessToken = data.access_token;

    const { data: profile } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        isDonor: false, // default
        location: "unknown", // default
        bloodGroup: "NA", // default
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // redirect with token in URL (or set cookie if SSR)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/dashboard?token=${token}`);
  } catch (err) {
    console.error("Google Auth Error:", err.message);
    res.status(500).send("Authentication Failed");
  }
});

export default router;
