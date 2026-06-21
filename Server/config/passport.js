import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { addEmailJob } from "../queues/config.js";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(
          `🔍 OAuth callback for Google ID: ${profile.id}, Email: ${profile.emails[0].value}`
        );


        let user = await User.findOne({ googleId: profile.id });
        console.log(
          `🔍 User lookup by Google ID: ${
            user ? "Found existing user" : "No user found"
          }`
        );

        if (!user) {

          let existingUser = await User.findOne({
            email: profile.emails[0].value,
          });
          console.log(
            `🔍 User lookup by email: ${
              existingUser ? "Found existing user" : "No user found"
            }`
          );

          if (existingUser) {

            const wasLinked = !!existingUser.googleId;
            existingUser.googleId = profile.id;
            await existingUser.save();
            user = existingUser;
            console.log(
              `🔗 Linked Google account to existing user: ${user.email}`
            );


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
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), salt);


            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              isDonor: false,
              isHospital: false,
              password: hashedPassword,
              location: "Unknown",
              bloodGroup: "O+",
              needsAccountTypeSelection: true,
            });


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

            }
          }
        } else {
          console.log(`👋 Existing Google user logging in: ${user.email}`);


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


        const token = jwt.sign(
          {
            id: user._id,
            isDonor: user.isDonor,
            isHospital: user.isHospital,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );


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


passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
