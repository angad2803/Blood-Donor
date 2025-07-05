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
          coordinates: { coordinates: [-74.006, 40.7128] },
        },
        {
          _id: "2",
          bloodGroup: "A+",
          urgency: "medium",
          location: "City Medical Center",
          patientName: "Jane Smith",
          contactNumber: "098-765-4321",
          coordinates: { coordinates: [-73.9857, 40.7484] },
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
        },
        {
          _id: "offer2",
          status: "accepted",
          bloodGroup: "A+",
          location: "Another Location",
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
      await Promise.allSettled([
        fetchRequests(),
        fetchMyRequests(),
        fetchMyOffers(),
        fetchAcceptedOffers(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Event handlers
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
    toast.success("🎉 Offer sent successfully!");
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

  const handleCreateRequest = () => {
    router.push("/create-request");
  };

  const handleLogout = async () => {
    if (session) {
      await signOut({ redirect: false });
    }
    if (logout) {
      logout();
    }
    router.push("/login");
  };

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
            cardsRef.current = [];
            setTimeout(animateCards, 50);
          },
        });
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
      }

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

  // Enhanced render functions
  const renderBloodRequests = () => {
    const availableRequests = requests.filter(
      (req) =>
        !requestsWithOffers.has(req._id) &&
        req.requester?._id !== currentUser?._id
    );

    return (
      <div className="relative">
        {/* Enhanced Alert Banner */}
        <div className="relative mb-8 bg-white/95 backdrop-blur-xl border-2 border-red-500/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-pink-50/50"></div>

          <div className="relative px-8 py-6">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <div className="flex items-center space-x-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl px-6 py-3">
                  <span className="text-3xl emergency-pulse">🚨</span>
                  <h2 className="text-2xl font-bold text-red-800">
                    URGENT BLOOD REQUESTS
                  </h2>
                  <span className="text-3xl emergency-pulse">🩸</span>
                </div>
              </div>

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

        {/* Request Cards Container */}
        <div className="relative bg-white/95 backdrop-blur-xl border-2 border-gray-300 rounded-2xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/50"></div>

          {/* View Toggle Header */}
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

              {/* View Toggle Buttons */}
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
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <SimpleMapComponent
                    bloodRequests={availableRequests}
                    onRequestSelect={handleOpenChat}
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
                  onGetDirections={(request) => {
                    if (request.coordinates) {
                      const [lng, lat] = request.coordinates.coordinates;
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                        "_blank"
                      );
                    }
                  }}
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

  // Enhanced page entrance animations
  useEffect(() => {
    const tl = gsap.timeline();

    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0 });
    }

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
      });
    }

    fetchData();
  }, [fetchData]);

  // Animate cards when data loads
  useEffect(() => {
    if (!loading && requests.length > 0) {
      setTimeout(() => {
        animateCards();
        animateEmergencyPulse();
      }, 100);
    }
  }, [loading, requests, myRequests, myOffers, activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
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
          if (e.ctrlKey || e.metaKey) return;
          handleCreateRequest();
          break;
        case "?":
          setShowShortcutsModal(!showShortcutsModal);
          break;
        case "Escape":
          setShowShortcutsModal(false);
          setShowOfferModal(false);
          setShowChatModal(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showShortcutsModal]);

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
      {/* Floating Alert Banner */}
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
                </div>
              </div>
            </div>
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
            className="absolute rounded-full plasma-particle"
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
                  <span className="text-red-300 text-2xl font-bold">🩸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Welcome back, {currentUser?.name || "User"}!
                    <span className="ml-2 animate-pulse">👋</span>
                  </h1>
                  <p className="text-white/70 text-sm font-medium">
                    {currentUser?.isHospital
                      ? "Hospital Dashboard"
                      : currentUser?.isDonor
                        ? "Donor Dashboard"
                        : "User Dashboard"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {/* Admin Button */}
                {currentUser?.email === "angad.28.03.2005@gmail.com" && (
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
                  title="Keyboard Shortcuts"
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
                  onClick={handleLogout}
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
        {/* Quick Stats */}
        <div className="mb-8" ref={quickStatsRef}>
          <QuickStats
            requests={requests}
            myRequests={myRequests}
            myOffers={myOffers}
          />
        </div>

        {/* Tab Content */}
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
                onGetDirections={(request) => {
                  if (request.coordinates) {
                    const [lng, lat] = request.coordinates.coordinates;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                      "_blank"
                    );
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 space-y-4">
          <button
            onClick={handleCreateRequest}
            className="glass-button w-14 h-14 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 shadow-lg"
            title="Create New Request"
          >
            ➕
          </button>
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="glass-button w-14 h-14 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-all duration-300 shadow-lg"
            title="Keyboard Shortcuts"
          >
            ⌨️
          </button>
        </div>
      </div>

      {/* Modals */}
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
