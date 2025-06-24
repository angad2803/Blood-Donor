import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import api from "../api/api";

const socket = io("http://localhost:5000");

const ChatPage = () => {
  const { requestId } = useParams();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", requestId);

    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit("leave-room", requestId);
      socket.off("receive-message");
    };
  }, [requestId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/message/${requestId}`);
        setMessages(res.data.messages);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    fetchMessages();
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageData = {
      text: input,
      sender: user._id,
      roomId: requestId,
      name: user.name,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send-message", {
      roomId: requestId,
      message: messageData,
    });

    setMessages((prev) => [...prev, messageData]);
    setInput("");

    try {
      await api.post(`/message/${requestId}`, { text: input });
    } catch (err) {
      console.error("Failed to save message", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded shadow p-4 flex flex-col h-[80vh]">
        <h2 className="text-xl font-semibold mb-4 text-center text-blue-600">
          💬 Chat Room for Request ID: {requestId}
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 px-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                msg.sender === user._id
                  ? "bg-blue-100 self-end text-right"
                  : "bg-gray-200 self-start text-left"
              }`}
            >
              <div className="text-sm font-medium">{msg.name}</div>
              <div>{msg.text}</div>
              <div className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border border-gray-300 rounded px-3 py-2"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
