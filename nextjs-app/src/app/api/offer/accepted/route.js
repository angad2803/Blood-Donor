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

    const acceptedOffers = await Offer.find({
      donor: userId,
      status: "accepted",
    })
      .populate({
        path: "bloodRequest",
        populate: {
          path: "requester",
          select: "name email phone location coordinates",
        },
      })
      .sort({ respondedAt: -1 });

    return NextResponse.json({
      message: "Accepted offers retrieved successfully",
      acceptedOffers,
    });
  } catch (error) {
    console.error("Error fetching accepted offers:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
