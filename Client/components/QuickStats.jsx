import React from "react";

const QuickStats = ({ requests, myRequests, myOffers }) => {
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} rounded-lg p-4 text-center`}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
