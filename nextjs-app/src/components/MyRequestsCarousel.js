import React, { useRef, useEffect } from "react";
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
  navigate,
  user,
}) => {
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    // Animate cards entrance
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

  // No need for additional filtering since the API already returns only the current user's requests
  const displayRequests = myRequests || [];

  if (displayRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-700 text-xl font-semibold mb-4">
          No blood requests to display
        </p>
        <button
          onClick={() => navigate("/create-request")}
          className="bg-red-700 text-white px-8 py-4 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-bold text-lg shadow-lg transition-all duration-200"
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
          className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-bold text-lg shadow-lg transition-all duration-200"
        >
          <span className="mr-2">➕</span> Create New Request
        </button>
      </div>
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
        navigation
        pagination={{ clickable: true }}
        effect="slide"
        speed={600}
        loop={false}
        className="my-requests-swiper"
      >
        {displayRequests.map((req, idx) => (
          <SwiperSlide key={req._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="bg-white rounded-xl shadow-xl border-2 border-gray-300 p-6 h-full blood-card hover:shadow-2xl transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-red-800 text-xl flex items-center">
                    <span className="mr-2 text-2xl">🩸</span>
                    {req.bloodGroup} Blood Request
                  </h3>
                  <p className="text-base text-gray-800 font-semibold mt-1">
                    Created on: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-2 rounded-full text-sm font-bold border-2 status-badge ${
                    req.fulfilled
                      ? "bg-green-100 text-green-900 border-green-400"
                      : "bg-yellow-100 text-yellow-900 border-yellow-400"
                  }`}
                >
                  {req.fulfilled ? "✅ Fulfilled" : "🔄 Active"}
                </span>
              </div>
              <div className="mb-4 bg-gray-100 rounded-lg p-4 border border-gray-300 info-section">
                <p className="text-base text-gray-900 mb-3 font-semibold">
                  <strong className="text-gray-900">📍 Location:</strong>{" "}
                  {req.location}
                </p>
                <p className="text-base text-gray-900 font-semibold">
                  <strong className="text-gray-900">⚡ Urgency:</strong>
                  <span
                    className={`ml-2 px-3 py-1 rounded font-bold text-sm urgency-badge ${
                      req.urgency === "critical"
                        ? "bg-red-200 text-red-900 border border-red-400"
                        : req.urgency === "urgent"
                          ? "bg-orange-200 text-orange-900 border border-orange-400"
                          : "bg-blue-200 text-blue-900 border border-blue-400"
                    }`}
                  >
                    {req.urgency.toUpperCase()}
                  </span>
                </p>
              </div>
              <div className="mb-4">
                <button
                  onClick={() => onOpenChat(req)}
                  className="w-full bg-blue-800 text-white px-4 py-3 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center text-lg font-bold transition-all duration-200 shadow-md"
                >
                  <span className="mr-2 text-xl">💬</span>
                  Open Chat Room
                  {req.offers && req.offers.length > 0 && (
                    <span className="ml-2 bg-blue-600 text-sm px-3 py-1 rounded-full font-bold border border-blue-500">
                      {req.offers.length} helpers
                    </span>
                  )}
                </button>
              </div>
              {req.offers && req.offers.length > 0 && (
                <div className="border-t-2 border-gray-300 pt-4">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">
                    🤝 Offers Received ({req.offers.length})
                  </h4>
                  <div className="space-y-3">
                    {req.offers.map((offer) => (
                      <div
                        key={offer._id}
                        className="bg-gray-200 rounded-lg p-4 border-2 border-gray-400 offer-card"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              👤 {offer.donor?.name}
                            </p>
                            <p className="text-base text-gray-900 font-bold mt-1">
                              🩸 Blood Group:{" "}
                              <span className="text-red-800 font-bold">
                                {offer.donor?.bloodGroup}
                              </span>
                            </p>
                            <p className="text-base text-gray-900 font-bold">
                              📍 Location: {offer.donor?.location}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-2 rounded-full text-sm font-bold border-2 status-badge ${
                              offer.status === "accepted"
                                ? "bg-green-100 text-green-900 border-green-500"
                                : offer.status === "rejected"
                                  ? "bg-red-100 text-red-900 border-red-500"
                                  : "bg-yellow-100 text-yellow-900 border-yellow-500"
                            }`}
                          >
                            {offer.status === "accepted"
                              ? "✅ Accepted"
                              : offer.status === "rejected"
                                ? "❌ Rejected"
                                : "⏳ Pending"}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-300 offer-message">
                          <p className="text-base text-gray-900 font-semibold italic">
                            💬 "{offer.message}"
                          </p>
                        </div>
                        <p className="text-sm text-gray-800 font-bold mb-3">
                          📅 Sent on:{" "}
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                        {offer.status === "pending" && !req.fulfilled && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => onAcceptOffer(offer._id)}
                              className="flex-1 bg-green-700 text-white px-4 py-3 rounded-lg text-base font-bold hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center transition-all duration-200 shadow-md"
                            >
                              <span className="mr-2">✅</span>
                              Accept Offer
                            </button>
                            <button
                              onClick={() => onOpenChat(req)}
                              className="flex-1 bg-blue-700 text-white px-4 py-3 rounded-lg text-base font-bold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center transition-all duration-200 shadow-md"
                            >
                              <span className="mr-2">💬</span>
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
