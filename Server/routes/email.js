import express from "express";
import {
  addEmailJob,
  getEmailQueue,
  clearEmailQueue,
} from "../queues/config.js";
import { sendEmail } from "../utils/emailService.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Test email endpoint
router.post("/test", verifyToken, async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    if (!to || !template) {
      return res.status(400).json({
        error: "Missing required fields: to, template",
      });
    }

    const result = await sendEmail(to, subject, template, data);

    res.json({
      success: true,
      message: "Email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Email test error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
});

// Queue email endpoint
router.post("/queue", verifyToken, async (req, res) => {
  try {
    const { to, subject, template, data, delay } = req.body;

    if (!to || !template) {
      return res.status(400).json({
        error: "Missing required fields: to, template",
      });
    }

    const jobOptions = {};
    if (delay) {
      jobOptions.delay = delay;
    }

    const job = await addEmailJob(
      {
        to,
        subject,
        template,
        data: data || {},
      },
      jobOptions
    );

    res.json({
      success: true,
      message: "Email queued successfully",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Email queue error:", error);
    res.status(500).json({
      error: "Failed to queue email",
      details: error.message,
    });
  }
});

// Get queue status
router.get("/queue/status", verifyToken, async (req, res) => {
  try {
    const queue = getEmailQueue();
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    res.json({
      success: true,
      status: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error("Queue status error:", error);
    res.status(500).json({
      error: "Failed to get queue status",
      details: error.message,
    });
  }
});

// Clear queue
router.post("/queue/clear", verifyToken, async (req, res) => {
  try {
    await clearEmailQueue();
    res.json({
      success: true,
      message: "Email queue cleared successfully",
    });
  } catch (error) {
    console.error("Clear queue error:", error);
    res.status(500).json({
      error: "Failed to clear queue",
      details: error.message,
    });
  }
});

// Send welcome email
router.post("/welcome", verifyToken, async (req, res) => {
  try {
    const { to, name } = req.body;

    if (!to || !name) {
      return res.status(400).json({
        error: "Missing required fields: to, name",
      });
    }

    await addEmailJob({
      to,
      subject: "Welcome to Blood Donor Connect!",
      template: "welcome",
      templateData: { name },
    });

    res.json({
      success: true,
      message: "Welcome email queued successfully",
    });
  } catch (error) {
    console.error("Welcome email error:", error);
    res.status(500).json({
      error: "Failed to send welcome email",
      details: error.message,
    });
  }
});

// Send verification email
router.post("/verification", verifyToken, async (req, res) => {
  try {
    const { to, name, verificationToken } = req.body;

    if (!to || !name || !verificationToken) {
      return res.status(400).json({
        error: "Missing required fields: to, name, verificationToken",
      });
    }

    const verificationUrl = `${process.env.CLIENT_URL}/verify?token=${verificationToken}`;

    await addEmailJob({
      to,
      subject: "Verify Your Email Address",
      template: "verification",
      templateData: { name, verificationUrl },
    });

    res.json({
      success: true,
      message: "Verification email queued successfully",
    });
  } catch (error) {
    console.error("Verification email error:", error);
    res.status(500).json({
      error: "Failed to send verification email",
      details: error.message,
    });
  }
});

// Send blood request alert
router.post("/request-alert", verifyToken, async (req, res) => {
  try {
    const { to, donorName, requestDetails } = req.body;

    if (!to || !donorName || !requestDetails) {
      return res.status(400).json({
        error: "Missing required fields: to, donorName, requestDetails",
      });
    }

    await addEmailJob({
      to,
      subject: "Urgent: Blood Donation Request",
      template: "request",
      templateData: { donorName, ...requestDetails },
    });

    res.json({
      success: true,
      message: "Request alert email queued successfully",
    });
  } catch (error) {
    console.error("Request alert email error:", error);
    res.status(500).json({
      error: "Failed to send request alert email",
      details: error.message,
    });
  }
});

// Send reminder email - MODIFIED TO USE DIRECT EMAIL
router.post("/reminder", verifyToken, async (req, res) => {
  try {
    const { to, donorName, reminderType, reminderData } = req.body;

    if (!to || !donorName || !reminderType) {
      return res.status(400).json({
        error: "Missing required fields: to, donorName, reminderType",
      });
    }

    // Send email directly instead of using queue
    const result = await sendEmail(to, "Reminder: Blood Donation", "reminder", {
      donorName,
      reminderType,
      ...reminderData,
    });

    res.json({
      success: true,
      message: "Reminder email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Reminder email error:", error);
    res.status(500).json({
      error: "Failed to send reminder email",
      details: error.message,
    });
  }
});

// Send fulfillment notification
router.post("/fulfillment", verifyToken, async (req, res) => {
  try {
    const { to, requesterName, donorName, fulfillmentData } = req.body;

    if (!to || !requesterName || !donorName) {
      return res.status(400).json({
        error: "Missing required fields: to, requesterName, donorName",
      });
    }

    await addEmailJob({
      to,
      subject: "Blood Request Fulfilled",
      template: "fulfillment",
      templateData: { requesterName, donorName, ...fulfillmentData },
    });

    res.json({
      success: true,
      message: "Fulfillment notification queued successfully",
    });
  } catch (error) {
    console.error("Fulfillment email error:", error);
    res.status(500).json({
      error: "Failed to send fulfillment notification",
      details: error.message,
    });
  }
});

// Get email configuration
router.get("/config", verifyToken, async (req, res) => {
  try {
    const config = {
      provider: process.env.EMAIL_PROVIDER || "sendgrid",
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      gmailConfigured: !!(
        process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
      ),
      queueEnabled: process.env.ENABLE_EMAIL_QUEUE === "true",
      retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 5000,
    };

    res.json({ success: true, config });
  } catch (error) {
    console.error("Config error:", error);
    res.status(500).json({
      error: "Failed to get email configuration",
      details: error.message,
    });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const queue = getEmailQueue();
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      queue: {
        name: queue.name,
        waiting: await queue.getWaiting().then((jobs) => jobs.length),
        active: await queue.getActive().then((jobs) => jobs.length),
      },
    };

    res.json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
