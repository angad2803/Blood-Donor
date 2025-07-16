import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import BloodRequest from "@/models/BloodRequest";
import User from "@/models/User";
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

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const maxDistance = parseInt(searchParams.get("maxDistance")) || 50000; // 50km default
    const limit = parseInt(searchParams.get("limit")) || 10;
    const urgencyFilter = searchParams.get("urgencyFilter");
    const includeRoutes = searchParams.get("includeRoutes") === "true";

    const donor = await User.findById(user._id);
    if (!donor || !donor.coordinates) {
      return NextResponse.json({
        success: true,
        data: {
          requests: [],
          totalCount: 0,
          message: "Please update your location to find nearby blood requests.",
        },
      });
    }

    // Build query for blood requests
    let query = {
      fulfilled: false,
    };

    if (urgencyFilter) {
      query.urgency = urgencyFilter;
    }

    // Find all unfulfilled requests
    const allRequests = await BloodRequest.find(query)
      .populate("requester", "name location coordinates")
      .sort({ createdAt: -1 });

    // Filter by blood compatibility and distance
    const compatibleRequests = allRequests.filter((request) => {
      // Check blood compatibility
      if (!canDonateTo(donor.bloodGroup, request.bloodGroup)) {
        return false;
      }

      // Check distance if coordinates are available
      if (request.requester?.coordinates && donor.coordinates) {
        const distance = calculateDistance(
          donor.coordinates.lat,
          donor.coordinates.lng,
          request.requester.coordinates.lat,
          request.requester.coordinates.lng
        );
        return distance <= maxDistance;
      }

      // Fallback to location string matching if no coordinates
      return request.location === donor.location;
    });

    // Sort by urgency and distance
    const sortedRequests = compatibleRequests
      .map((request) => {
        let distance = null;
        if (request.requester?.coordinates && donor.coordinates) {
          distance = calculateDistance(
            donor.coordinates.lat,
            donor.coordinates.lng,
            request.requester.coordinates.lat,
            request.requester.coordinates.lng
          );
        }
        return { ...request.toObject(), distance };
      })
      .sort((a, b) => {
        // First sort by urgency
        const urgencyOrder = {
          Emergency: 3,
          High: 2,
          Medium: 1,
          Low: 0,
        };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;

        // Then sort by distance
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: sortedRequests,
        totalCount: compatibleRequests.length,
        message:
          sortedRequests.length === 0
            ? "No compatible blood requests found in your area"
            : undefined,
      },
    });
  } catch (error) {
    console.error("Error finding nearby requests:", error);
    return NextResponse.json({
      success: true,
      data: {
        requests: [],
        totalCount: 0,
        message:
          "No blood requests found in your area. Please ensure your location is updated.",
      },
      error: error.message,
    });
  }
}
