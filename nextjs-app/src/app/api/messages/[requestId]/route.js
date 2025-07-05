// route.js
import { NextResponse } from "next/server";

// GET /api/messages/[requestId] - Get messages for a request
export async function GET(request, { params }) {
  try {
    const { requestId } = params;

    // Here you would typically fetch from database
    // For now, return mock messages
    const mockMessages = [
      {
        _id: "1",
        text: "Hello, I can help with this blood request.",
        sender: "donor1",
        name: "John Donor",
        timestamp: new Date(Date.now() - 60000).toISOString(),
        roomId: requestId,
      },
      {
        _id: "2",
        text: "Thank you! When would be a good time?",
        sender: "requester1",
        name: "Jane Requester",
        timestamp: new Date().toISOString(),
        roomId: requestId,
      },
    ];

    return NextResponse.json({
      success: true,
      messages: mockMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/[requestId] - Send a message to a request
export async function POST(request, { params }) {
  try {
    const { requestId } = params;
    const messageData = await request.json();

    // Here you would typically save to database
    // For now, return a success response
    console.log("Sending message to request:", requestId, messageData);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...messageData,
        timestamp: new Date().toISOString(),
        _id: Date.now().toString(),
        roomId: requestId,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
