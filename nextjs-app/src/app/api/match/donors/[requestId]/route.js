import connectDB from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import BloodRequest from "../../../../../models/BloodRequest";
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
    const maxDistance = parseInt(url.searchParams.get("maxDistance")) || 50000;
    const limit = parseInt(url.searchParams.get("limit")) || 20;

    // Get the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return Response.json({ message: "Request not found" }, { status: 404 });
    }

    // Find compatible donors nearby
    const compatibleBloodTypes = getCompatibleBloodTypes(
      bloodRequest.bloodType
    );

    const donors = await User.find({
      bloodType: { $in: compatibleBloodTypes },
      accountType: "donor",
      location: { $exists: true, $ne: null },
      _id: { $ne: decoded.userId },
    }).limit(limit);

    // Add distance calculation if request has coordinates
    const donorsWithDistance = donors.map((donor) => {
      let distance = null;
      if (bloodRequest.coordinates && donor.coordinates) {
        distance = calculateDistance(
          bloodRequest.coordinates.coordinates[1], // lat
          bloodRequest.coordinates.coordinates[0], // lng
          donor.coordinates.coordinates[1],
          donor.coordinates.coordinates[0]
        );
      }
      return {
        ...donor.toObject(),
        distance: distance,
      };
    });

    // Filter by distance if both have coordinates
    const filteredDonors = donorsWithDistance.filter(
      (donor) => !donor.distance || donor.distance <= maxDistance / 1000
    );

    return Response.json(filteredDonors.slice(0, limit));
  } catch (error) {
    console.error("Get donors error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

function getCompatibleBloodTypes(requestedType) {
  const compatibility = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],
  };
  return compatibility[requestedType] || [];
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
