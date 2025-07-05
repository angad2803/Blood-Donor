import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "../../../../../lib/mongodb";
import BloodRequest from "../../../../../models/BloodRequest";
import User from "../../../../../models/User";

// PUT /api/requests/[requestId]/fulfill - Mark a request as fulfilled
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = params;
    const fulfillmentData = await request.json();

    await connectDB();

    // Validate user permissions (hospital only)
    const user = await User.findById(session.user.id);
    if (!user || user.accountType !== "hospital") {
      return NextResponse.json(
        { error: "Only hospitals can fulfill requests" },
        { status: 403 }
      );
    }

    // Update request status in database
    const bloodRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      {
        status: "fulfilled",
        fulfilledBy: user._id,
        fulfilledAt: new Date(),
        hospitalName: user.hospitalName || user.username,
      },
      { new: true }
    );

    if (!bloodRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Request marked as fulfilled successfully",
      data: {
        requestId: bloodRequest._id,
        status: bloodRequest.status,
        fulfilledBy: bloodRequest.fulfilledBy,
        hospitalName: bloodRequest.hospitalName,
        fulfilledAt: bloodRequest.fulfilledAt,
      },
    });
  } catch (error) {
    console.error("Error fulfilling request:", error);
    return NextResponse.json(
      { error: "Failed to fulfill request" },
      { status: 500 }
    );
  }
}
