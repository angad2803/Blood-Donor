"use client";

import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSession } from "next-auth/react";
import api from "../api/api.js";
import LoadingSpinner from "./LoadingSpinner";

const ChatComponent = ({ bloodRequest, isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Modal and animation refs
  const modalRef = useRef(null);
  const messagesRef = useRef([]);
  const inputRef = useRef(null);

  // Get current user from either AuthContext or NextAuth session
  const currentUser = user || session?.user;

  useEffect(() => {
    if (!isOpen || !bloodRequest) return;

    // Simple entrance animation
    if (modalRef.current) {
      modalRef.current.style.opacity = "0";
      modalRef.current.style.transform = "scale(0.9) translateY(50px)";
      setTimeout(() => {
        modalRef.current.style.transition = "all 0.4s ease-out";
        modalRef.current.style.opacity = "1";
        modalRef.current.style.transform = "scale(1) translateY(0)";
      }, 10);
    }

    // Fetch existing messages
    fetchMessages(bloodRequest._id);

    // Auto-refresh messages every 5 seconds for real-time feel
    const interval = setInterval(() => {
      fetchMessages(bloodRequest._id);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, bloodRequest]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = async (roomId) => {
    try {
      setLoading(true);
      const res = await api.get(`/message/${roomId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load messages", err);
      // Simple error handling without toast for now
      console.log("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const messageText = input.trim();
    setInput(""); // Clear input immediately for better UX
    setSending(true);

    try {
      // Save to database
      await api.post(`/message/${bloodRequest._id}`, {
        text: messageText,
      });

      // Refresh messages to show the new one
      await fetchMessages(bloodRequest._id);
    } catch (err) {
      console.error("Failed to send message", err);
      // Restore the input if sending failed
      setInput(messageText);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
                {bloodRequest.requester?._id === currentUser?.id ? (
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
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading chat messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">
                Start the conversation!
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                {bloodRequest.requester?._id === currentUser?.id ? (
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
                      <li>• Messages are refreshed automatically</li>
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
                    msg.sender === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    ref={(el) => (messagesRef.current[index] = el)}
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      msg.sender === currentUser?.id
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border"
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${
                        msg.sender === currentUser?.id
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.name || "Unknown User"}
                    </div>
                    <div className="break-words">{msg.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        msg.sender === currentUser?.id
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message... (Press Enter to send)"
              maxLength={500}
              disabled={loading || sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || sending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <span className="mr-1">💌</span>
                  Send
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {input.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
