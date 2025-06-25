import dotenv from "dotenv";
dotenv.config();

import { addEmailJob } from "../queues/config.js";

// Test OAuth welcome email scenarios
async function testOAuthEmails() {
  try {
    console.log("🧪 Testing OAuth email scenarios...");

    // Scenario 1: New Google OAuth user
    console.log("\n📧 Scenario 1: New Google OAuth user");
    const newGoogleUser = {
      name: "New Google User",
      email: process.env.FROM_EMAIL || "test@example.com",
      accountType: "Google Account",
      isOAuth: true,
      message:
        "Please complete your profile to start using Blood Donor Connect.",
    };

    const job1 = await addEmailJob({
      to: newGoogleUser.email,
      subject: "Welcome to Blood Donor Connect!",
      template: "welcome",
      data: newGoogleUser,
    });
    console.log(`✅ New OAuth user email queued: Job ID ${job1.id}`);

    // Scenario 2: Existing user linking Google account
    console.log("\n📧 Scenario 2: Existing user linking Google account");
    const linkingUser = {
      name: "Existing User",
      email: process.env.FROM_EMAIL || "test@example.com",
      accountType: "Google Account Linked",
      isOAuth: true,
      message:
        "Your Google account has been successfully linked to Blood Donor Connect!",
    };

    const job2 = await addEmailJob({
      to: linkingUser.email,
      subject: "Google Account Linked - Blood Donor Connect!",
      template: "welcome",
      data: linkingUser,
    });
    console.log(`✅ Account linking email queued: Job ID ${job2.id}`);

    console.log(
      "\n💡 Check your email inbox and the Bull Board dashboard at http://localhost:5000/admin/queues"
    );

    // Wait and check status
    setTimeout(async () => {
      try {
        const status1 = await job1.getState();
        const status2 = await job2.getState();
        console.log(
          `\n📊 Job statuses:\nJob ${job1.id}: ${status1}\nJob ${job2.id}: ${status2}`
        );
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    }, 5000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testOAuthEmails();
