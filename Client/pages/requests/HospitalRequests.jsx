import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { toast } from "react-toastify";

const HospitalRequests = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchRequests = useCallback(async () => {
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
  }, [user?.location]);

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

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "urgent":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "high":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "medium":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.urgency?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-4xl mb-4 opacity-50">🏥</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Loading blood requests...</p>
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Main Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hospital Blood Requests
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Manage and fulfill blood requests in your area
                </p>
              </div>
            </div>

            {/* Hospital Info Card */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                {user?.hospitalName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user?.hospitalName}
                </div>
                {user?.location && (
                  <div className="flex items-center space-x-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-48 truncate">
                    <span>📍</span>
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span className="mr-2">🏠</span>
                Dashboard
              </button>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 flex flex-wrap items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Filter by urgency:
          </span>
          {[
            { id: "all", label: "All Requests", variant: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" },
            { id: "critical", label: "Critical", variant: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50" },
            { id: "urgent", label: "Urgent", variant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50" },
            { id: "high", label: "High", variant: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border border-transparent ${
                filter === filterOption.id
                  ? `${filterOption.variant} ring-2 ring-offset-1 ring-blue-500`
                  : filterOption.variant
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Blood Requests ({filteredRequests.length})
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Active blood requests requiring hospital attention
            </p>
          </div>

          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-50">🩺</div>
                <p className="text-gray-900 dark:text-white text-lg font-medium">
                  {filter === "all"
                    ? "No blood requests found"
                    : `No ${filter} priority requests found`}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Check back later or adjust your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-5 hover:shadow-md transition-shadow ${
                      request.location?.toLowerCase() === user?.location?.toLowerCase()
                        ? "border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center bg-red-100 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {request.bloodGroup}
                          </div>
                          <div className="text-[10px] uppercase font-semibold text-red-600 dark:text-red-500 mt-1">
                            Blood Type
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Request #{request._id.slice(-6)}
                          </h3>
                          <div className="flex items-center flex-wrap gap-2 mb-1.5">
                            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                              <span className="mr-1">📍</span> {request.location}
                            </span>
                            {request.location?.toLowerCase() === user?.location?.toLowerCase() && (
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                Same Location
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <span className="mr-1">👤</span> Requested by: <span className="font-medium text-gray-900 dark:text-gray-200 ml-1">{request.requester?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getUrgencyColor(
                            request.urgency
                          )} ${request.urgency?.toLowerCase() === "critical" ? "animate-pulse" : ""}`}
                        >
                          {request.urgency || "NORMAL"}
                        </span>
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                          <div>{new Date(request.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        {!request.fulfilled && (
                          <button
                            onClick={() => handleFulfillRequest(request._id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm flex items-center shadow-sm"
                          >
                            <span className="mr-2">✅</span>
                            <span>Fulfill</span>
                          </button>
                        )}
                      </div>

                      {request.fulfilled && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-md text-sm font-medium flex items-center">
                          <span className="mr-1.5">✅</span>
                          <span>Fulfilled</span>
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


    </div>
  );
};

export default HospitalRequests;
