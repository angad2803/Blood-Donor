import { Queue } from "bullmq";
import Redis from "ioredis";

// Verification: print REDIS_URL early to confirm dotenv was loaded before this module runs.
// NOTE: This is intentional for verification; keep only while we confirm startup ordering.
console.log("process.env.REDIS_URL=", process.env.REDIS_URL);

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing.");
}

// Create a single shared IORedis connection using Upstash REDIS_URL.
// Use eager connect and await it synchronously (top-level await) so that
// no BullMQ objects initialize before Redis is ready. This prevents
// BullMQ from creating fallback/localhost clients during startup.
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

// Listen for readiness and errors — do NOT call `connect()` here.
connection.on("ready", () => {
  console.log("✅ Redis connected (shared client)");
});

connection.on("error", (err) => {
  console.error(
    "❌ Redis connection error:",
    err && err.message ? err.message : err,
  );
});

// Create queues — after Redis is connected — use the shared `connection`
const urgentNotificationQueue = new Queue("urgent-blood-requests", {
  connection,
});
const donorMatchingQueue = new Queue("donor-matching", { connection });
const emailQueue = new Queue("email-notifications", { connection });
const smsQueue = new Queue("sms-notifications", { connection });

// Email queue helper functions
export async function addEmailJob(jobData, options = {}) {
  try {
    const job = await emailQueue.add("send-email", jobData, options);
    console.log(`✅ Email job added: ${job.id}`);
    return job;
  } catch (error) {
    console.error("❌ Failed to add email job:", error);
    throw error;
  }
}

export function getEmailQueue() {
  return emailQueue;
}

export async function clearEmailQueue() {
  try {
    await emailQueue.obliterate({ force: true });
    console.log("✅ Email queue cleared");
  } catch (error) {
    console.error("❌ Failed to clear email queue:", error);
    throw error;
  }
}

// Export everything
export {
  connection,
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
};
