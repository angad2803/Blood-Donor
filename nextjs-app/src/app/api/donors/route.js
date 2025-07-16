import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get("bloodGroup");
    const location = searchParams.get("location");

    let query = {};

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (location) {
      query.location = location;
    }

    const donors = await User.find(query)
      .select("name bloodGroup location coordinates phone email createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ donors });
  } catch (error) {
    console.error("Error fetching donors:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
