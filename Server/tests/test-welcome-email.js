import dotenv from "dotenv";
dotenv.config();

import { addEmailJob } from "../queues/config.js";

// Test welcome email functionality
async function testWelcomeEmail() {
  try {
    console.log("🧪 Testing welcome email system...");

    // Test data
    const testUser = {
      name: "Test User",
      email: process.env.FROM_EMAIL || "test@example.com",
      accountType: "Test Account",
    };

    console.log(`📧 Sending test welcome email to: ${testUser.email}`);

    // Queue welcome email
    const job = await addEmailJob({
      to: testUser.email,
      subject: "Test Welcome Email - Blood Donor Connect",
      template: "welcome",
      data: testUser,
    });

    console.log(`✅ Welcome email job created with ID: ${job.id}`);
    console.log(
      "💡 Check your email inbox and the Bull Board dashboard at http://localhost:5000/admin/queues"
    );

    // Wait a bit and check job status
    setTimeout(async () => {
      try {
        const jobStatus = await job.getState();
        console.log(`📊 Job status: ${jobStatus}`);

        if (jobStatus === "failed") {
          const failedReason = job.failedReason;
          console.log(`❌ Job failed reason: ${failedReason}`);
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    }, 3000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testWelcomeEmail();
