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
      color: "text-red-600 dark:text-red-400",
      bgGradient: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "My Requests",
      value: myActiveRequests,
      icon: "📋",
      color: "text-blue-600 dark:text-blue-400",
      bgGradient: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Pending Offers",
      value: pendingOffers,
      icon: "⏳",
      color: "text-orange-500 dark:text-orange-400",
      bgGradient: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Accepted Offers",
      value: acceptedOffers,
      icon: "✅",
      color: "text-green-600 dark:text-green-400",
      bgGradient: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-md transition-shadow relative overflow-hidden group`}
        >
          {}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.bgGradient} -z-10`} />

          <div className="relative z-10">
            <div className={`text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-200`}>
              {stat.icon}
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
