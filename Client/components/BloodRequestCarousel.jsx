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
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Update slide states when requests change
  useEffect(() => {
    setCurrentSlide(0);
    setIsFirstSlide(true);
    setIsLastSlide(requests.length <= 1);
  }, [requests]);

  const handleSlideChange = (swiper) => {
    const activeIndex = swiper.activeIndex;
    setCurrentSlide(activeIndex);
    setIsFirstSlide(activeIndex === 0);
    setIsLastSlide(activeIndex === requests.length - 1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-500",
          pulse: true,
        };
      case "high":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          border: "border-orange-500",
          pulse: false,
        };
      case "medium":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-500",
          pulse: false,
        };
      default:
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-500",
          pulse: false,
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="blood-request-carousel">
        <div className="carousel-loading">
          <div className="spinner"></div>
          <p className="ml-4 text-gray-600">Loading blood requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🩸</div>
        <p className="text-gray-500 text-lg">
          No blood requests available at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="blood-request-carousel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-3">🩸</span>
            Available Blood Requests
          </h2>
          <p className="text-gray-600 mt-1">
            Swipe to explore • Send offers to help those in need
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {requests.length} Active Request{requests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Swiper Carousel */}
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        pagination={{
          clickable: true,
          bulletActiveClass: "swiper-pagination-bullet-active-custom",
          bulletClass: "swiper-pagination-bullet-custom",
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect="slide"
        speed={600}
        loop={false} // Disable loop to prevent cycling back to first
        onSlideChange={handleSlideChange}
        allowSlidePrev={!isFirstSlide} // Disable previous navigation on first slide
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 1,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 1,
            spaceBetween: 28,
          },
          1280: {
            slidesPerView: 1,
            spaceBetween: 32,
          },
        }}
        className="blood-requests-swiper"
      >
        {requests.map((request, index) => {
          const urgencyStyle = getUrgencyColor(request.urgency);
          const distanceInfo = getDistanceInfo
            ? getDistanceInfo(request)
            : null;

          return (
            <SwiperSlide key={request._id}>
              <div
                ref={(el) => (cardsRef.current[index] = el)}
                className={`bg-white rounded-xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 p-6 h-full ${
                  urgencyStyle.pulse
                    ? "animate-pulse border-red-300"
                    : "border-gray-200"
                } hover:border-blue-300 transform hover:-translate-y-1`}
              >
                {/* Header with Blood Type and Urgency */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <span className="text-red-600 text-xl">🩸</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-600 flex items-center">
                        {request.bloodGroup} Blood Needed
                        {request.urgency === "Emergency" && (
                          <span className="ml-2 animate-pulse text-red-500">
                            🚨
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested by:{" "}
                        <span className="font-medium">
                          {request.requester?.name}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      urgencyStyle.bg
                    } ${urgencyStyle.text} ${
                      urgencyStyle.pulse ? "animate-pulse" : ""
                    }`}
                  >
                    {request.urgency}
                    {request.urgency === "Emergency" && " ⚡"}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    <span className="font-medium">Location:</span>
                    <span className="ml-1 text-gray-800">
                      {request.location}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📅</span>
                      <span className="font-medium">Posted:</span>
                      <span className="ml-1 text-gray-800">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">💌</span>
                      <span className="font-medium">Offers:</span>
                      <span className="ml-1 text-gray-800 font-semibold">
                        {request.offers?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Distance Info */}
                  {distanceInfo && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-blue-700">
                          <span className="mr-2">{distanceInfo.icon}</span>
                          <span className="font-medium">
                            Distance: {distanceInfo.distanceText}
                          </span>
                        </div>
                        <div className="text-blue-600 font-medium">
                          ~{distanceInfo.estimatedTime} min
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {distanceInfo.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => onSendOffer && onSendOffer(request)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  >
                    <span className="mr-1">💌</span>
                    Send Offer
                  </button>
                  <button
                    onClick={() => onOpenChat && onOpenChat(request)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  >
                    <span className="mr-1">💬</span>
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      if (onGetDirections) {
                        onGetDirections(request);
                      } else {
                        // Fallback to external maps
                        if (request.requester?.coordinates?.coordinates) {
                          const [reqLng, reqLat] =
                            request.requester.coordinates.coordinates;
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${reqLat},${reqLng}&travelmode=driving`;
                          window.open(googleMapsUrl, "_blank");
                        } else {
                          const encodedLocation = encodeURIComponent(
                            request.location
                          );
                          const googleMapsUrl = `https://www.google.com/maps/search/${encodedLocation}`;
                          window.open(googleMapsUrl, "_blank");
                        }
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                    title="Get directions to this location"
                  >
                    <span className="mr-1">🗺️</span>
                    <span className="hidden sm:inline">Directions</span>
                    <span className="sm:hidden">Dir</span>
                  </button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="flex items-center justify-center mt-6 space-x-4">
        <button
          className={`swiper-button-prev-custom p-3 rounded-full border border-gray-200 transition-all duration-200 transform ${
            isFirstSlide
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : "bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer"
          }`}
          disabled={isFirstSlide}
        >
          <svg
            className={`w-5 h-5 ${
              isFirstSlide ? "text-gray-400" : "text-gray-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="swiper-pagination-custom flex space-x-2"></div>

        <button
          className={`swiper-button-next-custom p-3 rounded-full border border-gray-200 transition-all duration-200 transform ${
            isLastSlide
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : "bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer"
          }`}
          disabled={isLastSlide}
        >
          <svg
            className={`w-5 h-5 ${
              isLastSlide ? "text-gray-400" : "text-gray-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Carousel Info */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          <span className="hidden sm:inline">
            Use arrow keys or click navigation •{" "}
          </span>
          <span className="sm:hidden">Swipe left or right • </span>
          {!isFirstSlide && "Auto-advancing every 5 seconds"}
          {isFirstSlide && "Navigate right to see more requests"}
        </p>
      </div>
    </div>
  );
};

export default BloodRequestCarousel;
