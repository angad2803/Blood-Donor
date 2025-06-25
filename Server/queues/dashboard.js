import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";

import {
  connection,
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
} from "./config.js";

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Create Bull Board with all queues
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(urgentNotificationQueue, { readOnlyMode: false }),
    new BullMQAdapter(donorMatchingQueue, { readOnlyMode: false }),
    new BullMQAdapter(emailQueue, { readOnlyMode: false }),
    new BullMQAdapter(smsQueue, { readOnlyMode: false }),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "Blood Donor Queue Dashboard",
      boardLogo: {
        path: "https://cdn.jsdelivr.net/gh/felixmosh/bull-board@latest/packages/ui/src/static/images/logo.svg",
        width: "100px",
        height: "auto",
      },
      miscLinks: [
        { text: "Back to App", url: "/" },
        { text: "API Documentation", url: "/api/docs" },
      ],
      favIcon: {
        default: "static/images/logo.svg",
        alternative: "static/favicon.ico",
      },
    },
  },
});

// Queue statistics helper
const getQueueStats = async () => {
  try {
    const stats = {};

    const queues = [
      { name: "urgent-blood-requests", queue: urgentNotificationQueue },
      { name: "donor-matching", queue: donorMatchingQueue },
      { name: "email-notifications", queue: emailQueue },
      { name: "sms-notifications", queue: smsQueue },
    ];

    for (const { name, queue } of queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total:
          waiting.length +
          active.length +
          completed.length +
          failed.length +
          delayed.length,
      };
    }

    return stats;
  } catch (error) {
    console.error("Error getting queue stats:", error);
    return {};
  }
};

// Emergency queue priority manager
const setEmergencyMode = async (requestId, priority = 1) => {
  try {
    // Promote urgent jobs to highest priority
    const urgentJobs = await urgentNotificationQueue.getJobs([
      "waiting",
      "delayed",
    ]);

    for (const job of urgentJobs) {
      if (job.data.requestId === requestId) {
        await job.changePriority({ priority });
        console.log(`🚨 Emergency priority set for job ${job.id}`);
      }
    }

    return { success: true, jobsUpdated: urgentJobs.length };
  } catch (error) {
    console.error("Error setting emergency mode:", error);
    return { success: false, error: error.message };
  }
};

// Queue health check
const healthCheck = async () => {
  try {
    const health = {
      timestamp: new Date(),
      redis: "unknown",
      queues: {},
      overall: "healthy",
    };

    // Check Redis connection
    try {
      await connection.ping();
      health.redis = "connected";
    } catch (error) {
      health.redis = "disconnected";
      health.overall = "unhealthy";
    }

    // Check queue status
    const stats = await getQueueStats();
    health.queues = stats;

    // Determine overall health
    const totalFailed = Object.values(stats).reduce(
      (sum, queue) => sum + queue.failed,
      0
    );
    const totalActive = Object.values(stats).reduce(
      (sum, queue) => sum + queue.active,
      0
    );

    if (totalFailed > 10) {
      health.overall = "degraded";
    }

    if (health.redis === "disconnected" || totalActive === 0) {
      health.overall = "unhealthy";
    }

    return health;
  } catch (error) {
    return {
      timestamp: new Date(),
      redis: "error",
      overall: "unhealthy",
      error: error.message,
    };
  }
};

// Cleanup old jobs
const cleanupOldJobs = async (hoursOld = 24) => {
  try {
    const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;
    let totalCleaned = 0;

    const queues = [
      urgentNotificationQueue,
      donorMatchingQueue,
      emailQueue,
      smsQueue,
    ];

    for (const queue of queues) {
      const cleaned = await queue.clean(cutoffTime, 1000, "completed");
      totalCleaned += cleaned.length;
      console.log(`🧹 Cleaned ${cleaned.length} old jobs from ${queue.name}`);
    }

    return { success: true, jobsCleaned: totalCleaned };
  } catch (error) {
    console.error("Error cleaning old jobs:", error);
    return { success: false, error: error.message };
  }
};

export {
  serverAdapter,
  getQueueStats,
  setEmergencyMode,
  healthCheck,
  cleanupOldJobs,
  addQueue,
  removeQueue,
};

// Default export for convenience
export function createBullBoardRouter() {
  return { router: serverAdapter.getRouter() };
}
