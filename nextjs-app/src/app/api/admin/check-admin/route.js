import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

// Simple admin check - in a real app you'd want a proper admin role system
function isAdmin(user) {
  // For demo purposes, check if email contains 'admin' or is in a predefined list
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

    await connectMongoDB();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check admin status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
