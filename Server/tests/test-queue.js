// Simple test script to verify BullMQ integration
import { connection, urgentNotificationQueue } from "../queues/config.js";

console.log("🔧 Testing BullMQ integration...");

// Test Redis connection
try {
  await connection.ping();
  console.log("✅ Redis connection successful");
} catch (error) {
  console.error("❌ Redis connection failed:", error.message);
  console.log("💡 Make sure Redis is running on localhost:6379");
  process.exit(1);
}

// Test queue functionality
try {
  const job = await urgentNotificationQueue.add("test-job", {
    message: "Test message",
    timestamp: new Date(),
  });
  console.log(`✅ Job added successfully: ${job.id}`);
} catch (error) {
  console.error("❌ Failed to add job:", error.message);
}

// Close connection
await connection.quit();
console.log("✅ Test completed successfully!");
process.exit(0);
