#!/usr/bin/env node

/**
 * Quick Email Test Script
 * Usage: node quick-email-test.js [your-email@example.com]
 */

import dotenv from "dotenv";
dotenv.config();

import { sendTestEmail, validateEmailConfig } from "../utils/emailService.js";
import { emailQueue } from "../queues/config.js";

const testEmail = process.argv[2];

if (!testEmail) {
  console.log("📧 Quick Email Test Script");
  console.log("Usage: node quick-email-test.js your-email@example.com");
  console.log("");
  console.log("This script will:");
  console.log("  1. Check your email configuration");
  console.log("  2. Send a test email");
  console.log("  3. Queue a template-based email");
  console.log("");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(testEmail)) {
  console.error("❌ Invalid email format:", testEmail);
  process.exit(1);
}

console.log("🚀 Starting Quick Email Test...");
console.log("📧 Test Email:", testEmail);
console.log("");

async function runQuickTest() {
  try {
    // Step 1: Check configuration
    console.log("1️⃣ Checking email configuration...");
    const config = validateEmailConfig();

    console.log(
      `   SendGrid: ${config.sendgrid ? "✅ Configured" : "❌ Not configured"}`
    );
    console.log(
      `   Gmail SMTP: ${config.gmail ? "✅ Configured" : "❌ Not configured"}`
    );
    console.log(
      `   Valid Config: ${config.hasAnyValidConfig ? "✅ Yes" : "❌ No"}`
    );
    console.log("");

    if (!config.hasAnyValidConfig) {
      console.log("⚠️  No email service configured. Emails will be simulated.");
      console.log(
        "   Configure SendGrid or Gmail SMTP in your .env file for real email sending."
      );
      console.log("");
    }

    // Step 2: Send direct test email
    console.log("2️⃣ Sending direct test email...");
    try {
      const result = await sendTestEmail(testEmail);
      console.log(`   ✅ Direct email sent via ${result.provider}`);
    } catch (error) {
      console.log(`   ❌ Direct email failed: ${error.message}`);
    }
    console.log("");

    // Step 3: Queue template-based email
    console.log("3️⃣ Queueing template-based email...");
    try {
      const job = await emailQueue.add(
        "quick-test",
        {
          to: testEmail,
          template: "welcome-donor",
          priority: "normal",
          data: {
            name: "Quick Test User",
            bloodGroup: "O+",
            location: "Test City",
          },
        },
        {
          attempts: 3,
          backoff: "exponential",
        }
      );

      console.log(`   ✅ Email queued successfully (Job ID: ${job.id})`);
    } catch (error) {
      console.log(`   ❌ Email queue failed: ${error.message}`);
    }
    console.log("");

    // Step 4: Quick queue status
    console.log("4️⃣ Checking queue status...");
    try {
      const waiting = await emailQueue.getWaiting();
      const active = await emailQueue.getActive();
      const completed = await emailQueue.getCompleted();
      const failed = await emailQueue.getFailed();

      console.log(`   📊 Queue Status:`);
      console.log(`      Waiting: ${waiting.length}`);
      console.log(`      Active: ${active.length}`);
      console.log(`      Completed: ${completed.length}`);
      console.log(`      Failed: ${failed.length}`);
    } catch (error) {
      console.log(`   ❌ Could not check queue status: ${error.message}`);
    }
    console.log("");

    console.log("🎉 Quick email test completed!");
    console.log("");
    console.log("Next steps:");
    console.log("  • Check your email inbox for test messages");
    console.log(
      "  • Visit Bull Board dashboard: http://localhost:5000/admin/queues"
    );
    console.log(
      "  • Run comprehensive tests: node test-email-system.js " + testEmail
    );
    console.log("  • Configure real email service in .env for production use");
  } catch (error) {
    console.error("💥 Quick test failed:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

runQuickTest();
