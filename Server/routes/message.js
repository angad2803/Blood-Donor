import express from "express";
import Message from "../models/Message.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();


router.get("/:requestId", verifyToken, async (req, res) => {
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


router.post("/:requestId", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user;

    const newMsg = new Message({
      roomId: req.params.requestId,
      sender: user._id,
      name: user.name,
      text,
    });

    const savedMessage = await newMsg.save();


    const io = req.app.get("io");
    if (io) {
      const messageData = {
        _id: savedMessage._id,
        text: savedMessage.text,
        sender: savedMessage.sender,
        name: savedMessage.name,
        roomId: savedMessage.roomId,
        timestamp: savedMessage.timestamp,
      };


      io.to(req.params.requestId).emit("message-saved", messageData);
    }

    res.status(201).json({
      message: "Message saved",
      savedMessage: {
        _id: savedMessage._id,
        text: savedMessage.text,
        sender: savedMessage.sender,
        name: savedMessage.name,
        roomId: savedMessage.roomId,
        timestamp: savedMessage.timestamp,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error sending message", error: err.message });
  }
});

export default router;
