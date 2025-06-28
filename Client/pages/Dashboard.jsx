import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import SendOfferModal from "../components/SendOfferModal";
import AcceptedOffersCarousel from "../components/AcceptedOffersCarousel";
import MyRequestsCarousel from "../components/MyRequestsCarousel";
import MyOffersCarousel from "../components/MyOffersCarousel";
import LoadingSpinner from "../components/LoadingSpinner";
import QuickStats from "../components/QuickStats";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";
import ChatComponent from "../components/ChatComponent";
import BloodRequestCarousel from "../components/BloodRequestCarousel";
import LeafletMap from "../components/LeafletMap";
import mapsDirectionsService from "../utils/mapsDirectionsService";
import { toast } from "react-toastify";
import { gsap } from "gsap";

const Dashboard = () => {
  const { user, logout, refreshUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("browse"); // browse, my-requests, my-offers, accepted
  const [loading, setLoading] = useState(true);
  const [requestsWithOffers, setRequestsWithOffers] = useState(new Set()); // Track requests user has sent offers for
  const [showMapView, setShowMapView] = useState(false); // Toggle between list and map view
  const arcgisDirectionsRef = useRef(null); // Reference to ArcGIS directions function
  const [isMapReady, setIsMapReady] = useState(false); // Track if ArcGIS map is ready

  // GSAP Refs
  const cardsRef = useRef([]);
  const tabsRef = useRef(null);
  const ribbonRef = useRef(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    fetchData();

    // Handle success messages from navigation state
    if (location.state?.message) {
      toast.success(location.state.message);
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }

    // Add keyboard shortcuts
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
  }, [location.state, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRequests(),
        fetchMyRequests(),
        fetchMyOffers(),
        fetchAcceptedOffers(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/request/all");
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching requests", err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/request/my-requests");
      setMyRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching my requests", err);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const res = await api.get("/offer/my-offers");
      setMyOffers(res.data.offers);

      // Extract request IDs that the user has already sent offers for
      const offeredRequestIds = new Set(
        res.data.offers.map((offer) => offer.bloodRequest._id)
      );
      setRequestsWithOffers(offeredRequestIds);
    } catch (err) {
      console.error("Error fetching my offers", err);
    }
  };

  const fetchAcceptedOffers = async () => {
    try {
      const res = await api.get("/offer/accepted");
      setAcceptedOffers(res.data.acceptedOffers);
    } catch (err) {
      console.error("Error fetching accepted offers", err);
    }
  };

  const handleSendOffer = (request) => {
    setSelectedRequest(request);
    setShowOfferModal(true);
  };

  const handleOpenChat = (request) => {
    setSelectedChatRequest(request);
    setShowChatModal(true);
  };

  const handleOfferSent = () => {
    fetchMyOffers(); // Refresh offers and update requestsWithOffers
    fetchAcceptedOffers(); // Refresh accepted offers
    fetchRequests(); // Refresh available requests to reflect the change
    setShowOfferModal(false);
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await api.post(`/offer/accept/${offerId}`);
      fetchMyRequests(); // Refresh requests
      fetchAcceptedOffers(); // Refresh accepted offers
      toast.success(
        "🎉 Offer accepted successfully! The donor has been notified and will contact you soon."
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept offer");
    }
  };

  const getDistanceInfo = (request) => {
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

  const handleGetDirections = async (request) => {
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
      if (isMapReady && arcgisDirectionsRef.current) {
        try {
          await arcgisDirectionsRef.current(
            reqLng,
            reqLat,
            request.hospitalName || request.location
          );
          toast.success("Directions shown on map!");
          return true;
        } catch (error) {
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

  const renderBloodRequests = () => {
    const availableRequests = requests.filter(
      (req) =>
        !requestsWithOffers.has(req._id) && req.requester?._id !== user?._id // Filter out user's own requests
    );

    return (
      <div className="bg-white rounded-lg shadow-md">
        {/* View Toggle Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Blood Requests Near You
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {availableRequests.length} urgent blood requests in your area
            </p>
          </div>
          {/* View Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowMapView(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !showMapView
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">📋</span>
              List View
            </button>
            <button
              onClick={() => setShowMapView(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                showMapView
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">🗺️</span>
              Map View
            </button>
          </div>
        </div>
        <div className="p-6">
          {showMapView ? (
            <div className="space-y-4">
              {/* Leaflet Map Component */}
              <LeafletMap requests={availableRequests} height="600px" />
              {/* Map Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Map Legend</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span>Emergency Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span>Regular Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span>Your Location</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <BloodRequestCarousel
              requests={availableRequests}
              onSendOffer={handleSendOffer}
              onOpenChat={handleOpenChat}
              onGetDirections={handleGetDirections}
              getDistanceInfo={getDistanceInfo}
            />
          )}
        </div>
      </div>
    );
  };

  const renderMyRequests = () => (
    <MyRequestsCarousel
      myRequests={myRequests}
      onOpenChat={handleOpenChat}
      onAcceptOffer={handleAcceptOffer}
      navigate={navigate}
      allowMultipleRequests={true}
      user={user}
    />
  );

  // GSAP Animation Functions
  const animateCards = () => {
    if (cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current,
        {
          y: 50,
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  };

  const animateTabTransition = (newTab) => {
    // Animate ribbon tab change
    animateRibbonTabChange(newTab);

    gsap.to(mainContentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        setActiveTab(newTab);
        gsap.to(mainContentRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            // Reset cards ref and animate them
            cardsRef.current = [];
            setTimeout(animateCards, 50);
          },
        });
      },
    });
  };

  const animateEmergencyPulse = () => {
    const emergencyElements = document.querySelectorAll(".emergency-pulse");
    if (emergencyElements.length > 0) {
      gsap.to(emergencyElements, {
        scale: 1.1,
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  };

  // Enhanced hover effects
  const addCardHoverEffects = () => {
    const cardElements = document.querySelectorAll(".blood-card");
    cardElements.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          y: -5,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          duration: 0.3,
          ease: "power2.out",
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          y: 0,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
  };

  // Ribbon Animation Functions
  const animateRibbonOnMount = () => {
    if (ribbonRef.current && tabsRef.current) {
      // Gentle ribbon entrance animation
      gsap.fromTo(
        ribbonRef.current,
        {
          y: -20,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.2,
        }
      );

      // Subtle tab entrance
      const tabButtons = tabsRef.current.querySelectorAll("button");
      gsap.fromTo(
        tabButtons,
        {
          y: 15,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.1,
          delay: 0.4,
        }
      );

      // Very subtle shimmer effect
      gsap.to(ribbonRef.current, {
        backgroundPosition: "200% center",
        duration: 12,
        ease: "none",
        repeat: -1,
        delay: 1,
      });
    }
  };

  const animateRibbonTabChange = (newTab) => {
    if (tabsRef.current) {
      const tabButtons = tabsRef.current.querySelectorAll("button");
      const activeButton = Array.from(tabButtons).find(
        (btn) => btn.getAttribute("data-tab") === newTab
      );

      if (activeButton) {
        // Pulse effect on the selected tab
        gsap.fromTo(
          activeButton,
          { scale: 1 },
          {
            scale: 1.05,
            duration: 0.15,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          }
        );

        // Ripple effect from the clicked tab
        const ripple = document.createElement("div");
        ripple.className =
          "absolute inset-0 bg-red-100 rounded-lg opacity-30 pointer-events-none";
        activeButton.appendChild(ripple);

        gsap.fromTo(
          ripple,
          { scale: 0, opacity: 0.3 },
          {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => ripple.remove(),
          }
        );
      }

      // Subtle wave effect across all tabs
      gsap.to(tabButtons, {
        y: -2,
        duration: 0.2,
        ease: "power2.out",
        stagger: 0.05,
        yoyo: true,
        repeat: 1,
      });
    }
  };

  const addRibbonHoverEffects = () => {
    if (tabsRef.current) {
      const tabButtons = tabsRef.current.querySelectorAll("button");

      tabButtons.forEach((button) => {
        // Subtle hover enter effect
        button.addEventListener("mouseenter", () => {
          if (!button.classList.contains("bg-white")) {
            // Don't animate active tabs
            gsap.to(button, {
              y: -2,
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
            });

            // Gentle glow effect
            gsap.to(button, {
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
              duration: 0.3,
              ease: "power2.out",
            });
          }
        });

        // Subtle hover leave effect
        button.addEventListener("mouseleave", () => {
          if (!button.classList.contains("bg-white")) {
            // Don't animate active tabs
            gsap.to(button, {
              y: 0,
              scale: 1,
              boxShadow: "0 1px 3px rgba(59, 130, 246, 0.05)",
              duration: 0.3,
              ease: "power2.out",
            });
          }
        });
      });
    }
  };

  // Active tab indicator animation
  const animateActiveTabIndicator = () => {
    if (tabsRef.current) {
      const activeTabIndicators = tabsRef.current.querySelectorAll(
        ".active-tab-indicator"
      );

      if (activeTabIndicators.length > 0) {
        gsap.to(activeTabIndicators, {
          scaleX: 1.05,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    }
  };

  useEffect(() => {
    // Initial animations
    gsap.from(mainContentRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: "power2.out",
    });

    // Animate ribbon on mount
    animateRibbonOnMount();

    // Add ribbon hover effects
    setTimeout(addRibbonHoverEffects, 600); // Add after ribbon animation completes

    // Animate cards on mount
    animateCards();

    // Add hover effects
    addCardHoverEffects();
  }, []);

  // GSAP Animation Effects
  useEffect(() => {
    // Animate cards when data loads
    if (!loading && requests.length > 0) {
      setTimeout(() => {
        animateCards();
        addCardHoverEffects();
        animateEmergencyPulse();
      }, 100);
    }
  }, [loading, requests, myRequests, myOffers, activeTab]);

  // Initial page load animation
  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(
        mainContentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Blood Donation Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Loading your dashboard...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner
            size="lg"
            color="red"
            message="Loading your blood donation dashboard..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Reduced prominence */}
      <div className="bg-white/90 shadow-sm border-b border-gray-100 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center space-x-4">
              {/* Logo Only */}
              <div
                className="flex items-center cursor-pointer group"
                onClick={() => navigate("/")}
              >
                {/* Logo - Larger Size */}
                <div className="w-16 h-16 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 bg-transparent">
                  <img
                    src="/ChatGPT-Image-Jun-27_-2025_-10_06_09-PM.svg"
                    alt="Blood Donation App"
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      // Fallback to emoji if image doesn't load
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <span className="text-red-500 text-4xl font-bold hidden">
                    🩸
                  </span>
                </div>
              </div>

              {/* User Info Card - Smaller */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-md px-3 py-2 shadow-sm">
                <div className="flex items-center space-x-3">
                  {/* User Avatar - Smaller */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>

                  {/* User Details - Smaller */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-700">
                        {user?.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {user?.bloodGroup}
                        </span>
                      </div>
                    </div>

                    {/* Location Info - Smaller */}
                    {user?.location && (
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-xs text-gray-300">📍</span>
                        <span className="text-xs text-gray-400 truncate max-w-32">
                          {user.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions - Smaller and less prominent */}
            <div className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
              {/* Hospital-specific navigation */}
              {user?.isHospital && (
                <button
                  onClick={() => navigate("/hospital/requests")}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200 flex items-center space-x-1 text-sm"
                  title="Manage hospital blood requests"
                >
                  <span className="text-sm">🏥</span>
                  <span>Hospital</span>
                </button>
              )}

              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                title="Keyboard shortcuts (?)"
              >
                <span className="text-sm">⌨️</span>
              </button>

              {/* GSAP Demo Button */}
              <button
                onClick={() => navigate("/gsap-demo")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1.5 rounded-md hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all duration-200 flex items-center space-x-1 text-xs"
                title="View GSAP Animation Demo"
              >
                <span className="text-sm">🎨</span>
                <span>Demos</span>
              </button>

              {/* Admin Cleanup Button - Only show for admin users */}
              {user?.isAdmin && (
                <button
                  onClick={async () => {
                    // Refresh user data to check current admin status
                    const freshUser = await refreshUserData();
                    if (freshUser?.isAdmin) {
                      navigate("/admin-cleanup");
                    } else {
                      toast.error(
                        "Access denied. Admin privileges have been revoked."
                      );
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1.5 rounded-md hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-1 focus:ring-orange-400 transition-all duration-200 flex items-center space-x-1 text-xs"
                  title="Admin Cleanup Tool"
                >
                  <span className="text-sm">🧹</span>
                  <span>Admin</span>
                </button>
              )}

              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all duration-200 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div
        className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200 shadow-md overflow-hidden"
        ref={ribbonRef}
        style={{
          backgroundSize: "200% 100%",
          backgroundImage:
            "linear-gradient(90deg, #eff6ff 0%, #f0f9ff 25%, #e0f2fe 50%, #f0f9ff 75%, #eff6ff 100%)",
          boxShadow:
            "0 4px 12px rgba(59, 130, 246, 0.08), 0 2px 6px rgba(99, 102, 241, 0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            className="flex space-x-1 overflow-x-auto scrollbar-hide"
            ref={tabsRef}
          >
            {[
              {
                id: "browse",
                label: "Browse Requests",
                icon: "🔍",
                shortcut: "1",
                adminOnly: false,
              },
              {
                id: "my-requests",
                label: "My Requests",
                icon: "📋",
                shortcut: "2",
                adminOnly: false,
              },
              {
                id: "my-offers",
                label: "My Offers",
                icon: "💌",
                shortcut: "3",
                adminOnly: false,
              },
              {
                id: "accepted",
                label: "Accepted Offers",
                icon: "✅",
                shortcut: "4",
                adminOnly: false,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => animateTabTransition(tab.id)}
                  className={`relative px-6 py-4 font-semibold text-sm flex items-center transition-all duration-300 ease-in-out group rounded-t-lg ${
                    isActive
                      ? "bg-white text-blue-600 border border-blue-300 border-b-0 shadow-lg transform -translate-y-0.5 z-10"
                      : "text-blue-700 hover:text-blue-800 hover:bg-blue-100/60 bg-blue-50/30 rounded-lg mx-1 my-1 border border-blue-200/40 shadow-sm hover:shadow-md"
                  }`}
                  title={`${tab.label} (Press ${tab.shortcut})`}
                >
                  {/* Background gradient for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white rounded-t-lg opacity-60"></div>
                  )}

                  {/* Content */}
                  <div className="relative flex items-center space-x-3">
                    <span
                      className={`text-lg transition-transform duration-200 ${
                        isActive ? "scale-110" : "group-hover:scale-105"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {tab.label}
                    </span>

                    {/* Keyboard shortcut badge */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-100 text-blue-800 shadow-sm"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                      }`}
                    >
                      {tab.shortcut}
                    </span>
                  </div>

                  {/* Active tab bottom indicator */}
                  {isActive && (
                    <div className="active-tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-b-lg"></div>
                  )}

                  {/* Hover effect for inactive tabs */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-indigo-100/30 to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
                  )}

                  {/* Subtle border for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 border border-blue-200 border-b-0 rounded-t-lg"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Decorative bottom border */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-50"></div>
        </div>

        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200 opacity-40"></div>
      </div>

      {/* Main Content */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        ref={mainContentRef}
      >
        {/* Quick Stats */}
        <QuickStats
          requests={requests}
          myRequests={myRequests}
          myOffers={myOffers}
        />

        {/* Tab Content */}
        {activeTab === "browse" && renderBloodRequests()}
        {activeTab === "my-requests" && renderMyRequests()}
        {activeTab === "my-offers" && (
          <MyOffersCarousel
            myOffers={myOffers}
            onOpenChat={handleOpenChat}
            navigate={navigate}
          />
        )}
        {activeTab === "accepted" && (
          <AcceptedOffersCarousel
            acceptedOffers={acceptedOffers}
            onOpenChat={handleOpenChat}
            onGetDirections={handleGetDirections}
          />
        )}
      </div>

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
    </div>
  );
};

export default Dashboard;
