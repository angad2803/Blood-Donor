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
      color: "text-red-300",
      bgGradient: "from-red-500/10 to-pink-500/10",
      glowColor: "red",
    },
    {
      label: "My Requests",
      value: myActiveRequests,
      icon: "📋",
      color: "text-blue-300",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      glowColor: "blue",
    },
    {
      label: "Pending Offers",
      value: pendingOffers,
      icon: "⏳",
      color: "text-yellow-300",
      bgGradient: "from-yellow-500/10 to-orange-500/10",
      glowColor: "yellow",
    },
    {
      label: "Accepted Offers",
      value: acceptedOffers,
      icon: "✅",
      color: "text-green-300",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      glowColor: "green",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`glass-card glass-interactive p-6 text-center bg-gradient-to-br ${stat.bgGradient} relative overflow-hidden group`}
        >
          {/* Glow effect on hover */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${stat.bgGradient}`}
          />

          <div className="relative z-10">
            <div
              className={`text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-200 ${stat.glowColor === "red" ? "neon-glow text-red-300" : stat.glowColor === "blue" ? "neon-glow text-blue-300" : stat.glowColor === "yellow" ? "neon-glow text-yellow-300" : "neon-glow text-green-300"}`}
            >
              {stat.icon}
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>
              {stat.value}
            </div>
            <div className="text-sm text-white font-semibold">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
