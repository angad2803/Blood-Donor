import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import BloodRequest from "@/models/BloodRequest";
import Offer from "@/models/Offer";
import { getAuthenticatedUser } from "@/lib/auth";

// Simple admin check
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

    await connectMongoDB();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Access denied - Admin only" },
        { status: 403 }
      );
    }

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
