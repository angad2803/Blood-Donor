"use client";

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { useSession, signOut } from "next-auth/react";
import api from "../api/api.js";
import { toast } from "react-toastify";
import SendOfferModal from "./SendOfferModal";
import MyRequestsCarousel from "./MyRequestsCarousel";
import MyOffersCarousel from "./MyOffersCarousel";
import AcceptedOffersCarousel from "./AcceptedOffersCarousel";
import QuickStats from "./QuickStats";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import ChatComponent from "./ChatComponent";
import BloodRequestCarousel from "./BloodRequestCarousel";
import SimpleMapComponent from "./SimpleMapComponent";
import LoadingSpinner from "./LoadingSpinner";
import { gsap } from "gsap";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [requestsWithOffers, setRequestsWithOffers] = useState(new Set());
  const [showMapView, setShowMapView] = useState(false);
  const arcgisDirectionsRef = useRef(null);
  const [isMapReady] = useState(false);

  // Enhanced GSAP Refs
  const cardsRef = useRef([]);
  const tabsRef = useRef(null);
  const ribbonRef = useRef(null);
  const mainContentRef = useRef(null);
  const headerRef = useRef(null);
  const quickStatsRef = useRef(null);
  const containerRef = useRef(null);
  const plasmaContainerRef = useRef(null);

  // Get current user from either AuthContext or NextAuth session
  const currentUser = user || session?.user;

  // Data fetching functions
  const fetchRequests = async () => {
    try {
      const res = await api.get("/request/all");
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching requests", err);
      // Add some dummy data for development
      setRequests([
        {
          _id: "1",
          bloodGroup: "O+",
          urgency: "high",
          location: "Test Hospital",
          patientName: "John Doe",
          contactNumber: "123-456-7890",
          requester: {
            _id: "req1",
            coordinates: { coordinates: [-74.006, 40.7128] },
          },
        },
        {
          _id: "2",
          bloodGroup: "A+",
          urgency: "medium",
          location: "City Medical Center",
          patientName: "Jane Smith",
          contactNumber: "098-765-4321",
          requester: {
            _id: "req2",
            coordinates: { coordinates: [-73.9857, 40.7484] },
          },
        },
      ]);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/request/my-requests");
      setMyRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching my requests", err);
      setMyRequests([
        {
          _id: "my1",
          bloodGroup: "B+",
          urgency: "high",
          location: "My Hospital",
          patientName: "My Patient",
          fulfilled: false,
        },
      ]);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const res = await api.get("/offer/my-offers");
      setMyOffers(res.data.offers);

      // Extract request IDs that the user has already sent offers for
      const offeredRequestIds = new Set(
        res.data.offers.map((offer) => offer.bloodRequest?._id).filter(Boolean)
      );
      setRequestsWithOffers(offeredRequestIds);
    } catch (err) {
      console.error("Error fetching my offers", err);
      setMyOffers([
        {
          _id: "offer1",
          status: "pending",
          bloodGroup: "O+",
          location: "Test Location",
          bloodRequest: { _id: "1" },
        },
      ]);
    }
  };

  const fetchAcceptedOffers = async () => {
    try {
      const res = await api.get("/offer/accepted");
      setAcceptedOffers(res.data.acceptedOffers);
    } catch (err) {
      console.error("Error fetching accepted offers", err);
      setAcceptedOffers([
        {
          _id: "accepted1",
          bloodGroup: "O+",
          location: "Test Hospital",
          status: "accepted",
        },
      ]);
    }
  };

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
    // Enhanced page entrance animations
    const tl = gsap.timeline();

    // Initialize elements for animation
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0 });
    }

    // Animate page entrance
    tl.to(containerRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
    });

    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.4"
      );
    }

    if (ribbonRef.current) {
      tl.fromTo(
        ribbonRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    if (mainContentRef.current) {
      tl.fromTo(
        mainContentRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      );
    }

    // Animate plasma particles
    if (plasmaContainerRef.current) {
      const particles =
        plasmaContainerRef.current.querySelectorAll(".plasma-particle");
      particles.forEach((particle) => {
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });

        gsap.to(particle, {
          x: `+=${Math.random() * 300 + 150}`,
          y: `+=${(Math.random() - 0.5) * 150}`,
          rotation: 360,
          scale: Math.random() * 0.3 + 0.7,
          duration: Math.random() * 15 + 20,
          repeat: -1,
          ease: "none",
          delay: Math.random() * 10,
        });

        gsap.to(particle, {
          opacity: Math.random() * 0.2 + 0.05,
          duration: Math.random() * 4 + 3,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: Math.random() * 3,
        });
      });
    }

    // Fetch initial data
    fetchData();

    // Add keyboard shortcuts
    const handleKeyPress = (event) => {
      // Only trigger if not typing in an input/textarea
      if (
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA"
      ) {
        switch (event.key) {
          case "1":
            animateTabTransition("browse");
            break;
          case "2":
            animateTabTransition("my-requests");
            break;
          case "3":
            animateTabTransition("my-offers");
            break;
          case "4":
            animateTabTransition("accepted");
            break;
          case "c":
          case "C":
            if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+C
            handleCreateRequest();
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
  }, [fetchData]);

  const handleCreateRequest = () => {
    router.push("/create-request");
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
    fetchMyOffers();
    fetchAcceptedOffers();
    fetchRequests();
    setShowOfferModal(false);
    toast.success("Offer sent successfully!");
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await api.post(`/offer/accept/${offerId}`);
      fetchMyRequests();
      fetchAcceptedOffers();
      toast.success(
        "🎉 Offer accepted successfully! The donor has been notified and will contact you soon."
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept offer");
    }
  };

  const getDistanceInfo = (request) => {
    if (
      !currentUser?.coordinates?.coordinates ||
      !request.requester?.coordinates?.coordinates
    ) {
      return null;
    }

    // Simple distance calculation (can be enhanced with proper service)
    const [userLon, userLat] = currentUser.coordinates.coordinates;
    const [reqLon, reqLat] = request.requester.coordinates.coordinates;

    const distance =
      Math.sqrt(Math.pow(userLat - reqLat, 2) + Math.pow(userLon - reqLon, 2)) *
      111; // Rough km conversion

    return {
      distance: distance.toFixed(1),
      duration: Math.round(distance * 2), // Rough duration in minutes
    };
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

    // If not in browse tab, switch to browse tab and map view first
    if (activeTab !== "browse") {
      animateTabTransition("browse");
      setShowMapView(true);
      setTimeout(() => {
        toast.success("Switched to map view for directions");
      }, 800);
      return;
    }

    // If not in map view, switch to map view first
    if (!showMapView) {
      setShowMapView(true);
      setTimeout(() => {
        toast.success("Directions shown on map!");
      }, 600);
      return;
    }

    // Open external maps as fallback
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${reqLat},${reqLng}`,
      "_blank"
    );
  };

  const renderBloodRequests = () => {
    // Enhanced filtering logic to exclude user's own requests
    const availableRequests = requests.filter((req) => {
      // Skip if user already sent an offer
      if (requestsWithOffers.has(req._id)) return false;

      // Skip if this is the user's own request - multiple checks for robustness
      if (currentUser) {
        const isOwnRequest =
          req.requester?._id === currentUser._id ||
          req.requester?._id === currentUser.id ||
          req.requester?.id === currentUser._id ||
          req.requester?.id === currentUser.id ||
          req.requester?.email === currentUser.email ||
          req.createdBy === currentUser._id ||
          req.createdBy === currentUser.id ||
          req.createdBy === currentUser.email;

        if (isOwnRequest) {
          console.log("Filtering out own request:", req._id, req.requester);
          return false;
        }
      }

      return true;
    });

    return (
      <div className="relative super-visible">
        {/* Clear and Prominent Alert Banner */}
        <div className="relative mb-8 bg-white/95 backdrop-blur-xl border-2 border-red-500/80 rounded-2xl shadow-xl overflow-hidden">
          {/* Subtle accent overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-pink-50/50"></div>

          <div className="relative px-8 py-6">
            <div className="text-center">
              {/* Clear Header */}
              <div className="flex justify-center items-center mb-4">
                <div className="flex items-center space-x-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl px-6 py-3">
                  <span className="text-3xl">🚨</span>
                  <h2 className="text-2xl font-bold text-red-800">
                    URGENT BLOOD REQUESTS
                  </h2>
                  <span className="text-3xl">🩸</span>
                </div>
              </div>

              {/* Clear Stats */}
              <div className="flex justify-center items-center space-x-6 mb-4">
                <div className="bg-red-100 border-2 border-red-300 rounded-lg px-6 py-3">
                  <div className="text-2xl font-black text-red-800">
                    {availableRequests.length}
                  </div>
                  <div className="text-red-700 font-semibold">
                    Urgent Requests
                  </div>
                </div>
                {availableRequests.length > 0 && (
                  <div className="flex items-center bg-green-100 border-2 border-green-300 rounded-lg px-6 py-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-green-700 font-semibold">
                      Live Updates
                    </span>
                  </div>
                )}
              </div>

              {/* Clear Call to Action */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-6 py-4">
                <p className="text-lg font-bold text-blue-800 mb-2">
                  Heroes Needed - Lives Depend on You! 🦸‍♀️🦸‍♂️
                </p>
                <p className="text-blue-700 font-medium">
                  People are counting on donors like you. Every donation saves
                  lives!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Request Cards Container */}
        <div className="relative bg-white/95 backdrop-blur-xl border-2 border-gray-300 rounded-2xl shadow-lg overflow-hidden">
          {/* Subtle background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/50"></div>

          {/* Clear View Toggle Header */}
          <div className="relative px-6 py-4 border-b-2 border-gray-300 bg-gray-100/90">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center mb-2">
                  <span className="mr-3 text-2xl">📍</span>
                  Available Blood Requests Near You
                </h3>
                <p className="text-gray-600 font-medium">
                  Choose your preferred view to find requests you can help with
                </p>
              </div>
              {/* Clear View Toggle Buttons */}
              <div className="flex bg-white border-2 border-gray-300 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setShowMapView(false)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    !showMapView
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2 text-lg">📋</span>
                  List View
                </button>
                <button
                  onClick={() => setShowMapView(true)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    showMapView
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2 text-lg">🗺️</span>
                  Map View
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {showMapView ? (
              <div className="space-y-4">
                {/* Map Component */}
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <SimpleMapComponent
                    requests={availableRequests}
                    height="600px"
                  />
                </div>
                {/* Map Legend */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center text-lg">
                    <span className="mr-2 text-xl">🗺️</span>
                    Map Legend
                  </h4>
                  <div className="flex flex-wrap gap-6 text-base">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 font-medium">
                        Emergency Requests
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 font-medium">
                        Regular Requests
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 font-medium">
                        Your Location
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
                <BloodRequestCarousel
                  requests={availableRequests}
                  onSendOffer={handleSendOffer}
                  onOpenChat={handleOpenChat}
                  onGetDirections={handleGetDirections}
                  getDistanceInfo={getDistanceInfo}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMyRequests = () => (
    <MyRequestsCarousel
      myRequests={myRequests}
      onOpenChat={handleOpenChat}
      onAcceptOffer={handleAcceptOffer}
      navigate={router.push}
      allowMultipleRequests={true}
      user={currentUser}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
          <LoadingSpinner
            size="lg"
            color="red"
            message="Loading your blood donation dashboard..."
          />
          <p className="mt-4 text-white/80 font-medium">
            Preparing your personalized dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden"
      ref={containerRef}
    >
      {/* Clear Floating Alert Banner */}
      {activeTab === "browse" &&
        requests.filter(
          (req) =>
            !requestsWithOffers.has(req._id) &&
            req.requester?._id !== currentUser?._id
        ).length > 0 && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white border-2 border-red-600 rounded-lg px-4 py-2 shadow-lg max-w-md">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-lg">🚨</span>
                  <h3 className="font-bold text-sm">URGENT BLOOD REQUESTS</h3>
                  <span className="text-lg">🩸</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="bg-white/20 rounded px-2 py-1">
                    <span className="font-bold text-sm">
                      {
                        requests.filter(
                          (req) =>
                            !requestsWithOffers.has(req._id) &&
                            req.requester?._id !== currentUser?._id
                        ).length
                      }
                    </span>
                    <span className="text-xs ml-1">waiting</span>
                  </div>
                  <button
                    onClick={() => {
                      const browseSectionElement =
                        document.querySelector(".bg-white\\/95");
                      if (browseSectionElement) {
                        browseSectionElement.scrollIntoView({
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3 py-1 rounded transition-all duration-300"
                  >
                    VIEW ⬇️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Clear Floating Action Button */}
      {activeTab === "browse" &&
        requests.filter(
          (req) =>
            !requestsWithOffers.has(req._id) &&
            req.requester?._id !== currentUser?._id
        ).length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => {
                const browseSectionElement =
                  document.querySelector(".bg-white\\/95");
                if (browseSectionElement) {
                  browseSectionElement.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-3 rounded-full shadow-lg transition-all duration-300 border-2 border-red-600"
              title="Quick access to blood requests"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🩸</span>
                <div className="text-left">
                  <div className="text-xs font-bold">BLOOD NEEDED</div>
                  <div className="text-xs">
                    {
                      requests.filter(
                        (req) =>
                          !requestsWithOffers.has(req._id) &&
                          req.requester?._id !== currentUser?._id
                      ).length
                    }{" "}
                    Requests
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

      {/* Subtle Background Elements */}
      <div
        ref={plasmaContainerRef}
        className="absolute inset-0 pointer-events-none opacity-30"
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={`plasma-${i}`}
            className="plasma-particle absolute rounded-full"
            style={{
              width: Math.random() * 200 + 50 + "px",
              height: Math.random() * 200 + 50 + "px",
              background: `radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)`,
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 30 + 40}s infinite linear`,
            }}
          />
        ))}

        {/* Subtle floating elements */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`blood-cell-${i}`}
            className="absolute opacity-10 text-2xl"
            style={{
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 25 + 30}s infinite linear`,
              animationDelay: Math.random() * 10 + "s",
            }}
          >
            🩸
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="relative z-10">
        <div
          className="glass-header backdrop-blur-xl border-b border-white/20"
          ref={headerRef}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* User Welcome Section */}
              <div className="flex items-center space-x-4">
                <div
                  className="glass-card w-16 h-16 rounded-full flex items-center justify-center glass-interactive cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => router.push("/dashboard")}
                  title="Go to Dashboard"
                >
                  <img
                    src="/ChatGPT-Image-Jun-27_-2025_-10_06_09-PM.svg"
                    alt="Blood Donation App"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <span className="text-red-300 text-2xl font-bold hidden">
                    🩸
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Welcome back, {currentUser?.name}!
                    <span className="ml-2 animate-pulse">👋</span>
                  </h1>
                  <p className="text-white/70 text-sm font-medium">
                    {currentUser?.userType === "hospital"
                      ? "Hospital Dashboard"
                      : "Donor Dashboard"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {/* Admin Button - only show for admin users */}
                {(currentUser?.email === "angad.28.03.2005@gmail.com" ||
                  currentUser?.isAdmin) && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="glass-button px-4 py-2 text-orange-300 hover:text-orange-200 transition-colors border border-orange-400/50"
                    title="Admin Panel"
                  >
                    <span className="mr-2">👨‍💼</span>
                    Admin
                  </button>
                )}

                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white transition-colors"
                  title="Keyboard Shortcuts (H)"
                >
                  <span className="mr-2">⌨️</span>
                  Shortcuts
                </button>

                <button
                  onClick={() => router.push("/profile")}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  <span className="mr-2">⚙️</span>
                  Settings
                </button>

                <button
                  onClick={async () => {
                    console.log("Logout button clicked", {
                      hasLogout: !!logout,
                      hasSignOut: !!signOut,
                      user: user?.name,
                      session: session?.user?.email,
                    });

                    try {
                      // Clear both authentication systems
                      if (logout) {
                        console.log("Calling AuthContext logout");
                        logout(true); // logout from all tabs
                      }

                      // Also sign out from NextAuth
                      if (signOut) {
                        console.log("Calling NextAuth signOut");
                        await signOut({ redirect: false });
                      }

                      // Force clear all storage
                      console.log("Clearing all storage");
                      sessionStorage.clear();
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      localStorage.removeItem("activeTabs");

                      // Clear any potential NextAuth cookies by clearing entire localStorage
                      try {
                        Object.keys(localStorage).forEach((key) => {
                          if (
                            key.includes("next-auth") ||
                            key.includes("auth")
                          ) {
                            localStorage.removeItem(key);
                          }
                        });
                      } catch (e) {
                        console.log(
                          "Error clearing auth-related localStorage:",
                          e
                        );
                      }

                      console.log("Logout complete, navigating to login");
                      // Navigate directly to login
                      window.location.href = "/login";
                    } catch (error) {
                      console.error("Logout error:", error);
                      // Force clear everything and navigate
                      sessionStorage.clear();
                      try {
                        localStorage.clear();
                      } catch (e) {
                        console.log("Could not clear localStorage:", e);
                      }
                      window.location.href = "/login";
                    }
                  }}
                  className="glass-button px-4 py-2 text-red-300 hover:text-red-200 transition-colors"
                >
                  <span className="mr-2">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Ribbon */}
        <div
          className="relative bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 backdrop-blur-md border-b border-white/10"
          ref={ribbonRef}
        >
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-1" ref={tabsRef}>
              {[
                {
                  id: "browse",
                  label: "Browse Requests",
                  icon: "🔍",
                  shortcut: "1",
                  color: "from-blue-500/20 to-cyan-500/20",
                },
                {
                  id: "my-requests",
                  label: "My Requests",
                  icon: "📋",
                  shortcut: "2",
                  color: "from-purple-500/20 to-pink-500/20",
                },
                {
                  id: "my-offers",
                  label: "My Offers",
                  icon: "💌",
                  shortcut: "3",
                  color: "from-green-500/20 to-teal-500/20",
                },
                {
                  id: "accepted",
                  label: "Accepted Offers",
                  icon: "✅",
                  shortcut: "4",
                  color: "from-orange-500/20 to-red-500/20",
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => animateTabTransition(tab.id)}
                    className={`relative px-6 py-4 font-semibold text-sm flex items-center transition-all duration-300 ease-out group rounded-t-xl ${
                      isActive
                        ? "glass-card-primary text-white transform -translate-y-1 scale-105 shadow-xl"
                        : "glass-card text-white/70 hover:text-white hover:scale-102 glass-interactive"
                    }`}
                    title={`${tab.label} (Press ${tab.shortcut})`}
                  >
                    {/* Active Tab Glow */}
                    {isActive && (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${tab.color} rounded-t-xl opacity-30`}
                      />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center space-x-3 z-10">
                      <span
                        className={`text-lg transition-all duration-200 ${
                          isActive
                            ? "scale-110 neon-glow"
                            : "group-hover:scale-105"
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span className="font-semibold whitespace-nowrap">
                        {tab.label}
                      </span>

                      {/* Keyboard Shortcut Badge */}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 ${
                          isActive
                            ? "glass-card-primary text-white shadow-lg"
                            : "glass-card text-white/60 group-hover:text-white/80"
                        }`}
                      >
                        {tab.shortcut}
                      </span>
                    </div>

                    {/* Active Tab Indicator */}
                    {isActive && (
                      <div className="active-tab-indicator absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-b-xl neon-glow" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-6 py-8"
        ref={mainContentRef}
      >
        {/* Quick Stats with Enhanced Glass Design */}
        <div className="mb-8" ref={quickStatsRef}>
          <QuickStats
            requests={requests}
            myRequests={myRequests}
            myOffers={myOffers}
          />
        </div>

        {/* Tab Content with Glass Container */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {activeTab === "browse" && (
            <div className="p-6">{renderBloodRequests()}</div>
          )}
          {activeTab === "my-requests" && (
            <div className="p-6">{renderMyRequests()}</div>
          )}
          {activeTab === "my-offers" && (
            <div className="p-6">
              <MyOffersCarousel
                myOffers={myOffers}
                onOpenChat={handleOpenChat}
                navigate={router.push}
              />
            </div>
          )}
          {activeTab === "accepted" && (
            <div className="p-6">
              <AcceptedOffersCarousel
                acceptedOffers={acceptedOffers}
                onOpenChat={handleOpenChat}
                onGetDirections={handleGetDirections}
              />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Modals */}
      <SendOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        bloodRequest={selectedRequest}
        onOfferSent={handleOfferSent}
      />

      <ChatComponent
        bloodRequest={selectedChatRequest}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        user={currentUser}
      />
    </div>
  );
};

export default Dashboard;
