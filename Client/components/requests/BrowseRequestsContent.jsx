import React from "react";
import BloodRequestCarousel from "./BloodRequestCarousel";

const BrowseRequestsContent = ({
  requests,
  requestsWithOffers,
  user,
  handleSendOffer,
  handleOpenChat,
}) => {
  const availableRequests = requests.filter(
    (req) =>
      !requestsWithOffers.has(req._id) && req.requester?._id !== user?._id
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      {}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Blood Requests Near You
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {availableRequests.length} urgent blood requests in your area
          </p>
        </div>
      </div>

      {}
      <div className="p-6">
        <BloodRequestCarousel
          requests={availableRequests}
          onSendOffer={handleSendOffer}
          onOpenChat={handleOpenChat}
        />
      </div>
    </div>
  );
};

export default BrowseRequestsContent;
