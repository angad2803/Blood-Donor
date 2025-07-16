import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import BloodRequest from "@/models/BloodRequest";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { requestId } = params;
    const userId = user._id;

    // Check if user is the requester
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return NextResponse.json(
        { message: "Blood request not found" },
        { status: 404 }
      );
    }

    if (bloodRequest.requester.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Get all offers for this request
    const offers = await Offer.find({ bloodRequest: requestId })
      .populate("donor", "name bloodGroup location coordinates")
      .sort({ createdAt: -1 });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
