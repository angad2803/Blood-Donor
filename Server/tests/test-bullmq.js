// Test script to manually add jobs to queues
import {
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
} from "../queues/config.js";

console.log("🧪 Testing BullMQ queues...");

// Test urgent notification
await urgentNotificationQueue.add("test-urgent", {
  requestId: "test123",
  bloodGroup: "A+",
  location: "Mumbai",
  hospital: "Test Hospital",
  urgency: "Emergency",
  requesterName: "John Doe",
});

// Test donor matching
await donorMatchingQueue.add("test-matching", {
  requestId: "test123",
  bloodGroup: "A+",
  location: "Mumbai",
});

// Test real email templates
await emailQueue.add("test-email-welcome", {
  to: "test@example.com", // Replace with your real email
  subject: null, // Will be generated from template
  template: "welcome-donor",
  priority: "normal",
  data: {
    name: "Test User",
    bloodGroup: "O+",
    location: "Test City",
  },
});

await emailQueue.add("test-email-urgent", {
  to: "test@example.com", // Replace with your real email
  subject: null,
  template: "urgent-donor-alert",
  priority: "high",
  data: {
    donorName: "Test Donor",
    bloodGroup: "A+",
    location: "Mumbai",
    hospital: "Test Hospital",
    urgency: "Emergency",
    requesterName: "John Doe",
    requestId: "test123",
  },
});

await emailQueue.add("test-email-verification", {
  to: "test@example.com", // Replace with your real email
  subject: null,
  template: "email-verification",
  priority: "high",
  data: {
    name: "Test User",
    verificationToken: "test-token-12345",
  },
});

// Test SMS
await smsQueue.add("test-sms", {
  to: "+1234567890",
  message: "Test SMS from BullMQ queue system",
});

console.log("✅ All test jobs added to queues!");
console.log(
  "🔍 Check the Bull Board dashboard at: http://localhost:5000/admin/queues"
);
console.log("👀 Watch your server console for job processing logs");
console.log("📧 If you configured real email services, check your inbox!");

process.exit(0);
