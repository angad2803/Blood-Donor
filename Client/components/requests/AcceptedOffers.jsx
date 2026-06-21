import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api.js";
import { gsap } from "gsap";

const AcceptedOffers = ({ onOpenChat }) => {
  const { user } = useContext(AuthContext);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardsRef = useRef([]);

  useEffect(() => {
    fetchAcceptedOffers();
  }, []);

  useEffect(() => {

    if (cardsRef.current && cardsRef.current.length > 0) {
      const validRefs = cardsRef.current.filter((ref) => ref);
      if (validRefs.length > 0) {
        gsap.fromTo(
          validRefs,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2,
          }
        );
      }
    }
  }, [acceptedOffers]);

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
          <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🩸</div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">No accepted offers yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Once a requester accepts your donation offer, it will appear here
              with routing information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {acceptedOffers.map((offer, index) => {
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
