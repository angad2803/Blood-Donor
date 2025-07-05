import connectDB from "../../../../lib/mongodb.js";
import BloodRequest from "../../../../models/BloodRequest.js";

export async function GET() {
  try {
    await connectDB();

    const requests = await BloodRequest.find({ status: "active" })
      .populate("requester", "name email")
      .sort({ urgency: -1, createdAt: -1 })
      .limit(50);

    return new Response(
      JSON.stringify({
        message: "Blood requests retrieved successfully",
        requests,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get all requests error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
