import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js"; // Make sure path is correct
import jwt from "jsonwebtoken";

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback", // Must match in Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user or create a new one
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if a user with the same email exists
          let existingUser = await User.findOne({
            email: profile.emails[0].value,
          });
          if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = profile.id;
            await existingUser.save();
            user = existingUser;
          } else {
            // Create new user with incomplete profile flag
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              isDonor: false, // default, user will choose later
              isHospital: false, // default, user will choose later
              password: Math.random().toString(36).slice(-8), // random password
              location: "Unknown", // default value to satisfy schema
              bloodGroup: "O+", // default value to satisfy schema
              needsAccountTypeSelection: true, // Flag to indicate user needs to choose account type
            });
          }
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: user._id,
            isDonor: user.isDonor,
            isHospital: user.isHospital,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Attach token to user
        done(null, { ...user.toObject(), token });
      } catch (err) {
        console.error(
          "Google OAuth error:",
          err && err.response ? err.response.data : err
        );
        done(err, null);
      }
    }
  )
);

// Required for Passport sessions (not used in JWT flow, but safe to include)
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
