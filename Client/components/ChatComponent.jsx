import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import api from "../api/api.js";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";
import { gsap } from "gsap";

const socket = io("http://localhost:5000");

const ChatComponent = ({ bloodRequest, isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // GSAP Refs
  const modalRef = useRef(null);
  const messagesRef = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !bloodRequest) return;

    // Modal entrance animation
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }

    const roomId = bloodRequest._id;

    // Join the chat room
    socket.emit("join-room", roomId);

    // Listen for incoming messages with animation
    socket.on("receive-message", (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message];
        // Animate new message
        setTimeout(() => {
          const lastMessage =
            messagesRef.current[messagesRef.current.length - 1];
          if (lastMessage) {
            gsap.fromTo(
              lastMessage,
              {
                opacity: 0,
                x: message.sender === user._id ? 30 : -30,
                scale: 0.9,
              },
              { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "power2.out" }
            );
          }
        }, 50);
        return newMessages;
      });
    });

    // Listen for typing indicators
    socket.on("user-typing", ({ userId, name, isTyping }) => {
      if (userId !== user._id) {
        setTyping(isTyping ? name : false);
      }
    });

    // Listen for online users
    socket.on("room-users", (users) => {
      setOnlineUsers(users.filter((u) => u.id !== user._id));
    });

    // Fetch existing messages
    fetchMessages(roomId);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("receive-message");
      socket.off("user-typing");
      socket.off("room-users");
    };
  }, [isOpen, bloodRequest, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (roomId) => {
    try {
      setLoading(true);
      const res = await api.get(`/message/${roomId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load messages", err);
      toast.error("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Emit typing indicator
    socket.emit("typing", {
      roomId: bloodRequest._id,
      userId: user._id,
      name: user.name,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        roomId: bloodRequest._id,
        userId: user._id,
        name: user.name,
        isTyping: false,
      });
    }, 1000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageData = {
      text: input,
      sender: user._id,
      roomId: bloodRequest._id,
      name: user.name,
      timestamp: new Date().toISOString(),
    };

    // Clear typing indicator
    socket.emit("typing", {
      roomId: bloodRequest._id,
      userId: user._id,
      name: user.name,
      isTyping: false,
    });

    // Emit to socket for real-time delivery
    socket.emit("send-message", {
      roomId: bloodRequest._id,
      message: messageData,
    });

    // Clear input
    setInput("");

    // Save to database
    try {
      await api.post(`/message/${bloodRequest._id}`, {
        text: messageData.text,
      });
    } catch (err) {
      console.error("Failed to save message", err);
      toast.error("Failed to save message");
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-4xl h-5/6 mx-4 flex flex-col"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 flex items-center">
                💬 Blood Request Chat
                {onlineUsers.length > 0 && (
                  <span className="ml-2 text-sm bg-green-500 bg-opacity-30 px-2 py-1 rounded-full">
                    🟢 {onlineUsers.length} online
                  </span>
                )}
              </h2>
              <div className="text-sm opacity-90">
                <span className="font-semibold text-red-200">
                  {bloodRequest.bloodGroup}
                </span>{" "}
                blood needed at{" "}
                <span className="font-medium">{bloodRequest.location}</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    bloodRequest.urgency === "Emergency"
                      ? "bg-red-500 animate-pulse"
                      : bloodRequest.urgency === "High"
                      ? "bg-orange-500"
                      : bloodRequest.urgency === "Medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                >
                  {bloodRequest.urgency}
                  {bloodRequest.urgency === "Emergency" && " 🚨"}
                </span>
              </div>
              <div className="text-xs mt-1 opacity-75">
                {bloodRequest.requester?._id === user._id ? (
                  <span className="bg-blue-500 bg-opacity-30 px-2 py-1 rounded">
                    📋 Your Request
                  </span>
                ) : (
                  <span className="bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                    🩸 Helping {bloodRequest.requester?.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-3 py-2 rounded text-sm ml-4 flex items-center"
              aria-label="Close chat"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <LoadingSpinner size="md" message="Loading chat messages..." />
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">
                Start the conversation!
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                {bloodRequest.requester?._id === user._id ? (
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">
                      This is your blood request chat.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Donors will join to coordinate with you</li>
                      <li>• Share specific location details and timing</li>
                      <li>• All messages are saved for reference</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">
                      You're helping {bloodRequest.requester?.name} with their
                      request.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Coordinate donation details here</li>
                      <li>• Ask about timing and location</li>
                      <li>• Messages are delivered in real-time</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === user._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    ref={(el) => (messagesRef.current[index] = el)}
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      msg.sender === user._id
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border"
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${
                        msg.sender === user._id
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.name || "Unknown User"}
                    </div>
                    <div className="break-words">{msg.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        msg.sender === user._id
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg rounded-bl-none text-sm">
                    {typing} is typing
                    <span className="ml-1 animate-pulse">...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef}></div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message... (Press Enter to send)"
              maxLength={500}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              <span className="mr-1">💌</span>
              Send
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {input.length}/500{" "}
            {onlineUsers.length > 0 && `• ${onlineUsers.length} others online`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
