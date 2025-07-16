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

export async function DELETE(request, { params }) {
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

    const { userId } = params;

    // Find the user first
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Don't allow deleting yourself
    if (userId === user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account",
        },
        { status: 400 }
      );
    }

    // Delete related offers
    await Offer.deleteMany({
      $or: [{ donor: userId }, { requester: userId }],
    });

    // Delete related blood requests
    await BloodRequest.deleteMany({ requester: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log(
      `Admin ${user.name} deleted user ${targetUser.name} (${targetUser.email})`
    );

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} deleted successfully`,
      deletedUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
