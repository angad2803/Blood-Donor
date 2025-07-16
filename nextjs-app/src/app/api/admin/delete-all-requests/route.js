import connectDB from "../../../../lib/mongodb";
import BloodRequest from "../../../../models/BloodRequest";
import Offer from "../../../../models/Offer";
import jwt from "jsonwebtoken";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function DELETE(req) {
  try {
    await connectDB();

    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isAdmin) {
      return Response.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all request IDs before deletion
    const allRequestIds = await BloodRequest.find({}).distinct("_id");

    // Delete all offers related to any request
    const deletedOffers = await Offer.deleteMany({
      requestId: { $in: allRequestIds },
    });

    // Delete all requests
    const deletedRequests = await BloodRequest.deleteMany({});

    return Response.json({
      message: "All blood requests and related offers deleted successfully",
      deleted: {
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all requests error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
