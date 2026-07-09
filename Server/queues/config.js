import { Queue } from "bullmq";
import Redis from "ioredis";

console.log("REDIS_URL configured:", !!process.env.REDIS_URL);
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing.");
}

// Create a single shared IORedis connection using Upstash REDIS_URL
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

// Ensure the client actively connects and surface errors early
connection
  .connect()
  .then(() => {
    console.log("✅ Redis connected successfully (shared client)");
  })
  .catch((err) => {
    console.error(
      "❌ Redis initial connect error:",
      err && err.message ? err.message : err,
    );
    console.log(
      "💡 Queue system will not work without Redis. Please check your REDIS_URL.",
    );
  });

connection.on("error", (err) => {
  console.error(
    "❌ Redis connection error (shared client):",
    err && err.message ? err.message : err,
  );
});

// Provide a createClient factory for BullMQ so it creates separate clients correctly
const connectionOptions = {
  createClient: function (type) {
    if (!process.env.REDIS_URL) {
      console.error(
        `createClient called but REDIS_URL is missing (type=${type})`,
      );
      throw new Error("REDIS_URL is missing.");
    }

    const extractHost = (uri) => {
      try {
        let s = uri.replace(/^rediss?:\/\//i, "");
        if (s.includes("@")) s = s.split("@").pop();
        s = s.split("/")[0];
        s = s.split("?")[0];
        return s;
      } catch (e) {
        return "(unknown)";
      }
    };

    console.log(
      `createClient called (type=${type}), REDIS host: ${extractHost(process.env.REDIS_URL)}`,
    );

    // types: 'client', 'subscriber', 'bclient'
    // Always create a new IORedis client using REDIS_URL to avoid defaulting to localhost
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      console.error(
        `❌ Redis client error (type=${type}):`,
        err && err.message ? err.message : err,
      );
    });
    return client;
  },
};

// Create queues — use connectionOptions factory so BullMQ creates clients with REDIS_URL
const urgentNotificationQueue = new Queue("urgent-blood-requests", {
  connection: connectionOptions,
});

const donorMatchingQueue = new Queue("donor-matching", {
  connection: connectionOptions,
});

const emailQueue = new Queue("email-notifications", {
  connection: connectionOptions,
});

const smsQueue = new Queue("sms-notifications", {
  connection: connectionOptions,
});

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
  connectionOptions,
};
