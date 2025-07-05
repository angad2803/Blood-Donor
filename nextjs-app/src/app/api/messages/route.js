// route.js
import { NextResponse } from "next/server";

// POST /api/messages - Create a new message
export async function POST(request) {
  try {
    const messageData = await request.json();

    // Here you would typically save to database
    // For now, return a success response
    console.log("Creating message:", messageData);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...messageData,
        timestamp: new Date().toISOString(),
        _id: Date.now().toString(),
      },
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
