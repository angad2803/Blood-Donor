import { connectMongoDB } from "../../../../lib/mongodb";
import jwt from "jsonwebtoken";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectMongoDB();

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

    const body = await req.json();
    const { start, end, mode = "driving" } = body;

    if (!start || !end) {
      return Response.json(
        { message: "Start and end coordinates required" },
        { status: 400 }
      );
    }

    // For now, return a simple mock route response
    // In a real implementation, you'd integrate with a routing service like Google Maps or Mapbox
    const mockRoute = {
      distance: calculateDistance(start.lat, start.lng, end.lat, end.lng),
      duration: calculateDuration(start.lat, start.lng, end.lat, end.lng, mode),
      polyline: generateSimplePolyline(start, end),
      steps: [
        {
          instruction: `Head ${getDirection(start, end)} on main road`,
          distance: "2.5 km",
          duration: "5 mins",
        },
        {
          instruction: "Continue straight",
          distance: "1.8 km",
          duration: "3 mins",
        },
        {
          instruction: "Arrive at destination",
          distance: "0 km",
          duration: "0 mins",
        },
      ],
    };

    return Response.json({
      route: mockRoute,
      success: true,
    });
  } catch (error) {
    console.error("Get route error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

function calculateDuration(lat1, lon1, lat2, lon2, mode) {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const speed = mode === "walking" ? 5 : mode === "cycling" ? 15 : 40; // km/h
  return Math.round((distance / speed) * 60); // minutes
}

function getDirection(start, end) {
  const deltaLat = end.lat - start.lat;
  const deltaLng = end.lng - start.lng;

  if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
    return deltaLat > 0 ? "north" : "south";
  } else {
    return deltaLng > 0 ? "east" : "west";
  }
}

function generateSimplePolyline(start, end) {
  // Generate a simple straight line polyline
  const points = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    points.push([lat, lng]);
  }

  return points;
}
