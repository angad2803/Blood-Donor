import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb.js";
import Message from "../../../../models/Message.js";
import { getAuthenticatedUser } from "../../../../lib/auth.js";

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { requestId } = params;

    const messages = await Message.find({ roomId: requestId }).sort({
      timestamp: 1,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Error fetching messages", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { requestId } = params;
    const { text } = await request.json();

    const newMsg = new Message({
      roomId: requestId,
      sender: user._id,
      name: user.name,
      text,
    });

    await newMsg.save();

    return NextResponse.json(
      { message: "Message saved", newMsg },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Error sending message", error: error.message },
      { status: 500 }
    );
  }
}
