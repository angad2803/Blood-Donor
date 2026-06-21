import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const DonorList = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [sortBy, setSortBy] = useState("distance"); // distance, compatibility, mixed
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
      if (userLocation) {
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
      } else {
        // Fallback to all donors
        const params = new URLSearchParams();
        if (bloodGroup) {
          params.append("bloodGroup", bloodGroup);
        }
        
        const res = await api.get(`/user/all-donors?${params}`);
        if (res.data && res.data.donors) {
          setDonors(res.data.donors);
          if (res.data.donors.length === 0) {
            setError(`No ${bloodGroup || "available"} donors found.`);
          }
        } else {
          setDonors([]);
          setError("No donors found.");
        }
      }
    } catch (err) {
      console.error("Error fetching donors:", err);
      setError("Failed to fetch donors. Please try again.");
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
            <span className="text-3xl">
              {user?.isHospital ? "🏥" : "🩸"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {user?.isHospital
              ? `Find Donors - ${user.hospitalName}`
              : "Find Blood Donors"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Find compatible blood donors near your location with real-time
            distances and routes
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
                    📍 Location is required to find nearby donors
                  </p>
                </div>
              )}

              {/* Blood Group Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blood Group (Optional)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">
                    All Compatible Types
                  </option>
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

              {/* Sort Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="distance">
                    Nearest First
                  </option>
                  <option value="compatibility">
                    Blood Compatibility
                  </option>
                  <option value="mixed">
                    Smart Mix
                  </option>
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={fetchNearbyDonors}
                disabled={loading || !userLocation}
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
                    Find Nearby Donors
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
                Nearby Donors ({donors.length})
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
                    Searching for nearby donors...
                  </p>
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4 opacity-50">👥</div>
                  <p className="text-gray-900 dark:text-white text-lg font-medium">
                    No donors found
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Try expanding your search radius or updating your location
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donors.map((donor) => (
                    <div
                      key={donor._id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {donor.name}
                            </h3>
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2.5 py-1 rounded text-xs font-bold border border-red-200 dark:border-red-800">
                              {donor.bloodGroup}
                            </span>
                            {donor.distance && (
                              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded text-xs font-medium">
                                📍 {formatDistance(donor.distance)}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                            {donor.location && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">📍</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Location:</strong> {donor.location}</span>
                              </p>
                            )}
                            {donor.phone && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">📞</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Phone:</strong> {donor.phone}</span>
                              </p>
                            )}

                            {donor.lastDonationDate && (
                              <p className="flex items-start">
                                <span className="mr-1.5 mt-0.5">📅</span>
                                <span><strong className="text-gray-900 dark:text-gray-100">Last Donation:</strong> {new Date(donor.lastDonationDate).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          {donor.phone && (
                            <a
                              href={`tel:${donor.phone}`}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm flex items-center justify-center shadow-sm"
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

export default DonorList;
