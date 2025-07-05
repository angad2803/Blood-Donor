import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import BloodRequest from "../../../../models/BloodRequest";
import Offer from "../../../../models/Offer";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET(req) {
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

    // Count test data
    const testUsers = await User.find({ $or: testUserPatterns });
    const testUserIds = testUsers.map((user) => user._id);

    const testRequests = await BloodRequest.countDocuments({
      requester: { $in: testUserIds },
    });

    const testOffers = await Offer.countDocuments({
      $or: [
        { donorId: { $in: testUserIds } },
        {
          requestId: {
            $in: await BloodRequest.find({
              requester: { $in: testUserIds },
            }).distinct("_id"),
          },
        },
      ],
    });

    return Response.json({
      testData: {
        users: testUsers.length,
        requests: testRequests,
        offers: testOffers,
      },
      testUsers: testUsers.map((user) => ({
        name: user.name,
        email: user.email,
        id: user._id,
      })),
    });
  } catch (error) {
    console.error("Test data count error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
