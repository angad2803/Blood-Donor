import connectDB from "../../../../../lib/mongodb";
import BloodRequest from "../../../../../models/BloodRequest";
import User from "../../../../../models/User";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();

    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const { requestId } = params;
    const url = new URL(req.url);
    const donorId = url.searchParams.get("donorId");

    if (!donorId) {
      return Response.json({ message: "Donor ID required" }, { status: 400 });
    }

    // Get the blood request and donor
    const bloodRequest = await BloodRequest.findById(requestId);
    const donor = await User.findById(donorId);

    if (!bloodRequest || !donor) {
      return Response.json(
        { message: "Request or donor not found" },
        { status: 404 }
      );
    }

    // Calculate midpoint if both have coordinates
    let meetingPoint = null;
    if (bloodRequest.coordinates && donor.coordinates) {
      const reqCoords = bloodRequest.coordinates.coordinates;
      const donorCoords = donor.coordinates.coordinates;

      meetingPoint = {
        lat: (reqCoords[1] + donorCoords[1]) / 2,
        lng: (reqCoords[0] + donorCoords[0]) / 2,
        address: "Suggested meeting point (midway)",
        name: "Meeting Point",
        description:
          "Calculated midpoint between request location and donor location",
      };
    } else {
      // Fallback to a default location or the hospital location
      meetingPoint = {
        lat: bloodRequest.coordinates?.coordinates[1] || 28.6139,
        lng: bloodRequest.coordinates?.coordinates[0] || 77.209,
        address: bloodRequest.hospitalAddress || "Hospital location",
        name: bloodRequest.hospitalName || "Hospital",
        description: "Meeting at hospital location",
      };
    }

    return Response.json({
      meetingPoint,
      requestDetails: {
        id: bloodRequest._id,
        bloodType: bloodRequest.bloodType,
        hospitalName: bloodRequest.hospitalName,
        urgency: bloodRequest.urgency,
      },
      donorDetails: {
        id: donor._id,
        name: donor.name,
        bloodType: donor.bloodType,
      },
    });
  } catch (error) {
    console.error("Get meeting point error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
