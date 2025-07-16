import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
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
import AIChatbot from "../components/AIChatbot.jsx";
import ChatbotButton from "../components/ChatbotButton";
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
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotNotification, setChatbotNotification] = useState(true);

  // GSAP Refs
  const cardsRef = useRef([]);
  const tabsRef = useRef(null);
  const ribbonRef = useRef(null);
  const mainContentRef = useRef(null);
  const headerRef = useRef(null);
  const backgroundRef = useRef(null);
  const floatingElementsRef = useRef([]);
  const quickStatsRef = useRef(null);

  const fetchData = useCallback(async () => {
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
  }, []);

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
  }, [location.state, navigate, fetchData]);

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

  // GSAP Animation Functions

  const createFloatingParticles = () => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "floating-particle fixed pointer-events-none z-0";
      particle.style.cssText = `
        width: ${Math.random() * 12 + 6}px;
        height: ${Math.random() * 12 + 6}px;
        background: linear-gradient(45deg, 
          rgba(239, 68, 68, 0.4), 
          rgba(59, 130, 246, 0.4), 
          rgba(16, 185, 129, 0.4)
        );
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
      `;
      document.body.appendChild(particle);
      particles.push(particle);

      // Complex animation patterns
      gsap.to(particle, {
        y: Math.random() * 400 - 200,
        x: Math.random() * 400 - 200,
        rotation: 360,
        duration: Math.random() * 30 + 15,
        repeat: -1,
        ease: "none",
      });

      gsap.to(particle, {
        opacity: Math.random() * 0.6 + 0.3,
        scale: Math.random() * 0.8 + 0.4,
        duration: Math.random() * 4 + 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    floatingElementsRef.current = particles;
  };

  const createMorphingBlobs = () => {
    const blobs = [];
    for (let i = 0; i < 3; i++) {
      const blob = document.createElement("div");
      blob.className = "morphing-blob fixed pointer-events-none z-0";
      blob.style.cssText = `
        width: ${Math.random() * 200 + 100}px;
        height: ${Math.random() * 200 + 100}px;
        background: linear-gradient(45deg, 
          rgba(139, 92, 246, 0.1), 
          rgba(236, 72, 153, 0.1), 
          rgba(59, 130, 246, 0.1)
        );
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
        left: ${Math.random() * 80 + 10}%;
        top: ${Math.random() * 80 + 10}%;
        filter: blur(40px);
      `;
      document.body.appendChild(blob);
      blobs.push(blob);

      // Morphing animation
      gsap.to(blob, {
        borderRadius: "70% 30% 30% 70% / 70% 70% 30% 30%",
        duration: Math.random() * 8 + 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(blob, {
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: 360,
        duration: Math.random() * 20 + 15,
        repeat: -1,
        ease: "none",
      });
    }

    floatingElementsRef.current = [...floatingElementsRef.current, ...blobs];
  };

  const createSparkleEffect = () => {
    const sparkles = [];
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle-effect fixed pointer-events-none z-10";
      sparkle.innerHTML = "✨";
      sparkle.style.cssText = `
        font-size: ${Math.random() * 8 + 12}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        color: rgba(255, 215, 0, 0.8);
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      `;
      document.body.appendChild(sparkle);
      sparkles.push(sparkle);

      // Sparkle animation
      gsap.fromTo(
        sparkle,
        { scale: 0, rotation: 0, opacity: 0 },
        {
          scale: 1,
          rotation: 360,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          delay: Math.random() * 2,
        }
      );

      gsap.to(sparkle, {
        y: -50,
        opacity: 0,
        duration: 2,
        delay: Math.random() * 2 + 0.6,
        onComplete: () => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        },
      });
    }
  };

  const animateTabTransition = (newTab) => {
    // Enhanced glass morphism tab change animation
    animateRibbonTabChange(newTab);

    gsap.to(mainContentRef.current, {
      opacity: 0,
      y: -30,
      scale: 0.95,
      rotationX: -10,
      backdropFilter: "blur(5px)",
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        setActiveTab(newTab);
        gsap.fromTo(
          mainContentRef.current,
          {
            opacity: 0,
            y: 30,
            scale: 0.95,
            rotationX: 10,
            backdropFilter: "blur(5px)",
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            backdropFilter: "blur(20px)",
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
              // Reset cards ref and animate them
              cardsRef.current = [];
              setTimeout(() => {
                animateCards();
                addCardHoverEffects();
              }, 100);
            },
          }
        );
      },
    });
  };

  const animateRibbonTabChange = (newTab) => {
    if (tabsRef.current) {
      const tabButtons = tabsRef.current.querySelectorAll("button");
      const activeButton = Array.from(tabButtons).find(
        (btn) => btn.getAttribute("data-tab") === newTab
      );

      if (activeButton) {
        // Enhanced pulse effect with glass morphism
        gsap.fromTo(
          activeButton,
          { scale: 1 },
          {
            scale: 1.1,
            rotationY: 10,
            backdropFilter: "blur(25px) saturate(200%)",
            duration: 0.2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          }
        );

        // Glass ripple effect from the clicked tab
        const ripple = document.createElement("div");
        ripple.className = "absolute inset-0 rounded-2xl pointer-events-none";
        ripple.style.background =
          "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)";
        ripple.style.backdropFilter = "blur(10px)";
        activeButton.appendChild(ripple);

        gsap.fromTo(
          ripple,
          { scale: 0, opacity: 0.6 },
          {
            scale: 3,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => ripple.remove(),
          }
        );

        // Create magical sparkles
        for (let i = 0; i < 5; i++) {
          const sparkle = document.createElement("div");
          sparkle.innerHTML = "✨";
          sparkle.className = "absolute pointer-events-none";
          sparkle.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            font-size: ${Math.random() * 8 + 8}px;
          `;
          activeButton.appendChild(sparkle);

          gsap.fromTo(
            sparkle,
            { scale: 0, opacity: 1, rotation: 0 },
            {
              scale: 1.5,
              opacity: 0,
              rotation: 360,
              y: -30,
              duration: 1.2,
              ease: "power2.out",
              delay: Math.random() * 0.3,
              onComplete: () => sparkle.remove(),
            }
          );
        }
      }

      // Enhanced wave effect across all tabs
      gsap.to(tabButtons, {
        y: -3,
        rotationX: 5,
        backdropFilter: "blur(20px) saturate(150%)",
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.08,
        yoyo: true,
        repeat: 1,
      });
    }
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

  // Enhanced hover effects with glassmorphism
  const addCardHoverEffects = () => {
    const cardElements = document.querySelectorAll(".blood-card");
    cardElements.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          y: -12,
          scale: 1.03,
          boxShadow:
            "0 25px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          backdropFilter: "blur(20px) saturate(200%)",
          duration: 0.4,
          ease: "power2.out",
        });

        // Add a glass shine effect
        const shine = document.createElement("div");
        shine.className = "absolute inset-0 pointer-events-none opacity-30";
        shine.style.background =
          "linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent)";
        shine.style.backgroundSize = "200% 200%";
        shine.style.animation = "cardShine 0.6s ease-out";
        card.appendChild(shine);

        setTimeout(() => shine.remove(), 600);
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow:
            "0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
          backdropFilter: "blur(12px) saturate(150%)",
          duration: 0.4,
          ease: "power2.out",
        });
      });
    });
  };

  useEffect(() => {
    // Enhanced page entrance animation
    const performAnimations = () => {
      const tl = gsap.timeline();

      // Background particle animation
      createFloatingParticles();
      createMorphingBlobs();

      // Header entrance with magnetic effect
      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          {
            y: -80,
            opacity: 0,
            scale: 0.9,
            rotationX: -15,
            transformPerspective: 1000,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotationX: 0,
            duration: 1.2,
            ease: "power3.out",
          }
        );
      }

      // Ribbon with elegant slide-in and glass effect
      if (ribbonRef.current) {
        tl.fromTo(
          ribbonRef.current,
          {
            y: -40,
            opacity: 0,
            rotationX: -20,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            rotationX: 0,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.6"
        );
      }

      // Quick stats entrance with bounce
      if (quickStatsRef.current) {
        tl.fromTo(
          quickStatsRef.current,
          { y: 60, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)" },
          "-=0.4"
        );
      }

      // Main content with magical reveal
      if (mainContentRef.current) {
        tl.fromTo(
          mainContentRef.current,
          {
            y: 60,
            opacity: 0,
            scale: 0.95,
            filter: "blur(10px)",
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1,
            ease: "power2.out",
          },
          "-=0.6"
        );
      }

      // Add magical sparkle effects
      createSparkleEffect();
    };

    performAnimations();

    // Add ribbon hover effects after entrance animation
    setTimeout(() => {
      if (tabsRef.current) {
        const tabButtons = tabsRef.current.querySelectorAll("button");

        tabButtons.forEach((button) => {
          // Enhanced hover enter effect
          button.addEventListener("mouseenter", () => {
            if (!button.getAttribute("data-tab") === activeTab) {
              gsap.to(button, {
                y: -3,
                scale: 1.05,
                rotationY: 5,
                backdropFilter: "blur(20px) saturate(200%)",
                duration: 0.4,
                ease: "power2.out",
              });

              // Add magical glow effect
              gsap.to(button, {
                boxShadow:
                  "0 15px 30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                duration: 0.4,
                ease: "power2.out",
              });
            }
          });

          // Enhanced hover leave effect
          button.addEventListener("mouseleave", () => {
            if (!button.getAttribute("data-tab") === activeTab) {
              gsap.to(button, {
                y: 0,
                scale: 1,
                rotationY: 0,
                boxShadow:
                  "0 8px 16px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(16px) saturate(180%)",
                duration: 0.4,
                ease: "power2.out",
              });
            }
          });
        });
      }
    }, 800);

    // Cleanup floating particles on unmount
    return () => {
      floatingElementsRef.current.forEach((particle) => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [activeTab]);

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
    <div
      ref={backgroundRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(239, 68, 68, 0.08) 0%, 
            rgba(59, 130, 246, 0.08) 20%, 
            rgba(16, 185, 129, 0.06) 40%, 
            rgba(245, 101, 101, 0.08) 60%, 
            rgba(139, 92, 246, 0.08) 80%,
            rgba(236, 72, 153, 0.06) 100%
          ),
          radial-gradient(ellipse at 30% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 30%, rgba(255, 119, 198, 0.12) 0%, transparent 55%),
          radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 45%),
          linear-gradient(to bottom, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.98) 30%, 
            rgba(241, 245, 249, 0.95) 70%, 
            rgba(248, 250, 252, 0.98) 100%
          )
        `,
        backgroundSize:
          "400% 400%, 800px 600px, 600px 800px, 700px 500px, 500px 700px, 100% 100%",
        animation: "gradientShift 20s ease infinite",
      }}
    >
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs with enhanced animation */}
        <div
          className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-red-200 via-red-100 to-pink-100 rounded-full opacity-30 blur-xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute top-1/3 right-20 w-32 h-32 bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-100 rounded-full opacity-40 animate-bounce blur-lg"
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-green-200 via-green-100 to-emerald-100 rounded-full opacity-35 animate-pulse blur-lg"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-36 h-36 bg-gradient-to-br from-purple-200 via-purple-100 to-violet-100 rounded-full opacity-25 animate-spin blur-xl"
          style={{ animationDuration: "20s" }}
        ></div>

        {/* Geometric shapes */}
        <div
          className="absolute top-20 right-1/3 w-16 h-16 border-2 border-blue-200 rotate-45 opacity-20 animate-pulse"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-40 right-20 w-12 h-12 border-2 border-red-200 rounded-full opacity-25 animate-ping"
          style={{ animationDuration: "4s" }}
        ></div>
      </div>

      {/* Add CSS for the gradient animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0%,
          100% {
            background-position:
              0% 50%,
              0% 0%,
              100% 100%,
              0% 100%,
              100% 0%,
              0% 0%;
          }
          25% {
            background-position:
              100% 50%,
              25% 25%,
              75% 75%,
              50% 50%,
              50% 50%,
              0% 0%;
          }
          50% {
            background-position:
              50% 100%,
              50% 50%,
              50% 50%,
              100% 0%,
              0% 100%,
              0% 0%;
          }
          75% {
            background-position:
              0% 0%,
              75% 75%,
              25% 25%,
              50% 100%,
              100% 50%,
              0% 0%;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      {/* Header - Enhanced with glassmorphism */}
      <div
        ref={headerRef}
        className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20"
        style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
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

      {/* Enhanced Navigation Tabs with Glass Morphism */}
      <div
        className="relative overflow-hidden border-b border-white/30"
        ref={ribbonRef}
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.25) 0%, 
              rgba(255, 255, 255, 0.18) 50%, 
              rgba(255, 255, 255, 0.25) 100%
            ),
            linear-gradient(90deg, 
              rgba(59, 130, 246, 0.05) 0%, 
              rgba(99, 102, 241, 0.05) 25%, 
              rgba(139, 92, 246, 0.05) 50%, 
              rgba(99, 102, 241, 0.05) 75%, 
              rgba(59, 130, 246, 0.05) 100%
            )
          `,
          backdropFilter: "blur(20px) saturate(180%)",
          boxShadow: `
            0 8px 32px rgba(59, 130, 246, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.1) 50%, 
              transparent 100%
            )`,
            backgroundSize: "200% 100%",
            animation: "shimmer 8s ease-in-out infinite",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav
            className="flex space-x-2 overflow-x-auto scrollbar-hide py-2"
            ref={tabsRef}
          >
            {[
              {
                id: "browse",
                label: "Browse Requests",
                icon: "🔍",
                shortcut: "1",
                gradient: "from-blue-500 to-cyan-500",
                adminOnly: false,
              },
              {
                id: "my-requests",
                label: "My Requests",
                icon: "📋",
                shortcut: "2",
                gradient: "from-emerald-500 to-green-500",
                adminOnly: false,
              },
              {
                id: "my-offers",
                label: "My Offers",
                icon: "💌",
                shortcut: "3",
                gradient: "from-purple-500 to-indigo-500",
                adminOnly: false,
              },
              {
                id: "accepted",
                label: "Accepted Offers",
                icon: "✅",
                shortcut: "4",
                gradient: "from-red-500 to-pink-500",
                adminOnly: false,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => animateTabTransition(tab.id)}
                  className={`
                    relative px-6 py-3 font-semibold text-sm flex items-center 
                    transition-all duration-300 ease-out group rounded-xl
                    transform hover:scale-105 hover:rotate-1
                    ${
                      isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.gradient.split("-")[1]}-500/25 z-20`
                        : `text-gray-700 hover:text-gray-900 bg-white/40 hover:bg-white/60 
                           backdrop-blur-sm border border-white/20 hover:border-white/40
                           shadow-sm hover:shadow-md`
                    }
                  `}
                  style={{
                    ...(isActive && {
                      boxShadow: `
                        0 10px 25px rgba(0, 0, 0, 0.15),
                        0 5px 10px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                    }),
                  }}
                  title={`${tab.label} (Press ${tab.shortcut})`}
                >
                  {/* Sparkle effect for active tab */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 text-yellow-300 animate-pulse">
                      ✨
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative flex items-center space-x-3">
                    <span
                      className={`text-lg transition-all duration-300 ${
                        isActive
                          ? "scale-110 drop-shadow-sm"
                          : "group-hover:scale-105"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {tab.label}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-white/20 text-white/80"
                          : "bg-gray-200/60 text-gray-500 group-hover:bg-gray-300/60"
                      }`}
                    >
                      {tab.shortcut}
                    </span>
                  </div>

                  {/* Active tab glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content with Glassmorphism */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
        ref={mainContentRef}
      >
        {/* Glassmorphic container for content */}
        <div
          className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.25) 0%, 
                rgba(255, 255, 255, 0.1) 50%, 
                rgba(255, 255, 255, 0.25) 100%
              )
            `,
            backdropFilter: "blur(20px) saturate(180%) brightness(110%)",
            boxShadow: `
              0 25px 50px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Glass reflection overlay */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none opacity-30"
            style={{
              background: `linear-gradient(135deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.2) 45%, 
                rgba(255, 255, 255, 0.4) 50%, 
                rgba(255, 255, 255, 0.2) 55%, 
                transparent 100%
              )`,
              backgroundSize: "200% 200%",
              animation: "contentGlassReflection 8s ease-in-out infinite",
            }}
          ></div>

          {/* Quick Stats with Enhanced Glassmorphism */}
          <div ref={quickStatsRef} className="mb-8">
            <QuickStats
              requests={requests}
              myRequests={myRequests}
              myOffers={myOffers}
            />
          </div>

          {/* Tab Content with Glass Cards */}
          <div className="relative z-10">
            {activeTab === "browse" && (
              <div
                className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
                style={{
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `,
                }}
              >
                {renderBloodRequests()}
              </div>
            )}
            {activeTab === "my-requests" && (
              <div
                className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
                style={{
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `,
                }}
              >
                {renderMyRequests()}
              </div>
            )}
            {activeTab === "my-offers" && (
              <div
                className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
                style={{
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `,
                }}
              >
                <MyOffersCarousel
                  myOffers={myOffers}
                  onOpenChat={handleOpenChat}
                  navigate={navigate}
                />
              </div>
            )}
            {activeTab === "accepted" && (
              <div
                className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl"
                style={{
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `,
                }}
              >
                <AcceptedOffersCarousel
                  acceptedOffers={acceptedOffers}
                  onOpenChat={handleOpenChat}
                  onGetDirections={handleGetDirections}
                />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced CSS animations */}
        <style jsx>{`
          @keyframes contentGlassReflection {
            0%,
            100% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            50% {
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }
          @keyframes cardShine {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }
          @keyframes glassParticle {
            0% {
              transform: scale(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: scale(1.5) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
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
    </div>
  );
};

export default Dashboard;
