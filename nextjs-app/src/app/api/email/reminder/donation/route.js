import connectDB from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function POST(req) {
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

    const body = await req.json();
    const { donorId, message } = body;

    if (!donorId) {
      return Response.json(
        { message: "Donor ID is required" },
        { status: 400 }
      );
    }

    // Find the donor
    const donor = await User.findById(donorId);
    if (!donor) {
      return Response.json({ message: "Donor not found" }, { status: 404 });
    }

    // Mock donation reminder email
    const reminderEmail = {
      to: donor.email,
      subject: "🩸 Blood Donation Reminder",
      message:
        message ||
        `Hello ${donor.name}, this is a friendly reminder about your upcoming blood donation appointment. Thank you for being a life-saver!`,
      timestamp: new Date().toISOString(),
    };

    console.log("Mock Donation Reminder Email:", reminderEmail);

    // For demo purposes, simulate success
    return Response.json({
      message: "Donation reminder sent successfully",
      recipient: {
        name: donor.name,
        email: donor.email,
      },
      emailContent: reminderEmail,
      success: true,
    });
  } catch (error) {
    console.error("Donation reminder error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
