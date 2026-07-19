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
  console.log("Trace: MyOffersCarousel received myOffers:", myOffers?.length, myOffers);
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);


  const validOffers = myOffers && Array.isArray(myOffers) 
    ? myOffers.filter((offer) => offer && offer.bloodRequest && offer.bloodRequest._id)
    : [];

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
    console.log("Trace: MyOffersCarousel rendering empty state because validOffers is empty");
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="text-5xl mb-4 opacity-50">💌</div>
        <p className="text-gray-900 dark:text-white text-lg font-medium">
          You haven't sent any donation offers yet
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          When you offer to donate blood, your offers will appear here
        </p>
      </div>
    );
  }

  console.log("Trace: MyOffersCarousel rendering", validOffers.length, "offers");

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
        {validOffers.map((offer, idx) => (
          <SwiperSlide key={offer._id}>
            <div
              ref={(el) => (cardsRef.current[idx] = el)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6 h-full blood-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    {offer.bloodRequest?.bloodGroup} Blood Donation Offer
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-100">
                    To: {offer.bloodRequest?.location}
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
                  {(offer.status || "pending").charAt(0).toUpperCase() + (offer.status || "pending").slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-100 italic mb-3">
                "{offer.message}"
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-200">
                  <p>Sent: {new Date(offer.createdAt).toLocaleDateString()}</p>
                  {offer.respondedAt && (
                    <p>
                      Responded:{" "}
                      {new Date(offer.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">

                  {offer.status === "accepted" && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      🎉 Accepted - Please coordinate with the requester
                    </div>
                  )}
                  {offer.status === "pending" && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
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
