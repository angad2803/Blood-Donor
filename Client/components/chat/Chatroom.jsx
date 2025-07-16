// ChatRoom.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/api";

const socket = io("http://localhost:5000"); // your backend URL

const ChatRoom = () => {
  const { requestId } = useParams();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef();

  useEffect(() => {
    socket.emit("join-room", requestId);

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive-message");
  }, [requestId]);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await api.get(`/message/${requestId}`);
      setMessages(res.data);
    };
    fetchMessages();
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg = {
      sender: user._id,
      recipient: null, // optionally backend can resolve recipient
      request: requestId,
      content: input,
    };

    // Send to DB
    await api.post("/message", msg);

    // Emit to socket room
    socket.emit("send-message", {
      roomId: requestId,
      message: { ...msg, sender: { name: user.name }, timestamp: new Date() },
    });

    setMessages((prev) => [
      ...prev,
      { ...msg, sender: { name: user.name }, timestamp: new Date() },
    ]);
    setInput("");
  };

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50">
      <h2 className="text-xl font-bold mb-4">💬 Chat Room</h2>
      <div className="flex-1 overflow-y-auto space-y-2 bg-white p-4 rounded shadow">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.sender._id === user._id
                ? "bg-blue-100 ml-auto"
                : "bg-gray-100"
            } max-w-xs`}
          >
            <strong>{msg.sender?.name}:</strong> {msg.content}
            <div className="text-xs text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 border rounded"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
