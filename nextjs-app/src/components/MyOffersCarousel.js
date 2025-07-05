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

const MyOffersCarousel = ({ myOffers = [], onOpenChat }) => {
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
  }, [myOffers]);

  if (myOffers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💌</div>
        <p
          className="text-gray-900 text-2xl font-black"
          style={{ color: "#111827", fontWeight: "900" }}
        >
          You haven't sent any donation offers yet
        </p>
      </div>
    );
  }

  return (
    <div className="my-offers-carousel">
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
        className="my-offers-swiper"
      >
        {myOffers.map((offer, idx) => (
          <SwiperSlide key={offer._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="bg-white rounded-xl shadow-xl border-3 border-gray-400 p-6 h-full blood-card hover:shadow-2xl transition-all duration-200"
              style={{
                backgroundColor: "#ffffff",
                border: "3px solid #374151",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className="font-black text-red-900 text-2xl"
                    style={{ color: "#7f1d1d", fontWeight: "900" }}
                  >
                    🩸 {offer.bloodRequest?.bloodGroup} Blood Donation Offer
                  </h3>
                  <p
                    className="text-lg text-gray-900 font-black mt-2"
                    style={{ color: "#111827", fontWeight: "900" }}
                  >
                    📍 To: {offer.bloodRequest?.location}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-base font-black border-3 status-badge ${
                    offer.status === "accepted"
                      ? "bg-green-200 text-green-900 border-green-600"
                      : offer.status === "rejected"
                        ? "bg-red-200 text-red-900 border-red-600"
                        : "bg-yellow-200 text-yellow-900 border-yellow-600"
                  }`}
                  style={{
                    backgroundColor:
                      offer.status === "accepted"
                        ? "#bbf7d0"
                        : offer.status === "rejected"
                          ? "#fecaca"
                          : "#fef3c7",
                    color:
                      offer.status === "accepted"
                        ? "#14532d"
                        : offer.status === "rejected"
                          ? "#7f1d1d"
                          : "#92400e",
                    fontWeight: "900",
                    border:
                      "2px solid " +
                      (offer.status === "accepted"
                        ? "#16a34a"
                        : offer.status === "rejected"
                          ? "#dc2626"
                          : "#d97706"),
                  }}
                >
                  {offer.status === "accepted"
                    ? "✅ Accepted"
                    : offer.status === "rejected"
                      ? "❌ Rejected"
                      : "⏳ Pending"}
                </span>
              </div>
              <div
                className="bg-gray-100 rounded-lg p-4 mb-4 border-3 border-gray-500 offer-message"
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "3px solid #374151",
                }}
              >
                <p
                  className="text-lg text-gray-900 font-black italic"
                  style={{ color: "#111827", fontWeight: "900" }}
                >
                  💬 "{offer.message}"
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div
                  className="text-base text-gray-900 font-black"
                  style={{ color: "#111827", fontWeight: "900" }}
                >
                  <p>
                    📅 Sent: {new Date(offer.createdAt).toLocaleDateString()}
                  </p>
                  {offer.respondedAt && (
                    <p>
                      📋 Responded:{" "}
                      {new Date(offer.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onOpenChat(offer.bloodRequest)}
                    className="bg-blue-900 text-white px-6 py-4 rounded-lg hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 font-black shadow-lg border-2 border-blue-700"
                    title="Chat with requester"
                    style={{
                      backgroundColor: "#1e3a8a",
                      borderColor: "#1d4ed8",
                      fontWeight: "900",
                    }}
                  >
                    <span className="text-xl">💬</span>
                    <span className="text-lg">Chat</span>
                  </button>
                  {offer.status === "accepted" && (
                    <div
                      className="text-lg text-green-900 font-black bg-green-200 px-4 py-3 rounded-lg border-3 border-green-600"
                      style={{
                        backgroundColor: "#bbf7d0",
                        color: "#14532d",
                        border: "3px solid #16a34a",
                        fontWeight: "900",
                      }}
                    >
                      🎉 Accepted - Please coordinate with the requester
                    </div>
                  )}
                  {offer.status === "pending" && (
                    <div
                      className="text-lg text-yellow-900 font-black bg-yellow-200 px-4 py-3 rounded-lg border-3 border-yellow-600"
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        border: "3px solid #d97706",
                        fontWeight: "900",
                      }}
                    >
                      ⏳ Awaiting response
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MyOffersCarousel;
