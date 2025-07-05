import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb.js";
import { getAuthenticatedUser } from "../../../../lib/auth.js";
import BloodRequest from "../../../../models/BloodRequest.js";

// Simple admin check - in a real app you'd want a proper admin role system
function isAdmin(user) {
  const adminEmails = [
    "admin@blooddonor.com",
    "test@admin.com",
    "angad.28.03.2005@gmail.com",
  ];
  return adminEmails.includes(user.email) || user.email.includes("admin");
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const requests = await BloodRequest.find({})
      .populate("requester", "name email")
      .populate("offers")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Error fetching admin requests:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch requests",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
