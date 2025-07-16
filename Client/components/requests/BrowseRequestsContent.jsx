import React from "react";
import BloodRequestCarousel from "./BloodRequestCarousel";
import LeafletMap from "../maps/LeafletMap";

const BrowseRequestsContent = ({
  requests,
  requestsWithOffers,
  user,
  showMapView,
  setShowMapView,
  handleSendOffer,
  handleOpenChat,
  handleGetDirections,
  arcgisDirectionsRef,
}) => {
  const availableRequests = requests.filter(
    (req) =>
      !requestsWithOffers.has(req._id) && req.requester?._id !== user?._id // Filter out user's own requests
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* View Toggle Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Blood Requests Near You
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {availableRequests.length} urgent blood requests in your area
          </p>
        </div>
        {/* View Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setShowMapView(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !showMapView
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setShowMapView(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              showMapView
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ Map View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showMapView ? (
          <div className="h-96 rounded-lg overflow-hidden">
            <LeafletMap
              requests={availableRequests}
              onSendOffer={handleSendOffer}
              onOpenChat={handleOpenChat}
              onGetDirections={handleGetDirections}
              arcgisDirectionsRef={arcgisDirectionsRef}
            />
          </div>
        ) : (
          <BloodRequestCarousel
            requests={availableRequests}
            onSendOffer={handleSendOffer}
            onOpenChat={handleOpenChat}
            onGetDirections={handleGetDirections}
          />
        )}
      </div>
    </div>
  );
};

export default BrowseRequestsContent;
