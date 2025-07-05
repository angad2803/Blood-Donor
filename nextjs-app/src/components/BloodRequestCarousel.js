import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";
import { gsap } from "gsap";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

const BloodRequestCarousel = ({
  requests = [],
  onSendOffer,
  onOpenChat,
  onGetDirections,
  getDistanceInfo,
  loading = false,
}) => {
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);
  const [_currentSlide, setCurrentSlide] = useState(0);
  const [isFirstSlide, setIsFirstSlide] = useState(true);
  const [isLastSlide, setIsLastSlide] = useState(requests.length <= 1);

  useEffect(() => {
    // Animate cards entrance
    if (cardsRef.current.length > 0) {
      // Filter out null refs before animating
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
  }, [requests]);

  useEffect(() => {
    setIsLastSlide(requests.length <= 1);
  }, [requests.length]);

  const handleSlideChange = (swiper) => {
    setCurrentSlide(swiper.activeIndex);
    setIsFirstSlide(swiper.isBeginning);
    setIsLastSlide(swiper.isEnd);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "bg-red-200 text-red-900 border-red-600";
      case "urgent":
        return "bg-orange-200 text-orange-900 border-orange-600";
      case "normal":
        return "bg-blue-200 text-blue-900 border-blue-600";
      default:
        return "bg-gray-200 text-gray-900 border-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
        <span
          className="ml-4 text-xl font-black text-gray-900"
          style={{ color: "#111827", fontWeight: "900" }}
        >
          Loading blood requests...
        </span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🩸</div>
        <p
          className="text-gray-900 text-2xl font-black mb-4"
          style={{ color: "#111827", fontWeight: "900" }}
        >
          No blood requests available at the moment
        </p>
        <p
          className="text-lg text-gray-900 font-bold"
          style={{ color: "#374151", fontWeight: "700" }}
        >
          Check back later or create your own request to help others.
        </p>
      </div>
    );
  }

  return (
    <div className="blood-requests-carousel">
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
        onSlideChange={handleSlideChange}
        className="blood-requests-swiper"
      >
        {requests.map((request, idx) => (
          <SwiperSlide key={request._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="bg-white rounded-xl shadow-xl border-3 border-gray-500 p-6 h-full blood-card hover:shadow-2xl transition-all duration-200"
              style={{
                backgroundColor: "#ffffff",
                border: "3px solid #374151",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className="font-black text-red-900 text-2xl flex items-center"
                    style={{ color: "#7f1d1d", fontWeight: "900" }}
                  >
                    <span className="mr-2 text-2xl">🩸</span>
                    {request.bloodGroup} Blood Needed
                  </h3>
                  <p
                    className="text-lg text-gray-900 font-black mt-2"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    📍 {request.location}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-base font-black border-3 urgency-badge ${getUrgencyColor(
                    request.urgency
                  )}`}
                  style={{ fontWeight: "900" }}
                >
                  {request.urgency?.toUpperCase() || "NORMAL"}
                </span>
              </div>

              <div
                className="mb-4 bg-gray-100 rounded-lg p-4 border-3 border-gray-500 info-section"
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "3px solid #374151",
                }}
              >
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p
                      className="text-lg text-gray-900 font-black"
                      style={{ color: "#111827", fontWeight: "900" }}
                    >
                      <strong className="text-gray-900">👤 Requester:</strong>{" "}
                      {request.requester?.name || "Anonymous"}
                    </p>
                  </div>
                  {request.medicalInfo && (
                    <div>
                      <p
                        className="text-lg text-gray-900 font-black"
                        style={{ color: "#111827", fontWeight: "900" }}
                      >
                        <strong className="text-gray-900">
                          🏥 Medical Info:
                        </strong>{" "}
                        {request.medicalInfo}
                      </p>
                    </div>
                  )}
                  <div>
                    <p
                      className="text-lg text-gray-900 font-black"
                      style={{ color: "#111827", fontWeight: "900" }}
                    >
                      <strong className="text-gray-900">📅 Posted:</strong>{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getDistanceInfo && (
                    <div>
                      <p
                        className="text-lg text-gray-900 font-black"
                        style={{ color: "#111827", fontWeight: "900" }}
                      >
                        <strong className="text-gray-900">📏 Distance:</strong>{" "}
                        {getDistanceInfo(request) || "Calculating..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onSendOffer && onSendOffer(request)}
                  className="flex-1 bg-red-900 text-white px-4 py-4 rounded-lg hover:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-red-700"
                  style={{
                    backgroundColor: "#7f1d1d",
                    borderColor: "#dc2626",
                    fontWeight: "900",
                  }}
                >
                  <span className="mr-2 text-xl">❤️</span>
                  Send Offer
                </button>
                <button
                  onClick={() => onOpenChat && onOpenChat(request)}
                  className="flex-1 bg-blue-900 text-white px-4 py-4 rounded-lg hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-blue-700"
                  style={{
                    backgroundColor: "#1e3a8a",
                    borderColor: "#1d4ed8",
                    fontWeight: "900",
                  }}
                >
                  <span className="mr-2 text-xl">💬</span>
                  Chat
                </button>
              </div>

              {onGetDirections && (
                <button
                  onClick={() => onGetDirections(request)}
                  className="w-full bg-green-900 text-white px-4 py-4 rounded-lg hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-green-700 mb-4"
                  style={{
                    backgroundColor: "#14532d",
                    borderColor: "#16a34a",
                    fontWeight: "900",
                  }}
                >
                  <span className="mr-2 text-xl">🗺️</span>
                  Get Directions
                </button>
              )}

              {request.offers && request.offers.length > 0 && (
                <div
                  className="mt-4 pt-4 border-t-3 border-gray-500"
                  style={{ borderColor: "#374151", borderWidth: "3px" }}
                >
                  <p
                    className="text-lg text-gray-900 font-black text-center"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    👥 {request.offers.length} donor(s) responded
                  </p>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BloodRequestCarousel;
