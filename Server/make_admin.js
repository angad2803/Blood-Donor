import mongoose from "mongoose";
import User from "./models/User.js";

import * as dotenv from "dotenv";
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function makeAdmin() {
  if (!MONGO_URI) {
    console.error(
      "MONGO_URI not set. Set MONGO_URI or MONGODB_URI in your environment.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to MongoDB");
    const user = await User.findOneAndUpdate(
      { email: "angad.28.03.2005@gmail.com" },
      { $set: { isAdmin: true } },
      { new: true },
    );
    if (user) {
      console.log(`User ${user.email} is now an admin!`);
    } else {
      console.log("User not found!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
