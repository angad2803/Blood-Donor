import { connectMongoDB } from "../../../lib/mongodb";
import BloodRequest from "../../../models/BloodRequest";
import jwt from "jsonwebtoken";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
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

    // Get all blood requests
    const requests = await BloodRequest.find({})
      .populate("requester", "name email accountType hospitalName")
      .sort({ createdAt: -1 });

    return Response.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
