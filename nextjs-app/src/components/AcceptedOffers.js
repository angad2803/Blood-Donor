"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/api.js";

const AcceptedOffers = ({ onOpenChat, onGetDirections }) => {
  const { user } = useContext(AuthContext);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardsRef = useRef([]);

  useEffect(() => {
    fetchAcceptedOffers();
  }, []);

  useEffect(() => {
    // Animate cards entrance
    if (cardsRef.current && cardsRef.current.length > 0) {
      const validRefs = cardsRef.current.filter((ref) => ref);
      if (validRefs.length > 0 && typeof window !== "undefined") {
        // Simple animation without GSAP for now
        validRefs.forEach((ref, index) => {
          if (ref) {
            ref.style.opacity = "0";
            ref.style.transform = "translateY(30px) scale(0.95)";
            setTimeout(
              () => {
                ref.style.transition = "all 0.6s ease-out";
                ref.style.opacity = "1";
                ref.style.transform = "translateY(0) scale(1)";
              },
              index * 100 + 200
            );
          }
        });
      }
    }
  }, [acceptedOffers]);

  const fetchAcceptedOffers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/offer/accepted");
      setAcceptedOffers(response.data.acceptedOffers);
    } catch (err) {
      setError("Failed to fetch accepted offers");
      console.error("Error fetching accepted offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleGetDirections = (offer) => {
    const userCoords = user.coordinates;
    const requesterCoords = offer.bloodRequest.requester?.coordinates;

    if (!userCoords || !requesterCoords) {
      alert("Location information not available for directions");
      return;
    }

    // If parent component provides directions handler
    if (onGetDirections) {
      const requestForDirections = {
        requester: {
          coordinates: requesterCoords,
        },
        location: offer.bloodRequest.location,
        hospitalName:
          offer.bloodRequest.hospitalName || offer.bloodRequest.location,
      };
      onGetDirections(requestForDirections);
      return;
    }

    // Fallback to external maps
    const lat1 = userCoords.lat;
    const lon1 = userCoords.lng;
    const lat2 = requesterCoords.lat;
    const lon2 = requesterCoords.lng;

    const url = `https://www.google.com/maps/dir/${lat1},${lon1}/${lat2},${lon2}`;
    window.open(url, "_blank");
  };

  const getDirectionsPreview = (offer) => {
    const userCoords = user.coordinates;
    const requesterCoords = offer.bloodRequest.requester?.coordinates;

    if (!userCoords || !requesterCoords) {
      return {
        distance: "N/A",
        mode: "unknown",
        icon: "📍",
        description: "Location unavailable",
        distanceText: "N/A",
        estimatedTime: "N/A",
      };
    }

    const distance = calculateDistance(
      userCoords.lat,
      userCoords.lng,
      requesterCoords.lat,
      requesterCoords.lng
    );

    let mode = "driving";
    let icon = "🚗";
    let description = "Driving";
    let estimatedTime = Math.round(distance * 2); // Rough estimate: 2 minutes per km

    if (distance < 2) {
      mode = "walking";
      icon = "🚶";
      description = "Walking";
      estimatedTime = Math.round(distance * 12); // 12 minutes per km walking
    } else if (distance > 20) {
      icon = "🚗";
      description = "Long drive";
    }

    return {
      distance: distance.toFixed(1),
      mode,
      icon,
      description,
      distanceText: `${distance.toFixed(1)} km`,
      estimatedTime: estimatedTime.toString(),
    };
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
            {acceptedOffers.map((offer, index) => {
              const directionsInfo = getDirectionsPreview(offer);

              return (
                <div
                  key={offer._id}
                  ref={(el) => (cardsRef.current[index] = el)}
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
