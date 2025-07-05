import { connectMongoDB } from "../../../../lib/mongodb";
import BloodRequest from "../../../../models/BloodRequest";
import { getAuthenticatedUser, createAuthResponse } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectMongoDB();

    // Get authenticated user using the new hybrid method
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return createAuthResponse("Authentication required", 401);
    }

    // Get user's own blood requests
    const requests = await BloodRequest.find({ requester: user._id })
      .populate("requester", "name email accountType hospitalName")
      .sort({ createdAt: -1 });

    return Response.json({
      message: "Requests retrieved successfully",
      requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
