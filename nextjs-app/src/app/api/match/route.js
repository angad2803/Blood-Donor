import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import BloodRequest from "@/models/BloodRequest";
import { getAuthenticatedUser } from "@/lib/auth";

// Blood type compatibility helper
function canDonateTo(donorBloodGroup, recipientBloodGroup) {
  const compatibility = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
  };

  return compatibility[donorBloodGroup]?.includes(recipientBloodGroup) || false;
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const donor = user;

    const all = await BloodRequest.find({
      fulfilled: false,
      location: donor.location,
    });

    const matches = all
      .filter((r) => canDonateTo(donor.bloodGroup, r.bloodGroup))
      .sort((a, b) => {
        const urgencyOrder = {
          Emergency: 3,
          High: 2,
          Medium: 1,
          Low: 0,
        };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error in match endpoint:", error);
    return NextResponse.json(
      { error: "Failed to find matches" },
      { status: 500 }
    );
  }
}
