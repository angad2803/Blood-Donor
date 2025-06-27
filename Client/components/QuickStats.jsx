import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const QuickStats = ({ requests, myRequests, myOffers }) => {
  const statsRef = useRef([]);
  const numberRefs = useRef([]);

  const activeRequests = requests?.length || 0;
  const myActiveRequests =
    myRequests?.filter((req) => !req.fulfilled)?.length || 0;
  const pendingOffers =
    myOffers?.filter((offer) => offer.status === "pending")?.length || 0;
  const acceptedOffers =
    myOffers?.filter((offer) => offer.status === "accepted")?.length || 0;

  const stats = [
    {
      label: "Active Requests",
      value: activeRequests,
      icon: "🩸",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "My Requests",
      value: myActiveRequests,
      icon: "📋",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending Offers",
      value: pendingOffers,
      icon: "⏳",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Accepted Offers",
      value: acceptedOffers,
      icon: "✅",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  useEffect(() => {
    // Animate stats cards entrance
    gsap.fromTo(
      statsRef.current,
      { opacity: 0, y: 20, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      }
    );

    // Animate numbers counting up
    numberRefs.current.forEach((ref, index) => {
      if (ref && stats[index]) {
        gsap.fromTo(
          ref,
          { innerHTML: 0 },
          {
            innerHTML: stats[index].value,
            duration: 1.5,
            ease: "power2.out",
            snap: { innerHTML: 1 },
            delay: 0.3 + index * 0.1,
          }
        );
      }
    });
  }, [requests, myRequests, myOffers]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          ref={(el) => (statsRef.current[index] = el)}
          className={`${stat.bgColor} rounded-lg p-4 text-center transform hover:scale-105 transition-transform duration-200 cursor-pointer`}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div
            ref={(el) => (numberRefs.current[index] = el)}
            className={`text-2xl font-bold ${stat.color}`}
          >
            0
          </div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
