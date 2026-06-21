import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const NearbyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [urgencyFilter, setUrgencyFilter] = useState("");
  // Auto-get location on component mount
  useEffect(() => {
    if (user) {
      // Try to get location from user profile first
      if (
        user.coordinates &&
        user.coordinates.coordinates &&
        user.coordinates.coordinates[0] !== 0 &&
        user.coordinates.coordinates[1] !== 0
      ) {
        setUserLocation({
          latitude: user.coordinates.coordinates[1],
          longitude: user.coordinates.coordinates[0],
        });
      }
    }
  }, [user]);

  const fetchNearbyRequests = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      if (userLocation) {
        // Update user location on server if available
        await api.post("/user/location", {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: 50,
        });

        // Use the enhanced geolocation-based matching
        const params = new URLSearchParams({
          maxDistance: (searchRadius * 1000).toString(), // Convert km to meters
          limit: "20",
        });

        if (urgencyFilter) {
          params.append("urgencyFilter", urgencyFilter);
        }

        const res = await api.get(`/match/nearby?${params}`);

        if (res.data.success) {
          setRequests(res.data.data.requests || []);

          if (res.data.data.requests.length === 0) {
            setError(
              res.data.message ||
                `No blood requests found within ${searchRadius}km. Try expanding your search radius.`
            );
          }
        } else {
          setRequests([]);
          setError(res.data.message || "No blood requests found in your area.");
        }
      } else {
        // Fallback to getting all requests
        const res = await api.get("/request/all");
        if (res.data && res.data.requests) {
          let reqs = res.data.requests;
          if (urgencyFilter) {
            reqs = reqs.filter(r => r.urgency === urgencyFilter);
          }
          setRequests(reqs);
          if (reqs.length === 0) {
            setError("No active blood requests found.");
          }
        } else {
          setRequests([]);
          setError("No blood requests found.");
        }
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to fetch requests. Please try again.");
      setRequests([]);
    }
    setLoading(false);
  }, [userLocation, searchRadius, urgencyFilter]);

  // Auto-fetch requests
  useEffect(() => {
    fetchNearbyRequests();
  }, [fetchNearbyRequests]);

  const handleFulfill = async (id) => {
    try {
      await api.put(`/request/${id}/fulfill`);
      toast.success("✅ Request fulfilled!");

      // Update UI
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error fulfilling request", err);
      toast.error("❌ Failed to fulfill request");
    }
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Emergency":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
            <span className="text-3xl">
              {user?.isDonor ? "🩸" : "🏥"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {user?.isDonor ? "Nearby Blood Requests" : "Blood Requests"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {user?.isDonor
              ? "Find blood requests near your location where you can help save lives"
              : "View blood requests in your area"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                Search Settings
              </h2>

              {userLocation ? (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    📍 <strong>Location:</strong>{" "}
                    {user.location || "User Location"}
                  </p>
                </div>
              ) : (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                    📍 Location is required to find nearby requests
                  </p>
                </div>
              )}

              {/* Search Radius */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Radius: {searchRadius}km
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                  <span>5km</span>
                  <span>100km</span>
                </div>
              </div>

              {/* Urgency Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgency Filter
                </label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Urgency Levels</option>
                  <option value="Emergency">Emergency Only</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={fetchNearbyRequests}
                disabled={loading || (!userLocation && user?.isDonor)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    Find Requests
                  </>
                )}
              </button>

              {/* Quick Distance Buttons */}
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Distance:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => setSearchRadius(distance)}
                      className={`py-2 px-3 text-xs rounded-md transition-colors border ${
                        searchRadius === distance
                          ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {distance}km
                    </button>
                  ))}
                </div>
              </div>
            </div>


          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                Blood Requests ({requests.length})
              </h2>

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4 opacity-50">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Searching for nearby blood requests...
                  </p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4 opacity-50">📋</div>
                  <p className="text-gray-900 dark:text-white text-lg font-medium">
                    No blood requests found
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {user?.isDonor
                      ? "No one needs your blood type in your area right now. Thank you for being ready to help!"
                      : "Try expanding your search radius or check back later"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2.5 py-1 rounded text-xs font-bold border border-red-200 dark:border-red-800">
                              {request.bloodGroup}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-bold border ${getUrgencyColor(
                                request.urgency
                              )} ${request.urgency === "Emergency" ? "animate-pulse" : ""}`}
                            >
                              {request.urgency}
                            </span>
                            {request.distance && (
                              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded text-xs font-medium">
                                📍 {formatDistance(request.distance)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {request.hospitalName || "Medical Emergency"}
                          </h3>

                          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                            {request.location && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">📍</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Location:</strong> {request.location}</span>
                              </p>
                            )}
                            {request.requester?.name && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">👤</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Contact:</strong> {request.requester.name}</span>
                              </p>
                            )}
                            {request.contactInfo && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">📞</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Phone:</strong> {request.contactInfo}</span>
                              </p>
                            )}

                            <p className="flex items-start">
                              <span className="mr-1.5 mt-0.5">📅</span>
                              <span><strong className="text-gray-900 dark:text-gray-100">Posted:</strong> {new Date(request.createdAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          {user?.isDonor && (
                            <button
                              onClick={() => handleFulfill(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center shadow-sm"
                            >
                              ✅ I Can Help
                            </button>
                          )}
                          {request.contactInfo && (
                            <a
                              href={`tel:${request.contactInfo}`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white border border-gray-200 dark:border-gray-500 font-medium px-4 py-2 rounded-md transition-colors text-sm text-center flex items-center justify-center shadow-sm"
                            >
                              📞 Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyRequests;
