// Enhanced Donors List with Geolocation
import React, { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import LocationManager from "../components/LocationManager";

const DonorList = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [sortBy, setSortBy] = useState("distance"); // distance, compatibility, mixed
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

  const fetchNearbyDonors = async () => {
    if (!userLocation) {
      setError(
        "Location is required to find nearby donors. Please enable location access."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      // First update user location on server
      await api.post("/user/location", {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracy: 50,
      });

      // Use the new geolocation-based donor search
      const params = new URLSearchParams({
        maxDistance: (searchRadius * 1000).toString(), // Convert km to meters
        limit: "20",
        sortBy,
        includeRoutes: includeRoutes.toString(),
      });

      if (bloodGroup) {
        params.append("bloodGroup", bloodGroup);
      }

      const res = await api.get(`/user/nearby-donors?${params}`);

      if (res.data.success) {
        setDonors(res.data.data.donors || []);

        if (res.data.data.donors.length === 0) {
          setError(
            `No ${
              bloodGroup || "compatible"
            } donors found within ${searchRadius}km. Try expanding your search radius.`
          );
        }
      } else {
        setDonors([]);
        setError(res.data.message || "No donors found in your area.");
      }
    } catch (err) {
      console.error("Error fetching nearby donors:", err);
      setError("Failed to find nearby donors. Please try again.");
      setDonors([]);
    }
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.isHospital
              ? `🏥 Find Donors - ${user.hospitalName}`
              : "🩸 Find Donors"}
          </h1>
          <p className="mt-2 text-gray-600">
            Find compatible blood donors near your location with real-time
            distances and routes
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
                    📍 Location access needed to find nearby donors
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition"
                  >
                    Get My Location
                  </button>
                </div>
              )}

              {/* Blood Group Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group (Optional)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">All Compatible Types</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>

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

              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="distance">Nearest First</option>
                  <option value="compatibility">Blood Compatibility</option>
                  <option value="mixed">Smart Mix</option>
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
                onClick={fetchNearbyDonors}
                disabled={loading || !userLocation}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "🔍 Searching..." : "🔍 Find Nearby Donors"}
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
                          ? "bg-blue-100 border-blue-300 text-blue-800"
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
                Nearby Donors ({donors.length})
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Searching for nearby donors...
                  </p>
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-lg font-medium">No donors found</p>
                  <p className="text-sm mt-2">
                    Try expanding your search radius or updating your location
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donors.map((donor) => (
                    <div
                      key={donor._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {donor.name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {donor.bloodGroup}
                            </span>
                            {donor.distance && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📍 {formatDistance(donor.distance)}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            {donor.location && (
                              <p>
                                📍 <strong>Location:</strong> {donor.location}
                              </p>
                            )}
                            {donor.phone && (
                              <p>
                                📞 <strong>Phone:</strong> {donor.phone}
                              </p>
                            )}
                            {donor.routeInfo && (
                              <p>
                                🛣️ <strong>Route:</strong>{" "}
                                {formatRouteInfo(donor.routeInfo)}
                              </p>
                            )}
                            {donor.lastDonationDate && (
                              <p>
                                📅 <strong>Last Donation:</strong>{" "}
                                {new Date(
                                  donor.lastDonationDate
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {donor.phone && (
                            <a
                              href={`tel:${donor.phone}`}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition text-center"
                            >
                              📞 Call
                            </a>
                          )}
                          {donor.routeInfo && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${donor.coordinates?.coordinates[1]},${donor.coordinates?.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition text-center"
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

export default DonorList;
