import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import mapsDirectionsService from "../utils/mapsDirectionsService";

const AcceptedOffers = ({ onOpenChat }) => {
  const { user } = useContext(AuthContext);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAcceptedOffers();
  }, []);

  const fetchAcceptedOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/offer/accepted");
      setAcceptedOffers(response.data.acceptedOffers);
    } catch (err) {
      setError("Failed to fetch accepted offers");
      console.error("Error fetching accepted offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = (offer) => {
    const userCoords = user.coordinates?.coordinates;
    const requesterCoords =
      offer.bloodRequest.requester.coordinates?.coordinates;

    if (!userCoords || !requesterCoords) {
      alert("Location information not available for directions");
      return;
    }

    const [userLon, userLat] = userCoords;
    const [reqLon, reqLat] = requesterCoords;

    // Get directions info
    const directionsInfo = mapsDirectionsService.getDirectionsInfo(
      userLat,
      userLon,
      reqLat,
      reqLon
    );

    // Open directions in maps app
    mapsDirectionsService.openDirections(
      userLat,
      userLon,
      reqLat,
      reqLon,
      directionsInfo.mode
    );
  };

  const getDirectionsPreview = (offer) => {
    const userCoords = user.coordinates?.coordinates;
    const requesterCoords =
      offer.bloodRequest.requester.coordinates?.coordinates;

    if (!userCoords || !requesterCoords) {
      return { distance: "N/A", mode: "unknown", icon: "📍" };
    }

    const [userLon, userLat] = userCoords;
    const [reqLon, reqLat] = requesterCoords;

    return mapsDirectionsService.getDirectionsInfo(
      userLat,
      userLon,
      reqLat,
      reqLon
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2">Loading accepted offers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchAcceptedOffers}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="text-green-600 mr-2">✅</span>
          Accepted Donation Requests
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          These are the blood donation requests where your offer was accepted
        </p>
      </div>

      <div className="p-6">
        {acceptedOffers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🩸</div>
            <p className="text-gray-500 mb-2">No accepted offers yet</p>
            <p className="text-sm text-gray-400">
              Once a requester accepts your donation offer, it will appear here
              with routing information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {acceptedOffers.map((offer) => {
              const directionsInfo = getDirectionsPreview(offer);

              return (
                <div
                  key={offer._id}
                  className="border border-green-200 rounded-lg p-4 bg-green-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <span className="mr-2">🩸</span>
                        {offer.bloodRequest.bloodGroup} Blood Donation
                      </h3>
                      <p className="text-sm text-green-600">
                        Accepted on{" "}
                        {new Date(offer.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Confirmed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Requester Details
                      </h4>
                      <p className="text-sm text-gray-600">
                        <strong>Name:</strong>{" "}
                        {offer.bloodRequest.requester.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Location:</strong>{" "}
                        {offer.bloodRequest.requester.location}
                      </p>
                      {offer.bloodRequest.requester.phone && (
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong>
                          <a
                            href={`tel:${offer.bloodRequest.requester.phone}`}
                            className="text-blue-600 hover:underline ml-1"
                          >
                            {offer.bloodRequest.requester.phone}
                          </a>
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Travel Information
                      </h4>
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">
                          {directionsInfo.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {directionsInfo.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {directionsInfo.distanceText} • ~
                            {directionsInfo.estimatedTime} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Your Offer Message
                    </h4>
                    <p className="text-sm text-gray-600 italic">
                      "{offer.message}"
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGetDirections(offer)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                    >
                      <span className="mr-2">🗺️</span>
                      Get Directions
                    </button>

                    <button
                      onClick={() =>
                        onOpenChat && onOpenChat(offer.bloodRequest)
                      }
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center"
                    >
                      <span className="mr-2">💬</span>
                      Chat
                    </button>

                    {offer.bloodRequest.requester.phone && (
                      <button
                        onClick={() =>
                          window.open(
                            `tel:${offer.bloodRequest.requester.phone}`
                          )
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                      >
                        <span className="mr-2">📞</span>
                        Call
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptedOffers;
