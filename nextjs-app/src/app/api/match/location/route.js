import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { latitude, longitude, accuracy } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user's location
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        locationTimestamp: new Date(),
      },
      { new: true }
    );

    // Mock reverse geocoding (replace with actual geocoding service)
    const address = `Location near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      location: {
        latitude,
        longitude,
        accuracy,
        address,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update location" },
      { status: 500 }
    );
  }
}
