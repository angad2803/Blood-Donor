import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const LocationManager = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [settings, setSettings] = useState({
    shareRealTimeLocation: false,
    maxTravelDistance: 50,
    preferredTravelMethods: ["driving"],
  });

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Try user endpoint first, then fall back to match endpoint
          let response;
          try {
            console.log("Trying user endpoint for location update...");
            response = await api.post("/user/location", {
              latitude,
              longitude,
              accuracy,
            });
          } catch (error) {
            console.log(
              "User endpoint failed, trying match endpoint:",
              error.message
            );
            response = await api.post("/match/location", {
              latitude,
              longitude,
              accuracy,
            });
          }

          console.log("Location update response:", response.data);

          if (response.data.success) {
            setLocation({
              latitude,
              longitude,
              accuracy,
              address:
                response.data.data.address || `${latitude}, ${longitude}`,
              timestamp: new Date(),
            });

            // Clear any previous errors
            setLocationError("");

            // Get nearby requests if location sharing is enabled
            if (settings.shareRealTimeLocation) {
              await fetchNearbyRequests();
            }
          }
        } catch (error) {
          console.error("Error updating location:", error);
          setLocationError("Failed to update location on server.");
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied by user.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [settings.shareRealTimeLocation]);

  // Start real-time location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsSharing(true);
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Try user endpoint first, then fall back to match endpoint
          let response;
          try {
            response = await api.post("/user/location", {
              latitude,
              longitude,
              accuracy,
            });
          } catch (error) {
            console.log(
              "User endpoint failed, trying match endpoint:",
              error.message
            );
            response = await api.post("/match/location", {
              latitude,
              longitude,
              accuracy,
            });
          }

          if (response.data.success) {
            setLocation({
              latitude,
              longitude,
              accuracy,
              address: response.data.data.location.address,
              timestamp: new Date(),
            });

            // Check for nearby emergency requests
            if (response.data.data.nearbyEmergencyRequests > 0) {
              // Could trigger a notification here
              console.log(
                `${response.data.data.nearbyEmergencyRequests} emergency requests nearby!`
              );
            }
          }
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Location tracking error:", error);
        setLocationError("Failed to track location continuously.");
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000, // 1 minute
      }
    );

    setWatchId(id);
  }, []);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
  }, [watchId]);

  // Fetch nearby blood requests
  const fetchNearbyRequests = async () => {
    try {
      const response = await api.get("/match/nearby", {
        params: {
          maxDistance: settings.maxTravelDistance * 1000, // Convert km to meters
          limit: 10,
        },
      });

      if (response.data.success) {
        setNearbyRequests(response.data.data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching nearby requests:", error);
    }
  };

  // Update location preferences
  const updateLocationPreferences = async (newSettings) => {
    try {
      const response = await api.put("/user/location-preferences", newSettings);
      if (response.data.success) {
        setSettings(newSettings);

        // Start/stop tracking based on new settings
        if (newSettings.shareRealTimeLocation && !isSharing) {
          startLocationTracking();
        } else if (!newSettings.shareRealTimeLocation && isSharing) {
          stopLocationTracking();
        }
      }
    } catch (error) {
      console.error("Error updating location preferences:", error);
    }
  };

  // Load initial location preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get("/user/profile");
        if (response.data.success && response.data.data.locationPreferences) {
          setSettings(response.data.data.locationPreferences);
        }
      } catch (error) {
        console.error("Error loading location preferences:", error);
      }
    };

    if (user) {
      loadPreferences();
    }
  }, [user]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (settings.shareRealTimeLocation && !isSharing && location) {
      startLocationTracking();
    }
  }, [
    settings.shareRealTimeLocation,
    isSharing,
    location,
    startLocationTracking,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${Math.round(distance * 10) / 10}km`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="location-manager">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Location Settings</h2>

        {/* Current Location Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Current Location</h3>
          {location ? (
            <div className="bg-gray-50 p-4 rounded">
              <p>
                <strong>Address:</strong> {location.address}
              </p>
              <p>
                <strong>Coordinates:</strong> {location.latitude.toFixed(6)},{" "}
                {location.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Accuracy:</strong> ±{location.accuracy}m
              </p>
              <p>
                <strong>Last Updated:</strong> {formatTime(location.timestamp)}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isSharing
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isSharing ? "🟢 Live Tracking" : "📍 Static Location"}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded">
              <p>
                No location data available. Click "Get Current Location" to
                share your position.
              </p>
            </div>
          )}

          {locationError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mt-2">
              {locationError}
            </div>
          )}
        </div>

        {/* Location Actions */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={getCurrentLocation}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={isSharing}
            >
              Get Current Location
            </button>

            {!isSharing ? (
              <button
                onClick={startLocationTracking}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Start Live Tracking
              </button>
            ) : (
              <button
                onClick={stopLocationTracking}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Stop Live Tracking
              </button>
            )}
          </div>
        </div>

        {/* Location Preferences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Location Preferences</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shareLocation"
                checked={settings.shareRealTimeLocation}
                onChange={(e) =>
                  updateLocationPreferences({
                    ...settings,
                    shareRealTimeLocation: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <label htmlFor="shareLocation" className="text-sm">
                Share my real-time location for emergency requests
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Maximum Travel Distance: {settings.maxTravelDistance}km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={settings.maxTravelDistance}
                onChange={(e) =>
                  updateLocationPreferences({
                    ...settings,
                    maxTravelDistance: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Preferred Travel Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {["driving", "walking", "public_transport"].map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.preferredTravelMethods.includes(method)}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.preferredTravelMethods, method]
                          : settings.preferredTravelMethods.filter(
                              (m) => m !== method
                            );
                        updateLocationPreferences({
                          ...settings,
                          preferredTravelMethods: methods,
                        });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm capitalize">
                      {method.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Requests */}
        {nearbyRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Nearby Blood Requests
            </h3>
            <div className="space-y-3">
              {nearbyRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-gray-50 p-4 rounded border-l-4 border-red-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p>
                        <strong>Blood Type:</strong> {request.bloodGroup}
                      </p>
                      <p>
                        <strong>Hospital:</strong> {request.hospital}
                      </p>
                      <p>
                        <strong>Urgency:</strong>
                        <span
                          className={`ml-1 px-2 py-1 rounded text-xs ${
                            request.urgency === "Emergency"
                              ? "bg-red-100 text-red-800"
                              : request.urgency === "High"
                              ? "bg-orange-100 text-orange-800"
                              : request.urgency === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {request.urgency}
                        </span>
                      </p>
                      <p>
                        <strong>Distance:</strong>{" "}
                        {formatDistance(request.distance)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        /* Handle offer to donate */
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Offer to Donate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManager;
