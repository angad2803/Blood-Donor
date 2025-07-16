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
    const user = await User.findById(decoded.userId);

    if (!user || !user.isAdmin) {
      return Response.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Test user patterns to identify test data
    const testUserPatterns = [
      { name: { $regex: /^(alice|test|demo)/i } },
      { email: { $regex: /@(test|example|demo)\./i } },
      { name: "Alice Singh" },
      {
        email: {
          $in: ["test@example.com", "alice@test.com", "alice.singh@test.com"],
        },
      },
    ];

    // Find test users
    const testUsers = await User.find({ $or: testUserPatterns });
    const testUserIds = testUsers.map((user) => user._id);

    // Find requests from test users
    const testRequestIds = await BloodRequest.find({
      requester: { $in: testUserIds },
    }).distinct("_id");

    // Delete offers related to test users or test requests
    const deletedOffers = await Offer.deleteMany({
      $or: [
        { donorId: { $in: testUserIds } },
        { requestId: { $in: testRequestIds } },
      ],
    });

    // Delete requests from test users
    const deletedRequests = await BloodRequest.deleteMany({
      requester: { $in: testUserIds },
    });

    // Delete test users
    const deletedUsers = await User.deleteMany({ $or: testUserPatterns });

    return Response.json({
      message: "Test data cleanup completed successfully",
      deleted: {
        users: deletedUsers.deletedCount,
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
    });
  } catch (error) {
    console.error("Cleanup test data error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
