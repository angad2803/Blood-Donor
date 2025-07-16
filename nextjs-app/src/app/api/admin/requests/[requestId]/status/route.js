import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongodb.js";
import { getAuthenticatedUser } from "../../../../../../lib/auth.js";
import BloodRequest from "../../../../../../models/BloodRequest.js";

// Simple admin check
function isAdmin(user) {
  const adminEmails = [
    "admin@blooddonor.com",
    "test@admin.com",
    "angad.28.03.2005@gmail.com",
  ];
  return adminEmails.includes(user.email) || user.email.includes("admin");
}

export async function PUT(request, { params }) {
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
    const { fulfilled } = await request.json();

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      { fulfilled },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { message: "Blood request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request status updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update request status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
