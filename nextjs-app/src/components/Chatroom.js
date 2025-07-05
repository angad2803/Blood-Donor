// Chatroom.js
"use client";

import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

const Chatroom = ({ requestId: propRequestId }) => {
  const params = useParams();
  const requestId = propRequestId || params?.requestId;
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  const bottomRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
    );
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !requestId) return;

    socket.emit("join-room", requestId);

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [socket, requestId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    if (requestId) {
      fetchMessages();
    }
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !socket) return;

    const msg = {
      sender: user._id,
      recipient: null, // optionally backend can resolve recipient
      request: requestId,
      content: input,
    };

    try {
      // Send to DB via API
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      });

      if (res.ok) {
        // Emit to socket room
        socket.emit("send-message", {
          roomId: requestId,
          message: {
            ...msg,
            sender: { name: user.name },
            timestamp: new Date(),
          },
        });

        setMessages((prev) => [
          ...prev,
          { ...msg, sender: { name: user.name }, timestamp: new Date() },
        ]);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!user) {
    return (
      <div className="p-6 h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Please log in to access chat.</div>
      </div>
    );
  }

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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatroom;
