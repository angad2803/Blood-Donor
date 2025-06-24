import express from "express";
import Message from "../models/Message.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// GET messages for a room (chat for a request)
router.get("/:requestId", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.requestId }).sort({
      timestamp: 1,
    });
    res.status(200).json({ messages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching messages", error: err.message });
  }
});

// POST a new message
router.post("/:requestId", async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user || req.body.user; // adapt based on your auth setup
    const newMsg = new Message({
      roomId: req.params.requestId,
      sender: user._id,
      name: user.name,
      text,
    });

    await newMsg.save();
    res.status(201).json({ message: "Message saved", newMsg });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error sending message", error: err.message });
  }
});

export default router;
