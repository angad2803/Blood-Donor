import {
  sendTestEmail,
  sendEmail,
  sendEmailWithRetry,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendBulkEmails,
  validateEmailConfig,
  logEmailAnalytics,
} from "../utils/emailService.js";
import { emailQueue } from "../queues/config.js";

// Test email configuration
async function testEmailConfiguration() {
  console.log("🔍 Testing Email Configuration...\n");

  const config = validateEmailConfig();
  console.log("📊 Email Configuration Status:");
  console.log(
    `   SendGrid: ${config.sendgrid ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(
    `   Gmail SMTP: ${config.gmail ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(`   From Email: ${config.fromEmail}`);
  console.log(`   Support Email: ${config.supportEmail}`);
  console.log(
    `   Has Valid Config: ${config.hasAnyValidConfig ? "✅ Yes" : "❌ No"}\n`
  );

  return config;
}

// Test basic email sending
async function testBasicEmail(recipientEmail) {
  console.log("📧 Testing Basic Email Sending...\n");

  try {
    const result = await sendTestEmail(recipientEmail);
    console.log("✅ Basic email test passed:", result);
    return result;
  } catch (error) {
    console.error("❌ Basic email test failed:", error.message);
    throw error;
  }
}

// Test template-based emails
async function testTemplateEmails(recipientEmail) {
  console.log("📄 Testing Template-Based Emails...\n");

  const tests = [
    {
      name: "Welcome Email",
      template: "welcome-donor",
      data: {
        name: "Test User",
        bloodGroup: "O+",
        location: "Test City",
      },
    },
    {
      name: "Email Verification",
      template: "email-verification",
      data: {
        name: "Test User",
        verificationToken: "test-token-123",
      },
    },
    {
      name: "Urgent Blood Request",
      template: "urgent-donor-alert",
      data: {
        donorName: "Test Donor",
        bloodGroup: "A+",
        location: "Test Hospital",
        hospital: "General Hospital",
        urgency: "Emergency",
        requesterName: "Test Patient",
        requestId: "test-req-123",
      },
    },
    {
      name: "Request Created",
      template: "request-created",
      data: {
        requesterName: "Test Requester",
        bloodGroup: "B-",
        hospital: "City Hospital",
        urgency: "Urgent",
        requestId: "test-req-456",
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`   Testing ${test.name}...`);
      const result = await sendEmail(
        recipientEmail,
        null,
        test.template,
        test.data
      );
      console.log(
        `   ✅ ${test.name} sent successfully via ${result.provider}`
      );
      results.push({ test: test.name, success: true, result });
    } catch (error) {
      console.error(`   ❌ ${test.name} failed:`, error.message);
      results.push({ test: test.name, success: false, error: error.message });
    }
  }

  return results;
}

// Test email retry functionality
async function testEmailRetry(recipientEmail) {
  console.log("🔄 Testing Email Retry Functionality...\n");

  try {
    // Test with a potentially failing scenario (invalid recipient format to test retry)
    const result = await sendEmailWithRetry(
      recipientEmail,
      "Retry Test Email",
      null,
      { message: "This is a retry functionality test email." },
      2 // Max 2 retries for testing
    );
    console.log("✅ Email retry test passed:", result);
    return result;
  } catch (error) {
    console.error("❌ Email retry test failed:", error.message);
    throw error;
  }
}

// Test bulk email sending
async function testBulkEmails(recipientEmails) {
  console.log("📮 Testing Bulk Email Sending...\n");

  if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    console.log("⚠️  No recipient emails provided for bulk test");
    return null;
  }

  try {
    const result = await sendBulkEmails(
      recipientEmails,
      "welcome-donor",
      {
        name: "Bulk Test User",
        bloodGroup: "AB+",
        location: "Test City",
      },
      2 // Rate limit of 2 emails per batch
    );

    console.log("✅ Bulk email test completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Bulk email test failed:", error.message);
    throw error;
  }
}

// Test queue-based email sending
async function testQueueBasedEmail(recipientEmail) {
  console.log("⚡ Testing Queue-Based Email Sending...\n");

  try {
    // Add different priority emails to queue
    const jobs = [
      {
        name: "High Priority Email",
        data: {
          to: recipientEmail,
          subject: "High Priority Test Email",
          template: "urgent-donor-alert",
          priority: "high",
          data: {
            donorName: "Queue Test Donor",
            bloodGroup: "O-",
            location: "Queue Test City",
            hospital: "Queue Test Hospital",
            urgency: "Emergency",
            requesterName: "Queue Test Patient",
            requestId: "queue-test-123",
          },
        },
        opts: { priority: 10, attempts: 3 },
      },
      {
        name: "Normal Priority Email",
        data: {
          to: recipientEmail,
          subject: "Normal Priority Test Email",
          template: "welcome-donor",
          priority: "normal",
          data: {
            name: "Queue Test User",
            bloodGroup: "A+",
            location: "Queue Test City",
          },
        },
        opts: { priority: 5, attempts: 2 },
      },
      {
        name: "Low Priority Email",
        data: {
          to: recipientEmail,
          subject: "Low Priority Test Email",
          priority: "low",
          data: {
            message: "This is a low priority test email from the queue system.",
          },
        },
        opts: { priority: 1, attempts: 1 },
      },
    ];

    const queueResults = [];

    for (const job of jobs) {
      try {
        const queueJob = await emailQueue.add("send-email", job.data, job.opts);
        console.log(
          `   ✅ ${job.name} added to queue (Job ID: ${queueJob.id})`
        );
        queueResults.push({ job: job.name, success: true, jobId: queueJob.id });
      } catch (error) {
        console.error(`   ❌ Failed to queue ${job.name}:`, error.message);
        queueResults.push({
          job: job.name,
          success: false,
          error: error.message,
        });
      }
    }

    console.log("\n📊 Queue Test Results:");
    queueResults.forEach((result) => {
      if (result.success) {
        console.log(`   ✅ ${result.job} - Job ID: ${result.jobId}`);
      } else {
        console.log(`   ❌ ${result.job} - Error: ${result.error}`);
      }
    });

    return queueResults;
  } catch (error) {
    console.error("❌ Queue-based email test failed:", error.message);
    throw error;
  }
}

// Run comprehensive email tests
async function runEmailTests(recipientEmail, bulkRecipients = []) {
  console.log("🧪 Starting Comprehensive Email Testing...\n");
  console.log("=".repeat(60));

  const testResults = {
    configuration: null,
    basicEmail: null,
    templateEmails: null,
    retryTest: null,
    bulkEmails: null,
    queueTest: null,
    startTime: new Date(),
    endTime: null,
    success: false,
  };

  try {
    // Test 1: Configuration
    testResults.configuration = await testEmailConfiguration();

    if (!testResults.configuration.hasAnyValidConfig) {
      console.log(
        "⚠️  No valid email configuration found. Testing will use simulation mode.\n"
      );
    }

    // Test 2: Basic Email
    testResults.basicEmail = await testBasicEmail(recipientEmail);

    // Test 3: Template Emails
    testResults.templateEmails = await testTemplateEmails(recipientEmail);

    // Test 4: Retry Functionality
    testResults.retryTest = await testEmailRetry(recipientEmail);

    // Test 5: Bulk Emails (if recipients provided)
    if (bulkRecipients.length > 0) {
      testResults.bulkEmails = await testBulkEmails(bulkRecipients);
    }

    // Test 6: Queue-based Emails
    testResults.queueTest = await testQueueBasedEmail(recipientEmail);

    testResults.success = true;
    testResults.endTime = new Date();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL EMAIL TESTS COMPLETED SUCCESSFULLY!");
    console.log(
      `⏱️  Total test time: ${testResults.endTime - testResults.startTime}ms`
    );
    console.log("=".repeat(60));
  } catch (error) {
    testResults.endTime = new Date();
    console.error("\n❌ Email testing failed:", error.message);
    console.log("=".repeat(60));
  }

  return testResults;
}

// Export test functions
export {
  testEmailConfiguration,
  testBasicEmail,
  testTemplateEmails,
  testEmailRetry,
  testBulkEmails,
  testQueueBasedEmail,
  runEmailTests,
};

// CLI interface for running tests
if (process.argv[1].endsWith("test-email-system.js")) {
  const recipientEmail = process.argv[2];
  const bulkRecipients = process.argv.slice(3);

  if (!recipientEmail) {
    console.error("❌ Please provide a recipient email address:");
    console.log(
      "Usage: node test-email-system.js <recipient-email> [bulk-recipient-1] [bulk-recipient-2] ..."
    );
    console.log(
      "Example: node test-email-system.js test@example.com bulk1@example.com bulk2@example.com"
    );
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error("❌ Invalid email format:", recipientEmail);
    process.exit(1);
  }

  console.log(`🚀 Starting email tests with recipient: ${recipientEmail}`);
  if (bulkRecipients.length > 0) {
    console.log(`📮 Bulk recipients: ${bulkRecipients.join(", ")}`);
  }
  console.log();

  runEmailTests(recipientEmail, bulkRecipients)
    .then((results) => {
      if (results.success) {
        console.log("✅ All tests completed successfully!");
        process.exit(0);
      } else {
        console.log("❌ Some tests failed. Check the output above.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Fatal error during testing:", error);
      process.exit(1);
    });
}
