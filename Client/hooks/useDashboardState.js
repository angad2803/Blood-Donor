import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export const useDashboardState = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [showMapView, setShowMapView] = useState(false);

  const handleSendOffer = (request) => {
    setSelectedRequest(request);
    setShowOfferModal(true);
  };

  const handleOpenChat = (request) => {
    setSelectedChatRequest(request);
    setShowChatModal(true);
  };


  const useKeyboardShortcuts = (
    setActiveTab,
    setShowShortcutsModal,
    setShowOfferModal,
    setShowChatModal,
    navigate
  ) => {
    useEffect(() => {
      const handleKeyPress = (event) => {
        // Only trigger if not typing in an input/textarea
        if (
          event.target.tagName !== "INPUT" &&
          event.target.tagName !== "TEXTAREA"
        ) {
          switch (event.key) {
            case "1":
              setActiveTab("browse");
              break;
            case "2":
              setActiveTab("my-requests");
              break;
            case "3":
              setActiveTab("my-offers");
              break;
            case "4":
              setActiveTab("accepted");
              break;
            case "c":
            case "C":
              if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+C
              navigate("/create-request");
              break;
            case "?":
              setShowShortcutsModal(true);
              break;
            case "Escape":
              setShowShortcutsModal(false);
              setShowOfferModal(false);
              setShowChatModal(false);
              break;
            default:
              break;
          }
        }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }, [
      setActiveTab,
      setShowShortcutsModal,
      setShowOfferModal,
      setShowChatModal,
      navigate,
    ]);
  };

  return {
    navigate,
    location,
    selectedRequest,
    setSelectedRequest,
    showOfferModal,
    setShowOfferModal,
    showShortcutsModal,
    setShowShortcutsModal,
    showChatModal,
    setShowChatModal,
    selectedChatRequest,
    setSelectedChatRequest,
    activeTab,
    setActiveTab,
    showMapView,
    setShowMapView,
    handleSendOffer,
    handleOpenChat,
    useKeyboardShortcuts,
  };
};
