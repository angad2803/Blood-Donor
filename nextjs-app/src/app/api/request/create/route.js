import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb.js";
import BloodRequest from "../../../../models/BloodRequest.js";
import { getAuthenticatedUser } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const {
      bloodType,
      bloodGroup,
      unitsNeeded,
      requesterName,
      patientName,
      hospitalName,
      location,
      contactNumber,
      urgency,
      notes,
      coordinates,
    } = await request.json();

    // Use bloodGroup if bloodType is not provided (for backward compatibility)
    const finalBloodType = bloodType || bloodGroup;
    const finalRequesterName = requesterName || patientName || user.name;

    // Validate required fields
    if (!finalBloodType || !location) {
      return NextResponse.json(
        { message: "Blood type and location are required" },
        { status: 400 }
      );
    }

    // Map urgency values for backward compatibility
    let finalUrgency = urgency || "normal";
    if (finalUrgency === "Emergency" || finalUrgency === "emergency") {
      finalUrgency = "critical";
    } else if (finalUrgency === "Normal" || finalUrgency === "normal") {
      finalUrgency = "normal";
    } else if (finalUrgency === "Urgent" || finalUrgency === "urgent") {
      finalUrgency = "urgent";
    }

    const requestData = {
      requester: user._id,
      requesterName: finalRequesterName,
      bloodType: finalBloodType,
      unitsNeeded: parseInt(unitsNeeded) || 1,
      hospitalName: hospitalName || "Not specified",
      location,
      contactNumber:
        contactNumber || user.contactNumber || user.email || "Not provided",
      urgency: finalUrgency,
      notes: notes || "",
    };

    // Add coordinates if provided
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      requestData.coordinates = {
        type: "Point",
        coordinates: [
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude),
        ],
      };
    }

    const newRequest = new BloodRequest(requestData);
    await newRequest.save();

    // Populate the requester information
    await newRequest.populate("requester", "name email");

    console.log(
      `✅ New blood request created: ${finalBloodType} blood needed by ${finalRequesterName}`
    );

    return NextResponse.json(
      {
        message: "Blood request created successfully",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
