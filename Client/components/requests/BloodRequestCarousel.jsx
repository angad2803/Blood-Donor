import React, { useEffect, useRef, useState } from "react";
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

const BloodRequestCarousel = ({
  requests = [],
  onSendOffer,
  onOpenChat,
  loading = false,
}) => {
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);
  const [_currentSlide, setCurrentSlide] = useState(0);
  const [isFirstSlide, setIsFirstSlide] = useState(true);
  const [isLastSlide, setIsLastSlide] = useState(requests.length <= 1);

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
  }, [requests]);


  useEffect(() => {
    setIsFirstSlide(true);
    setIsLastSlide(requests.length <= 1);
  }, [requests, setCurrentSlide]);

  const handleSlideChange = (swiper) => {
    const activeIndex = swiper.activeIndex;
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
      <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 backdrop-blur-xl border-2 border-green-200 rounded-3xl shadow-lg p-12 text-center">
        {}
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 rounded-3xl"></div>

        <div className="relative z-10">
          {}
          <div className="text-8xl mb-6 animate-bounce">✅</div>

          {}
          <h3 className="text-2xl font-bold text-green-900 mb-4">
            🎉 Amazing! All Requests Fulfilled! 🎉
          </h3>

          <div className="bg-white/60 backdrop-blur-md border border-green-300 rounded-xl p-6 mb-6">
            <p className="text-lg text-green-800 font-semibold mb-2">
              Thanks to heroes like you, there are no urgent blood requests at
              the moment!
            </p>
            <p className="text-green-700">
              Keep checking back - new requests may appear at any time and lives
              depend on quick responses.
            </p>
          </div>

          {}
          <div className="space-y-4">
            <div className="bg-white/50 backdrop-blur-md border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2 flex items-center justify-center">
                <span className="mr-2">💡</span>
                Stay Ready to Help
              </h4>
              <p className="text-green-800 text-sm">
                • Update your profile to match with compatible requests <br/>
                • Enable notifications for urgent blood requests <br/>
                • Share this platform with other potential donors
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blood-request-carousel">
      {}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-3">🩸</span>
            Available Blood Requests
          </h2>
          <p className="text-gray-600 mt-1">
            Swipe to explore • Send offers to help those in need
          </p>
        </div>
        <div className="text-sm text-gray-700 bg-gray-200 px-3 py-2 rounded-lg font-medium">
          {requests.length} Active Request{requests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {}
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
        loop={false}
        onSlideChange={handleSlideChange}
        allowSlidePrev={!isFirstSlide}
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

          return (
            <SwiperSlide key={request._id}>
              <div
                ref={(el) => (cardsRef.current[index] = el)}
                className={`relative bg-white border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full ${
                  urgencyStyle.pulse
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                } hover:border-blue-500 transform hover:-translate-y-1`}
              >
                {}
                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-red-100 border-2 border-red-300 p-3 rounded-full mr-4">
                      <span className="text-red-600 text-xl">🩸</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 flex items-center">
                        {request.bloodGroup} Blood Needed
                        {request.urgency === "Emergency" && (
                          <span className="ml-2 text-red-500 text-lg">🚨</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Requested by:{" "}
                        <span className="font-semibold text-gray-800">
                          {request.requester?.name}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                      request.urgency?.toLowerCase() === "emergency"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : request.urgency?.toLowerCase() === "high"
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : request.urgency?.toLowerCase() === "medium"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {request.urgency}
                    {request.urgency === "Emergency" && " ⚡"}
                  </span>
                </div>

                {}
                <div className="relative space-y-4 mb-8">
                  <div className="flex items-center text-sm text-gray-800 bg-gray-50 rounded-lg p-3 border border-gray-300">
                    <span className="mr-3 text-lg">📍</span>
                    <span className="font-bold">Location:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {request.location}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-800 bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <span className="mr-2 text-lg">📅</span>
                      <div>
                        <span className="font-bold block text-gray-900">
                          Posted:
                        </span>
                        <span className="text-gray-800 font-medium">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-800 bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <span className="mr-2 text-lg">💌</span>
                      <div>
                        <span className="font-bold block text-gray-900">
                          Offers:
                        </span>
                        <span className="text-gray-900 font-bold text-lg">
                          {request.offers?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>


                </div>

                {}
                <div className="relative flex gap-3 mt-auto">
                  <button
                    onClick={() => onSendOffer && onSendOffer(request)}
                    className="flex-1 bg-red-500 hover:bg-red-600 border-2 border-red-600 text-white px-4 py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  >
                    <span className="mr-2 text-lg">💌</span>
                    Send Life-Saving Offer
                  </button>
                  <button
                    onClick={() => onOpenChat && onOpenChat(request)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 border-2 border-blue-600 text-white px-4 py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  >
                    <span className="mr-2 text-lg">💬</span>
                    Chat Now
                  </button>

                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {}
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

      {}
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
