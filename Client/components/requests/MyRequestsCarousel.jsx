import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";
import { gsap } from "gsap";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

const MyRequestsCarousel = ({
  myRequests = [],
  onOpenChat,
  onAcceptOffer,
  onRejectOffer,
  user,
}) => {
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {

    if (cardsRef.current.length > 0) {
      const validRefs = cardsRef.current.filter((ref) => ref !== null);
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
  }, [myRequests]);


  const filteredRequests = myRequests;

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No blood requests to display</p>
        <button
          onClick={() => navigate("/create-request")}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium mt-4"
        >
          <span className="mr-2">➕</span> Create New Request
        </button>
      </div>
    );
  }

  return (
    <div className="my-requests-carousel">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/create-request")}
          className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium shadow"
        >
          <span className="mr-2">➕</span> Create New Request
        </button>
      </div>
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        effect="slide"
        speed={600}
        loop={false}
        className="my-requests-swiper"
      >
        {filteredRequests.map((req, idx) => (
          <SwiperSlide key={req._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6 h-full blood-card"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-2">🩸</span>
                    {req.bloodGroup} Blood Request
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created on: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.fulfilled
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {req.fulfilled ? "Fulfilled" : "Active"}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Location:</strong> {req.location}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Urgency:</strong> {req.urgency}
                </p>
              </div>
              <div className="mb-4">
                <button
                  onClick={() => onOpenChat(req)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
                >
                  <span className="mr-2">💬</span>
                  Open Chat Room
                  {req.offers && req.offers.length > 0 && (
                    <span className="ml-2 bg-blue-500 text-xs px-2 py-1 rounded-full">
                      {req.offers.length} potential helpers
                    </span>
                  )}
                </button>
              </div>
              {req.offers && req.offers.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Offers Received ({req.offers.length})
                  </h4>
                  <div className="space-y-3">
                    {req.offers.map((offer) => (
                      <div
                        key={offer._id}
                        className="bg-gray-50 dark:bg-gray-700/60 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {offer.donor?.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Blood Group: {offer.donor?.bloodGroup}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Location: {offer.donor?.location}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === "accepted"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : offer.status === "rejected"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            }`}
                          >
                            {offer.status.charAt(0).toUpperCase() +
                              offer.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-3">
                          "{offer.message}"
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Sent on:{" "}
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                        {offer.status === "pending" && !req.fulfilled && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onAcceptOffer(offer._id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                            >
                              <span className="mr-1">✅</span>
                              Accept Offer
                            </button>
                            <button
                              onClick={() => onRejectOffer(offer._id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                            >
                              <span className="mr-1">❌</span>
                              Reject
                            </button>
                            <button
                              onClick={() => onOpenChat(req)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                            >
                              <span className="mr-1">💬</span>
                              Chat
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MyRequestsCarousel;
