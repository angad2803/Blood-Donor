import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

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
            response = await fetch("/api/user/location", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                latitude,
                longitude,
                accuracy,
              }),
            });

            if (!response.ok) {
              throw new Error("User endpoint failed");
            }
          } catch (error) {
            console.log(
              "User endpoint failed, trying match endpoint:",
              error.message
            );
            response = await fetch("/api/match/location", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                latitude,
                longitude,
                accuracy,
              }),
            });
          }

          const data = await response.json();

          if (data.success) {
            setLocation({
              latitude,
              longitude,
              accuracy,
              address: data.address || "Unknown location",
              timestamp: new Date(),
            });

            // Find nearby requests if enabled
            if (settings.shareRealTimeLocation) {
              findNearbyRequests(latitude, longitude);
            }
          }
        } catch (error) {
          console.error("Location update failed:", error);
          setLocationError("Failed to update location on server.");
        }
      },
      (error) => {
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [settings.shareRealTimeLocation]);

  // Start real-time location sharing
  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const response = await fetch("/api/user/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
            }),
          });

          const data = await response.json();

          if (data.success) {
            setLocation({
              latitude,
              longitude,
              accuracy,
              address: data.address || "Unknown location",
              timestamp: new Date(),
            });

            // Find nearby requests
            findNearbyRequests(latitude, longitude);
          }
        } catch (error) {
          console.error("Real-time location update failed:", error);
        }
      },
      (error) => {
        setLocationError(error.message);
        setIsSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 30000,
      }
    );

    setWatchId(id);
    setIsSharing(true);
  }, []);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
  }, [watchId]);

  // Find nearby blood requests
  const findNearbyRequests = async (lat, lng) => {
    try {
      const response = await fetch(
        `/api/match/nearby?maxDistance=50000&limit=10&latitude=${lat}&longitude=${lng}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setNearbyRequests(data.data?.requests || []);
      }
    } catch (error) {
      console.error("Error finding nearby requests:", error);
    }
  };

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // Start/stop sharing based on settings
    if (newSettings.shareRealTimeLocation && !isSharing) {
      startLocationSharing();
    } else if (newSettings.shareRealTimeLocation === false && isSharing) {
      stopLocationSharing();
    }
  };

  // Format distance
  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    // Get initial location
    getCurrentLocation();

    // Cleanup on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [getCurrentLocation]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📍 Location Manager
      </h3>

      {/* Current Location */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Current Location</h4>
        {location ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Coordinates:</strong> {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </p>
            <p className="text-sm text-green-800">
              <strong>Address:</strong> {location.address}
            </p>
            <p className="text-sm text-green-800">
              <strong>Accuracy:</strong> ±{Math.round(location.accuracy)}m
            </p>
            <p className="text-sm text-green-800">
              <strong>Updated:</strong> {formatTimeAgo(location.timestamp)}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">No location data available</p>
          </div>
        )}

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
            <p className="text-sm text-red-800">{locationError}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Controls</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📍 Get Location
          </button>

          {isSharing ? (
            <button
              onClick={stopLocationSharing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              🛑 Stop Sharing
            </button>
          ) : (
            <button
              onClick={startLocationSharing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📡 Start Sharing
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.shareRealTimeLocation}
              onChange={(e) =>
                updateSettings({ shareRealTimeLocation: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Share real-time location
            </span>
          </label>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Max travel distance (km)
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={settings.maxTravelDistance}
              onChange={(e) =>
                updateSettings({ maxTravelDistance: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">
              {settings.maxTravelDistance}km
            </span>
          </div>
        </div>
      </div>

      {/* Nearby Requests */}
      {nearbyRequests.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">
            Nearby Requests ({nearbyRequests.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {nearbyRequests.slice(0, 5).map((request) => (
              <div
                key={request._id}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-red-800">
                      {request.bloodGroup} Blood Needed
                    </p>
                    <p className="text-sm text-red-600">
                      📍 {request.location}
                    </p>
                    <p className="text-sm text-red-600">
                      🚨 {request.urgency} Priority
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-800">
                      {formatDistance(request.distance)}
                    </p>
                    <p className="text-xs text-red-600">
                      {formatTimeAgo(new Date(request.createdAt))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isSharing
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isSharing ? "🟢 Sharing Location" : "⚫ Not Sharing"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
