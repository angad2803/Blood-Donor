import React from "react";
import SendOfferModal from "../requests/SendOfferModal";
import ChatComponent from "../chat/ChatComponent";
import KeyboardShortcutsModal from "../ui/KeyboardShortcutsModal";
import AIChatbot from "../chat/AIChatbot.jsx";
import ChatbotButton from "../chat/ChatbotButton";

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
  showChatbot,
  setShowChatbot,
  chatbotNotification,
  setChatbotNotification,
  user,
}) => {
  return (
    <>
      {/* Send Offer Modal */}
      <SendOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        bloodRequest={selectedRequest}
        onOfferSent={handleOfferSent}
      />

      {/* Chat Modal */}
      <ChatComponent
        bloodRequest={selectedChatRequest}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        user={user}
      />

      {/* AI Chatbot */}
      <ChatbotButton
        onClick={() => {
          setShowChatbot(true);
          setChatbotNotification(false);
        }}
        hasNotification={chatbotNotification}
      />

      <AIChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        user={user}
      />
    </>
  );
};

export default DashboardModals;
