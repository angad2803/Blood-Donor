import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import api from "../api/api";
import { toast } from "react-toastify";

const socket = io("http://localhost:5000");

const ChatPage = () => {
  const { requestId } = useParams();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [requestInfo, setRequestInfo] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const fetchChatData = async () => {
      try {
        // Fetch messages
        const messagesRes = await api.get(`/message/${requestId}`);
        setMessages(messagesRes.data.messages);

        // Fetch request information
        const requestsRes = await api.get("/request/all");
        const request = requestsRes.data.requests.find(
          (r) => r._id === requestId
        );
        setRequestInfo(request);
      } catch (err) {
        console.error("Failed to load chat data", err);
        toast.error("Failed to load chat data");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
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

    // Emit to socket for real-time delivery
    socket.emit("send-message", {
      roomId: requestId,
      message: messageData,
    });

    // Add to local state immediately for better UX
    setMessages((prev) => [...prev, messageData]);
    setInput("");

    // Save to database
    try {
      await api.post(`/message/${requestId}`, { text: input });
    } catch (err) {
      console.error("Failed to save message", err);
      toast.error("Failed to save message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[90vh]">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                💬 Blood Request Chat
              </h2>
              {requestInfo && (
                <div className="text-sm opacity-90">
                  <span className="font-medium">{requestInfo.bloodGroup}</span>{" "}
                  at <span className="font-medium">{requestInfo.location}</span>{" "}
                  •{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      requestInfo.urgency === "Emergency" ||
                      requestInfo.urgency === "urgent"
                        ? "bg-red-500"
                        : requestInfo.urgency === "High" ||
                          requestInfo.urgency === "moderate"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {requestInfo.urgency}
                  </span>
                  <div className="mt-1 text-xs">
                    {requestInfo.requester._id === user._id ? (
                      <span className="bg-blue-500 bg-opacity-30 px-2 py-1 rounded">
                        📋 Your Request
                      </span>
                    ) : (
                      <span className="bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                        🩸 Helping Request by {requestInfo.requester.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/dashboard"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-3 py-2 rounded text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-lg font-medium mb-2">Welcome to the chat!</p>
              {requestInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  {requestInfo.requester._id === user._id ? (
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>This is your blood request chat room.</strong>
                      </p>
                      <p className="text-xs text-blue-600">
                        • Potential donors can find and join this chat to
                        coordinate with you
                        <br />
                        • Share additional details, location specifics, or
                        timing
                        <br />• All messages are saved for your reference
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>
                          You're helping {requestInfo.requester.name} with their
                          blood request.
                        </strong>
                      </p>
                      <p className="text-xs text-blue-600">
                        • Use this chat to coordinate donation details
                        <br />
                        • Ask about timing, location, or specific requirements
                        <br />• The requester will see your messages in
                        real-time
                      </p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm mt-4">Start the conversation below!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === user._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === user._id
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">{msg.name}</div>
                  <div className="break-words">{msg.text}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message..."
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
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

export default ChatPage;
