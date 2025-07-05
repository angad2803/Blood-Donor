import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectMongoDB();

    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Mock email queue data
    const mockQueueData = {
      pending: [
        {
          id: "email_001",
          to: "user1@example.com",
          subject: "Blood Donation Request",
          priority: "high",
          scheduledAt: new Date(Date.now() + 300000).toISOString(), // 5 mins from now
          attempts: 0,
        },
        {
          id: "email_002",
          to: "user2@example.com",
          subject: "Donation Reminder",
          priority: "medium",
          scheduledAt: new Date(Date.now() + 600000).toISOString(), // 10 mins from now
          attempts: 0,
        },
      ],
      processing: [
        {
          id: "email_003",
          to: "user3@example.com",
          subject: "Match Found",
          priority: "urgent",
          startedAt: new Date().toISOString(),
          attempts: 1,
        },
      ],
      completed: [
        {
          id: "email_004",
          to: "user4@example.com",
          subject: "Thank You",
          priority: "low",
          completedAt: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
          attempts: 1,
          status: "delivered",
        },
        {
          id: "email_005",
          to: "user5@example.com",
          subject: "Profile Update",
          priority: "medium",
          completedAt: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
          attempts: 2,
          status: "delivered",
        },
      ],
      failed: [
        {
          id: "email_006",
          to: "invalid@email.com",
          subject: "Failed Delivery",
          priority: "medium",
          failedAt: new Date(Date.now() - 900000).toISOString(), // 15 mins ago
          attempts: 3,
          error: "Invalid email address",
        },
      ],
    };

    const stats = {
      totalPending: mockQueueData.pending.length,
      totalProcessing: mockQueueData.processing.length,
      totalCompleted: mockQueueData.completed.length,
      totalFailed: mockQueueData.failed.length,
      successRate: (
        (mockQueueData.completed.length /
          (mockQueueData.completed.length + mockQueueData.failed.length)) *
        100
      ).toFixed(1),
    };

    return Response.json({
      queue: mockQueueData,
      stats: stats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email queue error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();

    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    let result = {};

    switch (action) {
      case "clear_completed":
        result = { message: "Cleared completed emails", count: 5 };
        break;
      case "retry_failed":
        result = { message: "Retrying failed emails", count: 1 };
        break;
      case "pause_queue":
        result = { message: "Email queue paused", status: "paused" };
        break;
      case "resume_queue":
        result = { message: "Email queue resumed", status: "active" };
        break;
      default:
        return Response.json({ message: "Invalid action" }, { status: 400 });
    }

    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email queue action error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
