import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js"; // Make sure path is correct
import jwt from "jsonwebtoken";
import { addEmailJob } from "../queues/config.js";

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
        console.log(
          `🔍 OAuth callback for Google ID: ${profile.id}, Email: ${profile.emails[0].value}`
        );

        // Find existing user or create a new one
        let user = await User.findOne({ googleId: profile.id });
        console.log(
          `🔍 User lookup by Google ID: ${
            user ? "Found existing user" : "No user found"
          }`
        );

        if (!user) {
          // Check if a user with the same email exists
          let existingUser = await User.findOne({
            email: profile.emails[0].value,
          });
          console.log(
            `🔍 User lookup by email: ${
              existingUser ? "Found existing user" : "No user found"
            }`
          );

          if (existingUser) {
            // Link Google account to existing user
            const wasLinked = !!existingUser.googleId; // Check if Google was already linked
            existingUser.googleId = profile.id;
            await existingUser.save();
            user = existingUser;
            console.log(
              `🔗 Linked Google account to existing user: ${user.email}`
            );

            // Send welcome email if this is the first time linking Google account
            if (!wasLinked) {
              try {
                const shouldSendWelcomeEmail =
                  process.env.ENABLE_WELCOME_EMAILS === "true";
                if (shouldSendWelcomeEmail) {
                  await addEmailJob({
                    to: user.email,
                    subject: "Google Account Linked - Blood Donor Connect!",
                    template: "welcome",
                    data: {
                      name: user.name,
                      accountType: "Google Account Linked",
                      isOAuth: true,
                      message:
                        "Your Google account has been successfully linked to Blood Donor Connect!",
                    },
                  });
                  console.log(
                    `✅ Google account link email queued for: ${user.email}`
                  );
                } else {
                  console.log(
                    `⏭️ Welcome email disabled for linked Google user: ${user.email}`
                  );
                }
              } catch (emailError) {
                console.error(
                  "❌ Failed to queue Google link email:",
                  emailError
                );
              }
            }
          } else {
            console.log(
              `✨ Creating new Google user: ${profile.emails[0].value}`
            );
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

            // Send welcome email for new Google OAuth user
            try {
              const shouldSendWelcomeEmail =
                process.env.ENABLE_WELCOME_EMAILS === "true";
              if (shouldSendWelcomeEmail) {
                await addEmailJob({
                  to: user.email,
                  subject: "Welcome to Blood Donor Connect!",
                  template: "welcome",
                  data: {
                    name: user.name,
                    accountType: "Google Account",
                    isOAuth: true,
                    message:
                      "Please complete your profile to start using Blood Donor Connect.",
                  },
                });
                console.log(
                  `✅ Welcome email queued for new Google user: ${user.email}`
                );
              } else {
                console.log(
                  `⏭️ Welcome email disabled for Google user: ${user.email}`
                );
              }
            } catch (emailError) {
              console.error(
                "❌ Failed to queue welcome email for Google user:",
                emailError
              );
              // Don't fail OAuth if email fails
            }
          }
        } else {
          console.log(`👋 Existing Google user logging in: ${user.email}`);

          // Send login notification email for OAuth users
          try {
            const shouldSendLoginEmail =
              process.env.SEND_LOGIN_EMAILS === "true";
            if (shouldSendLoginEmail) {
              await addEmailJob({
                to: user.email,
                subject: "OAuth Login - Blood Donor Connect",
                template: "alert",
                data: {
                  name: user.name,
                  message: `You have successfully logged in to Blood Donor Connect using your Google account.`,
                  actionText: "Login Time",
                  actionDetails: new Date().toLocaleString(),
                  priority: "Low",
                },
              });
              console.log(
                `✅ OAuth login notification queued for: ${user.email}`
              );
            } else {
              console.log(`⏭️ Login notifications disabled for: ${user.email}`);
            }
          } catch (emailError) {
            console.error("❌ Failed to queue login notification:", emailError);
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
