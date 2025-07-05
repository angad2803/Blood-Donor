// route.js
import { NextResponse } from "next/server";

// GET /api/requests/match - Get matched requests for current user
export async function GET(request) {
  try {
    // Here you would typically:
    // 1. Get user from session/auth
    // 2. Find requests matching user's donor profile
    // 3. Apply blood type compatibility
    // For now, return mock matched requests

    const mockMatchedRequests = [
      {
        _id: "1",
        bloodGroup: "A+",
        location: "New Delhi",
        urgency: "urgent",
        description: "Emergency surgery required",
        requester: {
          _id: "req1",
          name: "John Smith",
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        _id: "2",
        bloodGroup: "AB+",
        location: "Mumbai",
        urgency: "high",
        description: "Accident patient needs blood",
        requester: {
          _id: "req2",
          name: "Jane Doe",
        },
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        _id: "3",
        bloodGroup: "O+",
        location: "Bangalore",
        urgency: "medium",
        description: "Regular blood replacement therapy",
        requester: {
          _id: "req3",
          name: "Bob Johnson",
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];

    return NextResponse.json({
      success: true,
      requests: mockMatchedRequests,
    });
  } catch (error) {
    console.error("Error fetching matched requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch matched requests" },
      { status: 500 }
    );
  }
}
