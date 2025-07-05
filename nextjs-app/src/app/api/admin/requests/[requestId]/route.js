import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb.js";
import { getAuthenticatedUser } from "../../../../../lib/auth.js";
import BloodRequest from "../../../../../models/BloodRequest.js";

// Simple admin check
function isAdmin(user) {
  const adminEmails = [
    "admin@blooddonor.com",
    "test@admin.com",
    "angad.28.03.2005@gmail.com",
  ];
  return adminEmails.includes(user.email) || user.email.includes("admin");
}

export async function DELETE(request, { params }) {
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

    const { requestId } = params;

    const deletedRequest = await BloodRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return NextResponse.json(
        { message: "Blood request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blood request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete request",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
