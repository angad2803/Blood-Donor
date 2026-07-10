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
  user,
}) => {
  const swiperRef = useRef(null);
  const cardsRef = useRef([]);


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
      <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">🩸</div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">No accepted offers yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
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
              className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 blood-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center">
                    <span className="mr-2">🩸</span>
                    {offer.bloodRequest?.bloodGroup || "Unknown"} Blood Donation
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Accepted on{" "}
                    {offer.respondedAt
                      ? new Date(offer.respondedAt).toLocaleDateString()
                      : "Date not available"}
                  </p>
                </div>
                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                  Confirmed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {offer.donor?._id === user?._id ? "Requester Details" : "Donor Details"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Name:</strong>{" "}
                    {offer.donor?._id === user?._id 
                      ? (offer.bloodRequest?.requester?.name || "Name not available")
                      : (offer.donor?.name || "Name not available")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Location:</strong>{" "}
                    {offer.donor?._id === user?._id 
                      ? (offer.bloodRequest?.requester?.location || offer.bloodRequest?.location || "Location not available")
                      : (offer.donor?.location || "Location not available")}
                  </p>
                  {offer.donor?._id === user?._id ? (
                    offer.bloodRequest?.requester?.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Phone:</strong>
                        <a
                          href={`tel:${offer.bloodRequest.requester.phone}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          {offer.bloodRequest.requester.phone}
                        </a>
                      </p>
                    )
                  ) : (
                    offer.donor?.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Phone:</strong>
                        <a
                          href={`tel:${offer.donor.phone}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          {offer.donor.phone}
                        </a>
                      </p>
                    )
                  )}
                </div>

              </div>
              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {offer.donor?._id === user?._id ? "Your Offer Message" : "Donor's Message"}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                  "{offer.message || "No message provided"}"
                </p>
              </div>
              <div className="flex gap-3">

                <button
                  onClick={() => onOpenChat && onOpenChat(offer.bloodRequest)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center"
                >
                  <span className="mr-2">💬</span>
                  Chat
                </button>
                {offer.donor?._id === user?._id ? (
                  offer.bloodRequest?.requester?.phone && (
                    <button
                      onClick={() =>
                        window.open(`tel:${offer.bloodRequest.requester.phone}`)
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                    >
                      <span className="mr-2">📞</span>
                      Call
                    </button>
                  )
                ) : (
                  offer.donor?.phone && (
                    <button
                      onClick={() =>
                        window.open(`tel:${offer.donor.phone}`)
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                    >
                      <span className="mr-2">📞</span>
                      Call
                    </button>
                  )
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
