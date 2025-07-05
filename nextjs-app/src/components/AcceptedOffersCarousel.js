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

const AcceptedOffersCarousel = ({
  acceptedOffers = [],
  onOpenChat,
  onGetDirections,
}) => {
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);

  // Filter out offers that don't have valid bloodRequest data
  const validOffers = acceptedOffers.filter(
    (offer) => offer && offer.bloodRequest && offer.bloodRequest._id
  );

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
  }, [validOffers]);

  if (validOffers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🩸</div>
        <p
          className="text-gray-900 text-2xl font-black mb-4"
          style={{ color: "#111827", fontWeight: "900" }}
        >
          No accepted offers yet
        </p>
        <p
          className="text-lg text-gray-900 font-bold"
          style={{ color: "#374151", fontWeight: "700" }}
        >
          Once a requester accepts your donation offer, it will appear here with
          routing information
        </p>
      </div>
    );
  }

  return (
    <div className="accepted-offers-carousel">
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
            slidesPerView: 2,
            spaceBetween: 30,
          },
        }}
        navigation
        pagination={{ clickable: true }}
        effect="slide"
        speed={600}
        loop={false}
        className="accepted-offers-swiper"
      >
        {validOffers.map((offer, idx) => (
          <SwiperSlide key={offer._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="border-3 border-green-600 rounded-xl p-6 bg-green-100 blood-card shadow-xl hover:shadow-2xl transition-all duration-200"
              style={{
                backgroundColor: "#dcfce7",
                border: "3px solid #16a34a",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className="font-black text-green-900 text-2xl flex items-center"
                    style={{ color: "#14532d", fontWeight: "900" }}
                  >
                    <span className="mr-2 text-2xl">🩸</span>
                    {offer.bloodRequest?.bloodGroup || "Unknown"} Blood Donation
                  </h3>
                  <p
                    className="text-lg text-green-900 font-black mt-2"
                    style={{ color: "#14532d", fontWeight: "900" }}
                  >
                    ✅ Accepted on{" "}
                    {offer.respondedAt
                      ? new Date(offer.respondedAt).toLocaleDateString()
                      : "Date not available"}
                  </p>
                </div>
                <span
                  className="bg-green-200 text-green-900 px-4 py-2 rounded-full text-base font-black border-3 border-green-600 status-badge"
                  style={{
                    backgroundColor: "#bbf7d0",
                    color: "#14532d",
                    border: "3px solid #16a34a",
                    fontWeight: "900",
                  }}
                >
                  ✅ Confirmed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div
                  className="bg-white rounded-lg p-4 border-3 border-gray-500"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #374151",
                  }}
                >
                  <h4
                    className="font-black text-gray-900 mb-3 text-xl"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    👤 Requester Details
                  </h4>
                  <p
                    className="text-lg text-gray-900 font-black mb-2"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    <strong className="text-gray-900">Name:</strong>{" "}
                    {offer.bloodRequest?.requester?.name ||
                      "Name not available"}
                  </p>
                  <p
                    className="text-lg text-gray-900 font-black mb-2"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    <strong className="text-gray-900">📍 Location:</strong>{" "}
                    {offer.bloodRequest?.requester?.location ||
                      offer.bloodRequest?.location ||
                      "Location not available"}
                  </p>
                  {offer.bloodRequest?.requester?.phone && (
                    <p
                      className="text-lg text-gray-900 font-black"
                      style={{ color: "#111827", fontWeight: "900" }}
                    >
                      <strong className="text-gray-900">📞 Phone:</strong>
                      <a
                        href={`tel:${offer.bloodRequest.requester.phone}`}
                        className="text-blue-900 hover:underline ml-1 font-black"
                        style={{ color: "#1e3a8a", fontWeight: "900" }}
                      >
                        {offer.bloodRequest.requester.phone}
                      </a>
                    </p>
                  )}
                </div>
                <div
                  className="bg-white rounded-lg p-4 border-3 border-gray-500"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #374151",
                  }}
                >
                  <h4
                    className="font-black text-gray-900 mb-3 text-xl"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    🗺️ Travel Information
                  </h4>
                  <p
                    className="text-lg text-gray-900 font-black"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    Ready for coordination
                  </p>
                </div>
              </div>
              <div
                className="bg-white rounded-lg p-4 mb-4 border-3 border-gray-500 offer-message"
                style={{
                  backgroundColor: "#ffffff",
                  border: "3px solid #374151",
                }}
              >
                <h4
                  className="font-black text-gray-900 mb-3 text-xl"
                  style={{ color: "#111827", fontWeight: "900" }}
                >
                  💬 Your Offer Message
                </h4>
                <p
                  className="text-lg text-gray-900 font-black italic"
                  style={{ color: "#111827", fontWeight: "900" }}
                >
                  "{offer.message || "No message provided"}"
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    onGetDirections && onGetDirections(offer.bloodRequest)
                  }
                  className="flex-1 bg-blue-900 text-white px-4 py-4 rounded-lg hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-blue-700"
                  style={{
                    backgroundColor: "#1e3a8a",
                    borderColor: "#1d4ed8",
                    fontWeight: "900",
                  }}
                >
                  <span className="mr-2 text-xl">🗺️</span>
                  Get Directions
                </button>
                <button
                  onClick={() => onOpenChat && onOpenChat(offer.bloodRequest)}
                  className="flex-1 bg-purple-900 text-white px-4 py-4 rounded-lg hover:bg-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-purple-700"
                  style={{
                    backgroundColor: "#581c87",
                    borderColor: "#7c3aed",
                    fontWeight: "900",
                  }}
                >
                  <span className="mr-2 text-xl">💬</span>
                  Chat
                </button>
                {offer.bloodRequest?.requester?.phone && (
                  <button
                    onClick={() =>
                      window.open(`tel:${offer.bloodRequest.requester.phone}`)
                    }
                    className="bg-green-900 text-white px-4 py-4 rounded-lg hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center font-black text-lg transition-all duration-200 shadow-lg border-2 border-green-700"
                    style={{
                      backgroundColor: "#14532d",
                      borderColor: "#16a34a",
                      fontWeight: "900",
                    }}
                  >
                    <span className="mr-2 text-xl">📞</span>
                    Call
                  </button>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default AcceptedOffersCarousel;
