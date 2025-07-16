import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import BloodRequest from "@/models/BloodRequest";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { requestId, message } = await request.json();
    const donorId = user._id;

    // Check if the blood request exists and is not fulfilled
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return NextResponse.json(
        { message: "Blood request not found" },
        { status: 404 }
      );
    }

    if (bloodRequest.fulfilled) {
      return NextResponse.json(
        { message: "Blood request already fulfilled" },
        { status: 400 }
      );
    }

    // Check if donor already sent an offer for this request
    const existingOffer = await Offer.findOne({
      bloodRequest: requestId,
      donor: donorId,
    });

    if (existingOffer) {
      return NextResponse.json(
        { message: "You have already sent an offer for this request" },
        { status: 400 }
      );
    }

    // Create the offer
    const offer = new Offer({
      bloodRequest: requestId,
      donor: donorId,
      message,
    });

    await offer.save();

    // Add offer to blood request
    bloodRequest.offers.push(offer._id);
    await bloodRequest.save();

    // Populate donor info for response
    await offer.populate("donor", "name bloodGroup location");

    // TODO: Add email notification queue integration if needed

    return NextResponse.json(
      {
        message: "Offer sent successfully",
        offer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending offer:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
