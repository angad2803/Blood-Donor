import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import BloodRequest from "../../../../models/BloodRequest";
import Offer from "../../../../models/Offer";
import jwt from "jsonwebtoken";

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
    const adminUser = await User.findById(decoded.userId);

    if (!adminUser || !adminUser.isAdmin) {
      return Response.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Find all users except the current admin
    const usersToDelete = await User.find({
      _id: { $ne: adminUser._id },
    });

    const userIdsToDelete = usersToDelete.map((user) => user._id);

    // Find all requests from users to be deleted
    const requestIdsToDelete = await BloodRequest.find({
      requester: { $in: userIdsToDelete },
    }).distinct("_id");

    // Delete all offers related to these users or requests
    const deletedOffers = await Offer.deleteMany({
      $or: [
        { donorId: { $in: userIdsToDelete } },
        { requestId: { $in: requestIdsToDelete } },
      ],
    });

    // Delete all requests from these users
    const deletedRequests = await BloodRequest.deleteMany({
      requester: { $in: userIdsToDelete },
    });

    // Delete all users except admin
    const deletedUsers = await User.deleteMany({
      _id: { $ne: adminUser._id },
    });

    return Response.json({
      message: "All users deleted successfully (except admin)",
      deleted: {
        users: deletedUsers.deletedCount,
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all users error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
