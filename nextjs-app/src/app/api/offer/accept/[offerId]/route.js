import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import BloodRequest from "@/models/BloodRequest";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { offerId } = params;
    const userId = user._id;

    // Find the offer
    const offer = await Offer.findById(offerId).populate("bloodRequest");
    if (!offer) {
      return NextResponse.json({ message: "Offer not found" }, { status: 404 });
    }

    // Check if user is the requester
    if (offer.bloodRequest.requester.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Check if request is already fulfilled
    if (offer.bloodRequest.fulfilled) {
      return NextResponse.json(
        { message: "Blood request already fulfilled" },
        { status: 400 }
      );
    }

    // Accept the offer
    offer.status = "accepted";
    offer.respondedAt = new Date();
    await offer.save();

    // Mark blood request as fulfilled
    const bloodRequest = offer.bloodRequest;
    bloodRequest.fulfilled = true;
    bloodRequest.fulfilledBy = offer.donor;
    bloodRequest.fulfilledAt = new Date();
    bloodRequest.acceptedOffer = offerId;
    await bloodRequest.save();

    // Reject all other pending offers for this request
    await Offer.updateMany(
      {
        bloodRequest: bloodRequest._id,
        _id: { $ne: offerId },
        status: "pending",
      },
      {
        status: "rejected",
        respondedAt: new Date(),
      }
    );

    // Populate donor info for response
    await offer.populate("donor", "name bloodGroup location coordinates");

    // TODO: Add email notification queue integration if needed

    return NextResponse.json({
      message: "Offer accepted successfully",
      offer,
      bloodRequest,
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
