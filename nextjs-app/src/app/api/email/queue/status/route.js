import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mock queue status (replace with actual queue implementation)
    const queueStatus = {
      waiting: 0,
      active: 0,
      completed: 15,
      failed: 1,
    };

    return NextResponse.json({
      success: true,
      queueStatus,
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get queue status" },
      { status: 500 }
    );
  }
}
