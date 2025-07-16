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
      <div className="text-center py-8">
        <div className="text-6xl mb-4">💌</div>
        <p className="text-gray-500">
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
              className="bg-white rounded-xl shadow-lg border-2 p-6 h-full blood-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-red-600">
                    {offer.bloodRequest?.bloodGroup} Blood Donation Offer
                  </h3>
                  <p className="text-sm text-gray-600">
                    To: {offer.bloodRequest?.location}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : offer.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-700 italic mb-3">
                "{offer.message}"
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <p>Sent: {new Date(offer.createdAt).toLocaleDateString()}</p>
                  {offer.respondedAt && (
                    <p>
                      Responded:{" "}
                      {new Date(offer.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenChat(offer.bloodRequest)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-1"
                    title="Chat with requester"
                  >
                    <span>💬</span>
                    <span className="text-sm">Chat</span>
                  </button>
                  {offer.status === "accepted" && (
                    <div className="text-xs text-green-600 font-medium">
                      🎉 Accepted - Please coordinate with the requester
                    </div>
                  )}
                  {offer.status === "pending" && (
                    <div className="text-xs text-yellow-600 font-medium">
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
