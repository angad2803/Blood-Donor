import React from "react";
import MyRequestsCarousel from "./MyRequestsCarousel";
import MyOffersCarousel from "./MyOffersCarousel";
import AcceptedOffersCarousel from "./AcceptedOffersCarousel";

const TabContent = ({
  activeTab,
  myRequests,
  myOffers,
  acceptedOffers,
  handleAcceptOffer,
  handleOpenChat,
  handleGetDirections,
  navigate,
  user,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "my-requests":
        return (
          <MyRequestsCarousel
            myRequests={myRequests}
            onAcceptOffer={handleAcceptOffer}
            onOpenChat={handleOpenChat}
            onGetDirections={handleGetDirections}
            navigate={navigate}
            user={user}
          />
        );
      case "my-offers":
        return (
          <MyOffersCarousel
            offers={myOffers}
            onOpenChat={handleOpenChat}
            onGetDirections={handleGetDirections}
          />
        );
      case "accepted":
        return (
          <AcceptedOffersCarousel
            acceptedOffers={acceptedOffers}
            onOpenChat={handleOpenChat}
            onGetDirections={handleGetDirections}
          />
        );
      default:
        return null;
    }
  };

  if (activeTab === "browse") {
    return null; // Browse content is handled separately
  }

  return (
    <div
      className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
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
