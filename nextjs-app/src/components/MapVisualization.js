import React, { useState, useEffect, useRef } from "react";

// Simple map component (can be enhanced with actual mapping library)
const MapVisualization = ({ bloodRequestId, donorLocation }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [meetingPoint, setMeetingPoint] = useState(null);
  const mapRef = useRef(null);

  // Load donors for a blood request
  const loadDonorsForRequest = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/match/donors/${requestId}?maxDistance=50000&limit=20&includeRoutes=true`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMapData(data.data);
      }
    } catch (error) {
      console.error("Error loading donors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load route information
  const loadRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      const response = await fetch("/api/match/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          startLat,
          startLng,
          endLat,
          endLng,
          travelMode: "driving",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRouteInfo(data.data);
      }
    } catch (error) {
      console.error("Error loading route:", error);
    }
  };

  // Find optimal meeting point
  const findMeetingPoint = async (donorId, requestId) => {
    try {
      const response = await fetch(
        `/api/match/meeting-point/${requestId}?donorId=${donorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMeetingPoint(data.data);
      }
    } catch (error) {
      console.error("Error finding meeting point:", error);
    }
  };

  useEffect(() => {
    if (bloodRequestId) {
      loadDonorsForRequest(bloodRequestId);
    }
  }, [bloodRequestId]);

  // Helper functions
  const formatDistance = (distanceInMeters) => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      "A+": "text-red-600",
      "A-": "text-red-500",
      "B+": "text-blue-600",
      "B-": "text-blue-500",
      "AB+": "text-purple-600",
      "AB-": "text-purple-500",
      "O+": "text-green-600",
      "O-": "text-green-500",
    };
    return colors[bloodGroup] || "text-gray-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🗺️ Map Visualization
      </h3>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading map data...</span>
        </div>
      )}

      {!loading && bloodRequestId && (
        <div className="mb-4">
          <button
            onClick={() => loadDonorsForRequest(bloodRequestId)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Refresh Map Data
          </button>
        </div>
      )}

      {/* Map Placeholder (would be replaced with actual map component) */}
      <div className="border border-gray-300 rounded-lg h-64 mb-4 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sm">Map visualization would appear here</p>
          <p className="text-xs text-gray-400">
            (Replace with Leaflet, Google Maps, or ArcGIS component)
          </p>
        </div>
      </div>

      {/* Map Data Display */}
      {mapData && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📍 Request Location
            </h4>
            <p className="text-sm text-blue-800">
              <strong>Address:</strong> {mapData.request?.location || "Unknown"}
            </p>
            {mapData.request?.coordinates && (
              <p className="text-sm text-blue-800">
                <strong>Coordinates:</strong>{" "}
                {mapData.request.coordinates.coordinates[1].toFixed(6)},{" "}
                {mapData.request.coordinates.coordinates[0].toFixed(6)}
              </p>
            )}
          </div>

          {/* Donors List */}
          {mapData.donors && mapData.donors.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                🩸 Nearby Donors ({mapData.donors.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mapData.donors.map((donor) => (
                  <div
                    key={donor._id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedDonor?._id === donor._id
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedDonor(donor)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span
                            className={`font-medium text-lg ${getBloodGroupColor(
                              donor.bloodGroup
                            )}`}
                          >
                            {donor.bloodGroup}
                          </span>
                          <span className="ml-2 text-sm text-gray-700">
                            {donor.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          📍 {donor.location || "Location not specified"}
                        </p>
                        {donor.phone && (
                          <p className="text-sm text-gray-600">
                            📞 {donor.phone}
                          </p>
                        )}
                        <div className="flex items-center mt-1 gap-2">
                          <p className="text-xs text-gray-600">
                            Distance: {formatDistance(donor.distance / 1000)}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              Match: {donor.matchScore}%
                            </span>
                          </div>
                        </div>
                        <div className="text-lg">
                          {donor.available ? "🟢" : "🔴"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route Information */}
      {routeInfo && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="font-semibold mb-2">Route Information</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Distance</p>
              <p className="font-medium">
                {formatDistance(routeInfo.distance)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium">
                {formatDuration(routeInfo.duration)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Route Source</p>
              <p className="font-medium capitalize">{routeInfo.source}</p>
            </div>
          </div>

          {routeInfo.directions && routeInfo.directions.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-600 text-sm mb-1">Directions:</p>
              <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                {routeInfo.directions.slice(0, 3).map((direction, index) => (
                  <p key={index}>• {direction}</p>
                ))}
                {routeInfo.directions.length > 3 && (
                  <p>... and {routeInfo.directions.length - 3} more steps</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meeting Point Information */}
      {meetingPoint && (
        <div className="border-t bg-blue-50 p-4">
          <h4 className="font-semibold mb-2">📍 Suggested Meeting Point</h4>
          <div className="text-sm">
            <p>
              <strong>{meetingPoint.meetingPoint.name}</strong>
            </p>
            <p className="text-gray-600">{meetingPoint.meetingPoint.address}</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-gray-600">Donor Travel</p>
                <p>
                  {formatDistance(meetingPoint.donorRoute.distance)} •{" "}
                  {formatDuration(meetingPoint.donorRoute.duration)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Hospital Travel</p>
                <p>
                  {formatDistance(meetingPoint.hospitalRoute.distance)} •{" "}
                  {formatDuration(meetingPoint.hospitalRoute.duration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Donor Actions */}
      {selectedDonor && (
        <div className="border-t bg-green-50 p-4">
          <h4 className="font-semibold mb-2">
            Selected Donor: {selectedDonor.name}
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                loadRoute(
                  mapData.request.coordinates.coordinates[1],
                  mapData.request.coordinates.coordinates[0],
                  selectedDonor.coordinates.coordinates[1],
                  selectedDonor.coordinates.coordinates[0]
                )
              }
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              📍 Show Route
            </button>
            <button
              onClick={() =>
                findMeetingPoint(selectedDonor._id, bloodRequestId)
              }
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              🤝 Find Meeting Point
            </button>
            {selectedDonor.phone && (
              <a
                href={`tel:${selectedDonor.phone}`}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                📞 Call Donor
              </a>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            💡 <strong>Usage:</strong> This component visualizes blood request
            locations and nearby donors.
          </p>
          <p className="mb-1">
            🗺️ <strong>Map Integration:</strong> Replace the placeholder with
            Leaflet, Google Maps, or ArcGIS.
          </p>
          <p>
            📊 <strong>Features:</strong> Route calculation, meeting point
            suggestion, and donor matching.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapVisualization;
