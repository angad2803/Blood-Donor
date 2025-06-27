import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import ChatComponent from "../components/ChatComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const HospitalRequests = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [filter, setFilter] = useState("all"); // all, urgent, critical

  // Redirect non-hospital users
  useEffect(() => {
    if (user && !user.isHospital) {
      navigate("/dashboard");
      toast.error("Access denied. This page is for hospitals only.");
      return;
    }
    if (user?.isHospital) {
      fetchRequests();
    }
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/request/all");

      // Filter requests based on location proximity if hospital has location
      let filteredRequests = response.data.requests;

      if (user?.location) {
        // Prioritize requests in the same location as the hospital
        filteredRequests = response.data.requests.sort((a, b) => {
          const aMatch =
            a.location?.toLowerCase() === user.location?.toLowerCase();
          const bMatch =
            b.location?.toLowerCase() === user.location?.toLowerCase();

          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;

          // Sort by urgency for same location priority
          const urgencyOrder = {
            critical: 4,
            urgent: 3,
            high: 2,
            medium: 1,
            low: 0,
          };
          return (
            (urgencyOrder[b.urgency?.toLowerCase()] || 0) -
            (urgencyOrder[a.urgency?.toLowerCase()] || 0)
          );
        });
      }

      setRequests(filteredRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch blood requests");
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillRequest = async (requestId) => {
    try {
      await api.put(`/request/${requestId}/fulfill`, {
        fulfilledBy: user._id,
        hospitalName: user.hospitalName,
      });

      toast.success("🎉 Blood request marked as fulfilled successfully!");
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error fulfilling request:", error);
      toast.error(error.response?.data?.message || "Failed to fulfill request");
    }
  };

  const handleOpenChat = (request) => {
    setSelectedChatRequest(request);
    setShowChatModal(true);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "high":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.urgency?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          color="red"
          message="Loading blood requests..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Main Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Hospital Blood Request Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  View and fulfill nearby blood requests
                </p>
              </div>

              {/* Hospital Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-4">
                  {/* Hospital Icon */}
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      🏥
                    </span>
                  </div>

                  {/* Hospital Details */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.hospitalName}
                      </span>
                    </div>

                    {/* Location Info */}
                    {user?.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-400">📍</span>
                        <span className="text-xs text-gray-500 truncate max-w-48">
                          {user.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors duration-200"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Filter by urgency:
            </span>
            {[
              { id: "all", label: "All Requests", color: "gray" },
              { id: "critical", label: "Critical", color: "red" },
              { id: "urgent", label: "Urgent", color: "orange" },
              { id: "high", label: "High", color: "yellow" },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filter === filterOption.id
                    ? `bg-${filterOption.color}-100 text-${filterOption.color}-800 border border-${filterOption.color}-200`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Blood Requests ({filteredRequests.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Active blood requests that need hospital fulfillment
            </p>
          </div>
          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🩺</div>
                <p className="text-gray-500 text-lg">
                  {filter === "all"
                    ? "No blood requests found"
                    : `No ${filter} priority requests found`}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Check back later or adjust your filters
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md ${
                      request.location?.toLowerCase() ===
                      user?.location?.toLowerCase()
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">
                            {request.bloodGroup}
                          </div>
                          <div className="text-xs text-gray-500">
                            Blood Type
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Blood Request #{request._id.slice(-6)}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">
                              📍 {request.location}
                            </span>
                            {request.location?.toLowerCase() ===
                              user?.location?.toLowerCase() && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Same Location
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">
                              Requested by: {request.requester?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(
                            request.urgency
                          )}`}
                        >
                          {request.urgency?.toUpperCase() || "NORMAL"}
                        </span>
                        <div className="text-right text-xs text-gray-500">
                          <div>
                            Created:{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenChat(request)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>💬</span>
                          <span>Contact Requester</span>
                        </button>

                        {!request.fulfilled && (
                          <button
                            onClick={() => handleFulfillRequest(request._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 flex items-center space-x-2"
                          >
                            <span>✅</span>
                            <span>Mark as Fulfilled</span>
                          </button>
                        )}
                      </div>

                      {request.fulfilled && (
                        <div className="text-green-600 font-medium flex items-center space-x-1">
                          <span>✅</span>
                          <span>Request Fulfilled</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatComponent
        bloodRequest={selectedChatRequest}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
};

export default HospitalRequests;
