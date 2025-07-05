import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../../lib/mongodb";
import Offer from "../../../../models/Offer";
import { getAuthenticatedUser, createAuthResponse } from "../../../../lib/auth";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createAuthResponse("Authentication required", 401);
    }

    await connectMongoDB();

    const userId = user._id;

    const offers = await Offer.find({ donor: userId })
      .populate(
        "bloodRequest",
        "bloodGroup location urgency fulfilled createdAt"
      )
      .populate("bloodRequest.requester", "name location coordinates")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      message: "Offers retrieved successfully",
      offers,
    });
  } catch (error) {
    console.error("Error fetching user offers:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
