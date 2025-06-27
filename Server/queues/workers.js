import { Worker } from "bullmq";
import { connection } from "./config.js";
import User from "../models/User.js";
import BloodRequest from "../models/BloodRequest.js";
import { canDonateTo } from "../utils/compatability.js";
import { sendEmail } from "../utils/emailService.js";

// Helper function to get compatible blood groups
function getCompatibleBloodGroups(requestedType) {
  const allBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  return allBloodGroups.filter((group) => canDonateTo(group, requestedType));
}

// Urgent Blood Request Worker
const urgentWorker = new Worker(
  "urgent-blood-requests",
  async (job) => {
    const {
      requestId,
      bloodGroup,
      location,
      urgency,
      hospital,
      requesterName,
    } = job.data;

    console.log(`🚨 Processing urgent ${bloodGroup} request in ${location}`);

    try {
      // Find compatible donors in the same location
      const compatibleDonors = await User.find({
        location: location,
        available: { $ne: false },
        bloodGroup: { $in: getCompatibleBloodGroups(bloodGroup) },
      });

      console.log(
        `Found ${compatibleDonors.length} compatible donors for ${bloodGroup}`
      );

      // Send urgent email notifications to compatible donors
      const emailPromises = compatibleDonors.map(async (donor) => {
        try {
          await sendEmail(
            donor.email,
            null, // subject will be generated from template
            "urgent-donor-alert",
            {
              donorName: donor.name,
              bloodGroup: bloodGroup,
              location: location,
              hospital: hospital,
              urgency: urgency,
              requesterName: requesterName,
              requestId: requestId,
            }
          );
          console.log(`📧 Urgent alert sent to ${donor.name} (${donor.email})`);
          return { success: true, donor: donor.email };
        } catch (error) {
          console.error(
            `❌ Failed to send urgent alert to ${donor.email}:`,
            error.message
          );
          return { success: false, donor: donor.email, error: error.message };
        }
      });

      const emailResults = await Promise.allSettled(emailPromises);
      const successfulEmails = emailResults.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;

      return {
        success: true,
        notificationsSent: successfulEmails,
        totalDonors: compatibleDonors.length,
        urgencyLevel: urgency,
        emailResults: emailResults.map((result) =>
          result.status === "fulfilled"
            ? result.value
            : { success: false, error: result.reason }
        ),
      };
    } catch (error) {
      console.error(`❌ Error processing urgent request ${requestId}:`, error);
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

// Donor Matching Worker
const donorMatchingWorker = new Worker(
  "donor-matching",
  async (job) => {
    const { requestId, bloodGroup, location } = job.data;

    console.log(
      `🎯 Processing donor matching for ${bloodGroup} in ${location}`
    );

    try {
      const compatibleDonors = await User.find({
        bloodGroup: { $in: getCompatibleBloodGroups(bloodGroup) },
        available: true,
      }).limit(10);

      console.log(`🎯 Found ${compatibleDonors.length} potential matches`);

      return {
        success: true,
        matchesFound: compatibleDonors.length,
        donors: compatibleDonors.map((d) => ({
          name: d.name,
          bloodGroup: d.bloodGroup,
          location: d.location,
        })),
      };
    } catch (error) {
      console.error(`❌ Error in donor matching:`, error);
      throw error;
    }
  },
  { connection, concurrency: 3 }
);

// Email Worker
const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    console.log(
      `📧 Email worker received job ${job.id} with data:`,
      JSON.stringify(job.data, null, 2)
    );

    const { to, subject, template, data, priority = "normal" } = job.data;

    console.log(
      `📧 Processing ${priority} email to ${to}: ${subject || "Template-based"}`
    );

    try {
      const result = await sendEmail(to, subject, template, data);

      console.log(`✅ Email sent successfully to ${to} via ${result.provider}`);

      return {
        success: true,
        recipient: to,
        subject: subject || `Template: ${template}`,
        provider: result.provider,
        priority: priority,
        sentAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error.message);

      // Don't throw error for non-critical emails, just log and return failure
      if (priority === "low") {
        return {
          success: false,
          recipient: to,
          error: error.message,
          priority: priority,
          failedAt: new Date(),
        };
      }

      throw error; // Critical emails should retry
    }
  },
  {
    connection,
    concurrency: 10,
    settings: {
      retryProcessDelay: 5000, // Wait 5 seconds between retries
    },
  }
);

// Add worker event listeners for debugging
emailWorker.on("ready", () => {
  console.log("📧 Email worker is ready and listening for jobs");
});

emailWorker.on("error", (err) => {
  console.error("❌ Email worker error:", err);
});

emailWorker.on("stalled", (jobId) => {
  console.log(`⏰ Email job ${jobId} stalled`);
});

// SMS Worker
const smsWorker = new Worker(
  "sms-notifications",
  async (job) => {
    const { to, message } = job.data;

    console.log(`📱 Processing SMS to ${to}`);

    try {
      // In a real app, you would use a service like Twilio
      // For now, we'll simulate sending the SMS
      console.log(`📱 SMS sent to ${to}: ${message}`);

      return {
        success: true,
        recipient: to,
        message: message,
        sentAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error sending SMS:`, error);
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

// Start all workers
export function startWorkers() {
  console.log("🔧 Starting BullMQ workers...");

  urgentWorker.on("completed", (job) => {
    console.log(`✅ Urgent notification job ${job.id} completed`);
  });

  urgentWorker.on("failed", (job, err) => {
    console.error(`❌ Urgent notification job ${job?.id} failed:`, err.message);
  });

  donorMatchingWorker.on("completed", (job) => {
    console.log(`✅ Donor matching job ${job.id} completed`);
  });

  donorMatchingWorker.on("failed", (job, err) => {
    console.error(`❌ Donor matching job ${job?.id} failed:`, err.message);
  });

  emailWorker.on("completed", (job) => {
    console.log(`✅ Email job ${job.id} completed`);
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
  });

  smsWorker.on("completed", (job) => {
    console.log(`✅ SMS job ${job.id} completed`);
  });

  smsWorker.on("failed", (job, err) => {
    console.error(`❌ SMS job ${job?.id} failed:`, err.message);
  });

  console.log("✅ All BullMQ workers started successfully");
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Closing workers...");
  await Promise.all([
    urgentWorker.close(),
    donorMatchingWorker.close(),
    emailWorker.close(),
    smsWorker.close(),
  ]);
  process.exit(0);
});

export { urgentWorker, donorMatchingWorker, emailWorker, smsWorker };
