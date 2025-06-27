import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import LocationManager from "../components/LocationManager";

const NearbyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [includeRoutes, setIncludeRoutes] = useState(false);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setError("");
      },
      (error) => {
        setError("Failed to get your location. Please enable location access.");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

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
      } else {
        // Get current location
        getCurrentLocation();
      }
    }
  }, [user, getCurrentLocation]);

  const fetchNearbyRequests = useCallback(async () => {
    if (!userLocation && !user?.isDonor) {
      setError(
        "Location is required to find nearby requests. Please enable location access."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Update user location on server if available
      if (userLocation) {
        await api.post("/user/location", {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: 50,
        });
      }

      // Use the enhanced geolocation-based matching
      const params = new URLSearchParams({
        maxDistance: (searchRadius * 1000).toString(), // Convert km to meters
        limit: "20",
        includeRoutes: includeRoutes.toString(),
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
    } catch (err) {
      console.error("Error fetching nearby requests:", err);
      setError("Failed to find nearby requests. Please try again.");
      setRequests([]);
    }
    setLoading(false);
  }, [user, userLocation, searchRadius, urgencyFilter, includeRoutes]);

  // Auto-fetch when location is available
  useEffect(() => {
    if (user?.isDonor && userLocation) {
      fetchNearbyRequests();
    }
  }, [user, userLocation, fetchNearbyRequests]);

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

  // Format route info for display
  const formatRouteInfo = (routeInfo) => {
    if (!routeInfo) return null;

    const duration = Math.round(routeInfo.duration / 60); // Convert to minutes
    const distance = formatDistance(routeInfo.distance);

    return `${distance} • ${duration} min`;
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Emergency":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.isDonor ? "🩸 Nearby Blood Requests" : "🏥 Blood Requests"}
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.isDonor
              ? "Find blood requests near your location where you can help save lives"
              : "View blood requests in your area"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Search Settings</h2>

              {/* Location Status */}
              {userLocation ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    📍 <strong>Location:</strong>{" "}
                    {userLocation.latitude.toFixed(4)},{" "}
                    {userLocation.longitude.toFixed(4)}
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Update Location
                  </button>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    📍 Location access needed to find nearby requests
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition"
                  >
                    Get My Location
                  </button>
                </div>
              )}

              {/* Search Radius */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5km</span>
                  <span>100km</span>
                </div>
              </div>

              {/* Urgency Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Filter
                </label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">All Urgency Levels</option>
                  <option value="Emergency">Emergency Only</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Include Routes */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRoutes}
                    onChange={(e) => setIncludeRoutes(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Include driving directions
                  </span>
                </label>
              </div>

              {/* Search Button */}
              <button
                onClick={fetchNearbyRequests}
                disabled={loading || (!userLocation && user?.isDonor)}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "🔍 Searching..." : "🔍 Find Requests"}
              </button>

              {/* Quick Distance Buttons */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Quick Distance:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => setSearchRadius(distance)}
                      className={`py-2 px-3 text-xs rounded border transition ${
                        searchRadius === distance
                          ? "bg-red-100 border-red-300 text-red-800"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {distance}km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Manager Component */}
            <div className="mt-6">
              <LocationManager />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Blood Requests ({requests.length})
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Searching for nearby blood requests...
                  </p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🩸</div>
                  <p className="text-lg font-medium">No blood requests found</p>
                  <p className="text-sm mt-2">
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
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              {request.bloodGroup}
                            </span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(
                                request.urgency
                              )}`}
                            >
                              {request.urgency}
                            </span>
                            {request.distance && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                📍 {formatDistance(request.distance)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {request.hospitalName || "Medical Emergency"}
                          </h3>

                          <div className="space-y-1 text-sm text-gray-600">
                            {request.location && (
                              <p>
                                📍 <strong>Location:</strong> {request.location}
                              </p>
                            )}
                            {request.requester?.name && (
                              <p>
                                👤 <strong>Contact:</strong>{" "}
                                {request.requester.name}
                              </p>
                            )}
                            {request.contactInfo && (
                              <p>
                                📞 <strong>Phone:</strong> {request.contactInfo}
                              </p>
                            )}
                            {request.routeInfo && (
                              <p>
                                🛣️ <strong>Route:</strong>{" "}
                                {formatRouteInfo(request.routeInfo)}
                              </p>
                            )}
                            <p>
                              📅 <strong>Posted:</strong>{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {user?.isDonor && (
                            <button
                              onClick={() => handleFulfill(request.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
                            >
                              ✅ I Can Help
                            </button>
                          )}
                          {request.contactInfo && (
                            <a
                              href={`tel:${request.contactInfo}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition text-center"
                            >
                              📞 Call
                            </a>
                          )}
                          {request.coordinates && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${request.coordinates.coordinates[1]},${request.coordinates.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition text-center"
                            >
                              🗺️ Navigate
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
