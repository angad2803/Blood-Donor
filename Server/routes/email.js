import express from "express";
import { sendEmail } from "../utils/emailService.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

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
    console.error("Email send error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
});

router.post("/welcome", verifyToken, async (req, res) => {
  try {
    const { to, name } = req.body;

    if (!to || !name) {
      return res.status(400).json({
        error: "Missing required fields: to, name",
      });
    }

    await sendEmail(to, null, "welcome", { name });

    res.json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    console.error("Welcome email error:", error);
    res.status(500).json({
      error: "Failed to send welcome email",
      details: error.message,
    });
  }
});

router.post("/verification", verifyToken, async (req, res) => {
  try {
    const { to, name, verificationToken } = req.body;

    if (!to || !name || !verificationToken) {
      return res.status(400).json({
        error: "Missing required fields: to, name, verificationToken",
      });
    }

    await sendEmail(to, null, "email-verification", { name, verificationToken });

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Verification email error:", error);
    res.status(500).json({
      error: "Failed to send verification email",
      details: error.message,
    });
  }
});

router.post("/request-alert", verifyToken, async (req, res) => {
  try {
    const { to, donorName, requestDetails } = req.body;

    if (!to || !donorName || !requestDetails) {
      return res.status(400).json({
        error: "Missing required fields: to, donorName, requestDetails",
      });
    }

    await sendEmail(to, null, "urgent-donor-alert", {
      donorName,
      ...requestDetails,
    });

    res.json({
      success: true,
      message: "Request alert email sent successfully",
    });
  } catch (error) {
    console.error("Request alert email error:", error);
    res.status(500).json({
      error: "Failed to send request alert email",
      details: error.message,
    });
  }
});

router.post("/reminder", verifyToken, async (req, res) => {
  try {
    const { to, donorName, reminderType, reminderData } = req.body;

    if (!to || !donorName || !reminderType) {
      return res.status(400).json({
        error: "Missing required fields: to, donorName, reminderType",
      });
    }

    const result = await sendEmail(to, null, "donation-reminder", {
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

router.post("/fulfillment", verifyToken, async (req, res) => {
  try {
    const { to, requesterName, donorName, fulfillmentData } = req.body;

    if (!to || !requesterName || !donorName) {
      return res.status(400).json({
        error: "Missing required fields: to, requesterName, donorName",
      });
    }

    await sendEmail(to, null, "request-fulfilled", {
      requesterName,
      donorName,
      ...fulfillmentData,
    });

    res.json({
      success: true,
      message: "Fulfillment notification sent successfully",
    });
  } catch (error) {
    console.error("Fulfillment email error:", error);
    res.status(500).json({
      error: "Failed to send fulfillment notification",
      details: error.message,
    });
  }
});

export default router;
