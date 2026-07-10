import React from "react";
import MyRequestsCarousel from "../requests/MyRequestsCarousel";
import MyOffersCarousel from "../requests/MyOffersCarousel";
import AcceptedOffersCarousel from "../requests/AcceptedOffersCarousel";

const TabContent = ({
  activeTab,
  myRequests,
  myOffers,
  acceptedOffers,
  handleAcceptOffer,
  handleRejectOffer,
  handleOpenChat,
  user,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "my-requests":
        return (
          <MyRequestsCarousel
            myRequests={myRequests}
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
            onOpenChat={handleOpenChat}
            user={user}
          />
        );
      case "my-offers":
        return (
          <MyOffersCarousel
            myOffers={myOffers}
            onOpenChat={handleOpenChat}
          />
        );
      case "accepted":
        return (
          <AcceptedOffersCarousel
            acceptedOffers={acceptedOffers}
            onOpenChat={handleOpenChat}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  if (activeTab === "browse") {
    return null;
  }

  return (
    <div
      className="bg-white/20 dark:bg-gray-800/40 backdrop-blur-lg rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 shadow-xl transition-colors duration-300"
      style={{
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
      }}
    >
      {renderTabContent()}
    </div>
  );
};

export default TabContent;
