import express from "express";
import User from "../models/User.js";
import BloodRequest from "../models/BloodRequest.js";
import Offer from "../models/Offer.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();


router.get("/check-admin", requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      isAdmin: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check admin status",
      error: error.message,
    });
  }
});


router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});


router.delete("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }


    await Offer.deleteMany({
      $or: [{ donor: userId }, { requester: userId }],
    });


    await BloodRequest.deleteMany({ requester: userId });


    await User.findByIdAndDelete(userId);

    console.log(
      `✅ Admin ${req.user.name} deleted user ${user.name} (${user.email})`
    );

    res.json({
      success: true,
      message: `User ${user.name} deleted successfully`,
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});


router.put("/users/:userId/admin", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    if (userId === req.user._id.toString() && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove admin privileges from yourself",
      });
    }

    user.isAdmin = isAdmin;
    await user.save();

    console.log(
      `✅ Admin ${req.user.name} ${
        isAdmin ? "granted" : "removed"
      } admin privileges ${isAdmin ? "to" : "from"} ${user.name}`
    );

    res.json({
      success: true,
      message: `Admin privileges ${isAdmin ? "granted to" : "removed from"} ${
        user.name
      }`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("❌ Error updating admin status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin status",
      error: error.message,
    });
  }
});


router.get("/requests", requireAdmin, async (req, res) => {
  try {
    const requests = await BloodRequest.find({})
      .populate("requester", "name email")
      .populate("offers")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("❌ Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message,
    });
  }
});


router.delete("/requests/:requestId", requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;


    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }


    await Offer.deleteMany({ bloodRequest: requestId });


    await BloodRequest.findByIdAndDelete(requestId);

    console.log(
      `✅ Admin ${req.user.name} deleted blood request ${request.bloodGroup} from ${request.location}`
    );

    res.json({
      success: true,
      message: `Blood request deleted successfully`,
      deletedRequest: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        location: request.location,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete request",
      error: error.message,
    });
  }
});


router.put("/requests/:requestId/status", requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { fulfilled } = req.body;

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    request.fulfilled = fulfilled;
    await request.save();

    console.log(
      `✅ Admin ${req.user.name} ${
        fulfilled ? "fulfilled" : "activated"
      } blood request ${request.bloodGroup}`
    );

    res.json({
      success: true,
      message: `Request ${
        fulfilled ? "marked as fulfilled" : "marked as active"
      }`,
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        fulfilled: request.fulfilled,
      },
    });
  } catch (error) {
    console.error("❌ Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update request status",
      error: error.message,
    });
  }
});


router.delete("/cleanup-test-data", requireAdmin, async (req, res) => {
  try {

    const testIdentifiers = [
      "Alice Singh",
      "test1",
      "test2",
      "test@example.com",
      "alice@test.com",
      "alice.singh@test.com",

    ];

    console.log("🧹 Starting cleanup of test data...");


    const testUsers = await User.find({
      $or: [
        { name: { $in: testIdentifiers } },
        { email: { $in: testIdentifiers } },
      ],
    });

    const testUserIds = testUsers.map((user) => user._id);
    console.log(`Found ${testUsers.length} test users to delete`);


    const deletedOffers = await Offer.deleteMany({
      $or: [
        { donor: { $in: testUserIds } },
        { requester: { $in: testUserIds } },
      ],
    });


    const deletedRequests = await BloodRequest.deleteMany({
      $or: [
        { requester: { $in: testUserIds } },
        { requesterName: { $in: testIdentifiers } },
      ],
    });


    const deletedUsers = await User.deleteMany({
      $or: [
        { name: { $in: testIdentifiers } },
        { email: { $in: testIdentifiers } },
      ],
    });

    console.log("✅ Cleanup completed successfully");

    res.json({
      success: true,
      message: "Test data cleanup completed successfully",
      deleted: {
        users: deletedUsers.deletedCount,
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
      testUsersFound: testUsers.map((user) => ({
        name: user.name,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup test data",
      error: error.message,
    });
  }
});


router.get("/test-data-count", requireAdmin, async (req, res) => {
  try {
    const testIdentifiers = [
      "Alice Singh",
      "test1",
      "test2",
      "test@example.com",
      "alice@test.com",
      "alice.singh@test.com",
    ];

    const testUsers = await User.find({
      $or: [
        { name: { $in: testIdentifiers } },
        { email: { $in: testIdentifiers } },
      ],
    });

    const testUserIds = testUsers.map((user) => user._id);

    const testRequests = await BloodRequest.countDocuments({
      $or: [
        { requester: { $in: testUserIds } },
        { requesterName: { $in: testIdentifiers } },
      ],
    });

    const testOffers = await Offer.countDocuments({
      $or: [
        { donor: { $in: testUserIds } },
        { requester: { $in: testUserIds } },
      ],
    });

    res.json({
      success: true,
      testData: {
        users: testUsers.length,
        requests: testRequests,
        offers: testOffers,
      },
      testUsers: testUsers.map((user) => ({
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to count test data",
      error: error.message,
    });
  }
});


router.delete("/delete-all-users", requireAdmin, async (req, res) => {
  try {
    console.log(`🚨 Admin ${req.user.name} requested to DELETE ALL USERS`);


    const usersToDelete = await User.find({
      _id: { $ne: req.user._id },
    });

    const userIds = usersToDelete.map((user) => user._id);

    console.log(
      `Found ${usersToDelete.length} users to delete (excluding admin)`
    );


    const deletedOffers = await Offer.deleteMany({
      $or: [{ donor: { $in: userIds } }, { requester: { $in: userIds } }],
    });


    const deletedRequests = await BloodRequest.deleteMany({
      requester: { $in: userIds },
    });


    const deletedUsers = await User.deleteMany({
      _id: { $ne: req.user._id },
    });

    console.log(`✅ BULK DELETE completed by admin ${req.user.name}:`);
    console.log(`   - Users deleted: ${deletedUsers.deletedCount}`);
    console.log(`   - Requests deleted: ${deletedRequests.deletedCount}`);
    console.log(`   - Offers deleted: ${deletedOffers.deletedCount}`);

    res.json({
      success: true,
      message: "All users deleted successfully (except yourself)",
      deleted: {
        users: deletedUsers.deletedCount,
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
      adminPreserved: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error during bulk user deletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all users",
      error: error.message,
    });
  }
});


router.delete("/delete-all-requests", requireAdmin, async (req, res) => {
  try {
    console.log(
      `🚨 Admin ${req.user.name} requested to DELETE ALL BLOOD REQUESTS`
    );


    const deletedOffers = await Offer.deleteMany({});


    const deletedRequests = await BloodRequest.deleteMany({});

    console.log(`✅ BULK DELETE completed by admin ${req.user.name}:`);
    console.log(`   - Requests deleted: ${deletedRequests.deletedCount}`);
    console.log(`   - Offers deleted: ${deletedOffers.deletedCount}`);

    res.json({
      success: true,
      message: "All blood requests deleted successfully",
      deleted: {
        requests: deletedRequests.deletedCount,
        offers: deletedOffers.deletedCount,
      },
    });
  } catch (error) {
    console.error("❌ Error during bulk request deletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all requests",
      error: error.message,
    });
  }
});

export default router;
