import React from "react";
import SendOfferModal from "./SendOfferModal";
import ChatComponent from "./ChatComponent";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import AIChatbot from "./AIChatbot.jsx";
import ChatbotButton from "./ChatbotButton";

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
