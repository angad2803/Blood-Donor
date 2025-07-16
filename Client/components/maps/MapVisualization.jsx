import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";

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
      const response = await api.get(`/match/donors/${requestId}`, {
        params: {
          maxDistance: 50000,
          limit: 20,
          includeRoutes: true,
        },
      });

      if (response.data.success) {
        setMapData(response.data.data);
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
      const response = await api.post("/match/route", {
        startLat,
        startLng,
        endLat,
        endLng,
        travelMode: "driving",
      });

      if (response.data.success) {
        setRouteInfo(response.data.data);
      }
    } catch (error) {
      console.error("Error loading route:", error);
    }
  };

  // Find optimal meeting point
  const findMeetingPoint = async (donorId, requestId) => {
    try {
      const response = await api.get(`/match/meeting-point/${requestId}`, {
        params: { donorId },
      });

      if (response.data.success) {
        setMeetingPoint(response.data.data);
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

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);

    if (mapData?.request && donor.coordinates) {
      // Load route information
      loadRoute(
        donor.coordinates.coordinates[1], // lat
        donor.coordinates.coordinates[0], // lng
        mapData.request.coordinates.coordinates[1],
        mapData.request.coordinates.coordinates[0]
      );

      // Find meeting point
      findMeetingPoint(donor._id, mapData.request._id);
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${Math.round(distance * 10) / 10}km`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="map-visualization">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Map Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            {bloodRequestId ? "Available Donors Map" : "Location Overview"}
          </h3>
          {mapData && (
            <p className="text-sm text-gray-600 mt-1">
              Found {mapData.donors.length} compatible donors within{" "}
              {formatDistance(mapData.searchRadius / 1000)}
            </p>
          )}
        </div>

        <div className="flex">
          {/* Map Area (Placeholder) */}
          <div className="flex-1">
            <div
              ref={mapRef}
              className="h-96 bg-gray-100 flex items-center justify-center relative"
            >
              {/* This is a placeholder for the actual map */}
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600">Interactive Map</p>
                <p className="text-sm text-gray-500 mt-1">
                  Integration with mapping libraries like Leaflet, Mapbox, or
                  Google Maps
                </p>

                {/* Simple visualization of locations */}
                {mapData && (
                  <div className="mt-4 p-4 bg-white rounded shadow">
                    <div className="text-sm">
                      <p>
                        <strong>🏥 Request Location:</strong>
                      </p>
                      <p className="text-xs text-gray-600">
                        {mapData.request.coordinates.coordinates[1].toFixed(4)},
                        {mapData.request.coordinates.coordinates[0].toFixed(4)}
                      </p>

                      {selectedDonor && (
                        <>
                          <p className="mt-2">
                            <strong>👤 Selected Donor:</strong>
                          </p>
                          <p className="text-xs text-gray-600">
                            {selectedDonor.coordinates.coordinates[1].toFixed(
                              4
                            )}
                            ,
                            {selectedDonor.coordinates.coordinates[0].toFixed(
                              4
                            )}
                          </p>
                          <p className="text-xs text-green-600">
                            Distance:{" "}
                            {formatDistance(selectedDonor.distance / 1000)}
                          </p>
                        </>
                      )}

                      {meetingPoint && (
                        <>
                          <p className="mt-2">
                            <strong>📍 Meeting Point:</strong>
                          </p>
                          <p className="text-xs text-gray-600">
                            {meetingPoint.meetingPoint.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            Total Distance:{" "}
                            {formatDistance(meetingPoint.totalDistance)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar with donor list */}
          {mapData && (
            <div className="w-80 border-l bg-gray-50">
              <div className="p-4">
                <h4 className="font-semibold mb-3">Available Donors</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {mapData.donors.map((donor) => (
                    <div
                      key={donor._id}
                      onClick={() => handleDonorSelect(donor)}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedDonor?._id === donor._id
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{donor.name}</p>
                          <p className="text-xs text-gray-600">
                            Blood Type: {donor.bloodGroup}
                          </p>
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
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

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
              <p className="text-gray-600">
                {meetingPoint.meetingPoint.address}
              </p>
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
      </div>

      {/* Integration Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">
          🗺️ Map Integration Ready
        </h4>
        <p className="text-sm text-yellow-700">
          This component is prepared for integration with mapping libraries
          like:
        </p>
        <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
          <li>
            <strong>Leaflet</strong> - Free, open-source mapping
          </li>
          <li>
            <strong>Mapbox GL JS</strong> - Advanced mapping with ArcGIS-like
            features
          </li>
          <li>
            <strong>Google Maps</strong> - Popular mapping solution
          </li>
          <li>
            <strong>ArcGIS Maps SDK</strong> - Professional GIS capabilities
          </li>
        </ul>
        <p className="text-sm text-yellow-700 mt-2">
          The geolocation service provides all necessary data for map
          visualization.
        </p>
      </div>
    </div>
  );
};

export default MapVisualization;
