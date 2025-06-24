import express from "express";
import Message from "../models/Message.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Send a message
router.post("/", verifyToken, async (req, res) => {
  try {
    const { recipient, request, content } = req.body;
    const message = await Message.create({
      sender: req.user.id,
      recipient,
      request,
      content,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Failed to send", error: err.message });
  }
});

// Get messages for a request
router.get("/:requestId", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ request: req.params.requestId })
      .sort({ timestamp: 1 })
      .populate("sender", "name")
      .populate("recipient", "name");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch", error: err.message });
  }
});

export default router;
