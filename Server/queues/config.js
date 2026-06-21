import { Queue } from "bullmq";
import Redis from "ioredis";


const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});


connection.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

connection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
  console.log(
    "💡 Queue system will not work without Redis. Please install and start Redis server."
  );
});


const urgentNotificationQueue = new Queue("urgent-blood-requests", {
  connection,
});
const donorMatchingQueue = new Queue("donor-matching", { connection });
const emailQueue = new Queue("email-notifications", { connection });
const smsQueue = new Queue("sms-notifications", { connection });


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

export {
  connection,
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
};
