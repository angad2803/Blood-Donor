import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mapsDirectionsService from "../utils/mapsDirectionsService";
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
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotNotification, setChatbotNotification] = useState(true);

  const handleSendOffer = (request) => {
    setSelectedRequest(request);
    setShowOfferModal(true);
  };

  const handleOpenChat = (request) => {
    setSelectedChatRequest(request);
    setShowChatModal(true);
  };

  const getDistanceInfo = (request, user) => {
    if (
      !user.coordinates?.coordinates ||
      !request.requester?.coordinates?.coordinates
    ) {
      return null;
    }

    const [userLon, userLat] = user.coordinates.coordinates;
    const [reqLon, reqLat] = request.requester.coordinates.coordinates;

    return mapsDirectionsService.getDirectionsInfo(
      userLat,
      userLon,
      reqLat,
      reqLon
    );
  };

  const handleGetDirections = async (
    request,
    activeTab,
    showMapView,
    setActiveTab,
    setShowMapView,
    arcgisDirectionsRef
  ) => {
    if (!request.requester?.coordinates?.coordinates) {
      // Fallback to external maps with address search
      const encodedLocation = encodeURIComponent(request.location);
      const googleMapsUrl = `https://www.google.com/maps/search/${encodedLocation}`;
      window.open(googleMapsUrl, "_blank");
      return;
    }

    const [reqLng, reqLat] = request.requester.coordinates.coordinates;

    // Helper to try showing directions with retries
    const tryShowDirections = async (retries = 10, delay = 800) => {
      if (arcgisDirectionsRef.current) {
        try {
          await arcgisDirectionsRef.current(
            reqLng,
            reqLat,
            request.hospitalName || request.location
          );
          toast.success("Directions shown on map!");
          return true;
        } catch {
          if (retries > 0) {
            setTimeout(() => tryShowDirections(retries - 1, delay), delay);
          } else {
            toast.error("Could not show directions on map");
          }
        }
      } else if (retries > 0) {
        setTimeout(() => tryShowDirections(retries - 1, delay), delay);
      } else {
        toast.error("Map not ready for directions");
      }
    };

    // If not in browse tab, switch to browse tab and map view first
    if (activeTab !== "browse") {
      setActiveTab("browse");
      setShowMapView(true);
      setTimeout(() => tryShowDirections(10, 1200), 1800);
      return;
    }

    // If not in map view, switch to map view first
    if (!showMapView) {
      setShowMapView(true);
      setTimeout(() => tryShowDirections(10, 1000), 1200);
      return;
    }

    // Try embedded directions if already in map view
    tryShowDirections();
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
    showChatbot,
    setShowChatbot,
    chatbotNotification,
    setChatbotNotification,
    handleSendOffer,
    handleOpenChat,
    getDistanceInfo,
    handleGetDirections,
    useKeyboardShortcuts,
  };
};
