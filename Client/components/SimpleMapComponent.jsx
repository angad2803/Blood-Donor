// Simple Map Component - Fallback without ArcGIS SDK
import React from "react";

const SimpleMapComponent = ({
  bloodRequests = [],
  onRequestSelect,
  height = "500px",
}) => {
  const handleDirections = (request) => {
    if (request.requester?.coordinates?.coordinates) {
      const [lng, lat] = request.requester.coordinates.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(googleMapsUrl, "_blank");
    } else {
      const encodedLocation = encodeURIComponent(request.location);
      const googleMapsUrl = `https://www.google.com/maps/search/${encodedLocation}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  const handleOfferSend = (request) => {
    if (onRequestSelect) {
      onRequestSelect(request);
    }
  };

  return (
    <div className="relative" style={{ height }}>
      {/* Placeholder Map */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Interactive Map Loading...
          </h3>
          <p className="text-gray-600 mb-6">
            Professional ArcGIS map will load here
          </p>

          {/* Blood Requests List */}
          <div className="max-w-md mx-auto space-y-3">
            <h4 className="font-medium text-gray-800 mb-3">
              Available Blood Requests:
            </h4>
            {bloodRequests.slice(0, 3).map((request, index) => (
              <div
                key={request._id || index}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-600">
                    {request.bloodGroup} Blood
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.urgency === "Emergency"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  📍 {request.location}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOfferSend(request)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    💌 Send Offer
                  </button>
                  <button
                    onClick={() => handleDirections(request)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    🗺️ Directions
                  </button>
                </div>
              </div>
            ))}

            {bloodRequests.length > 3 && (
              <p className="text-sm text-gray-500">
                ... and {bloodRequests.length - 3} more requests
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapComponent;
