import React from "react";
import SendOfferModal from "../requests/SendOfferModal";
import KeyboardShortcutsModal from "../ui/KeyboardShortcutsModal";

const DashboardModals = ({
  showOfferModal,
  setShowOfferModal,
  selectedRequest,
  handleOfferSent,
  showChatModal,
  setShowChatModal,
  selectedChatRequest,
  showShortcutsModal,
  setShowShortcutsModal,
  user,
}) => {
  return (
    <>
      {}
      <SendOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        bloodRequest={selectedRequest}
        onOfferSent={handleOfferSent}
      />

      {}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        user={user}
      />

    </>
  );
};

export default DashboardModals;
