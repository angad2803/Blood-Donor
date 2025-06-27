import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import SendOfferModal from "../components/SendOfferModal";
import AcceptedOffers from "../components/AcceptedOffers";
import LoadingSpinner from "../components/LoadingSpinner";
import QuickStats from "../components/QuickStats";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";
import ChatComponent from "../components/ChatComponent";
import BloodRequestCarousel from "../components/BloodRequestCarousel";
import mapsDirectionsService from "../utils/mapsDirectionsService";
import { toast } from "react-toastify";
import { gsap } from "gsap";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("browse"); // browse, my-requests, my-offers, accepted
  const [loading, setLoading] = useState(true);
  const [requestsWithOffers, setRequestsWithOffers] = useState(new Set()); // Track requests user has sent offers for

  // GSAP Refs
  const cardsRef = useRef([]);
  const tabsRef = useRef(null);
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
      await Promise.all([fetchRequests(), fetchMyRequests(), fetchMyOffers()]);
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
    fetchRequests(); // Refresh available requests to reflect the change
    setShowOfferModal(false);
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await api.post(`/offer/accept/${offerId}`);
      fetchMyRequests(); // Refresh requests
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

  const renderBloodRequests = () => {
    const availableRequests = requests.filter(
      (req) => !requestsWithOffers.has(req._id)
    );

    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <BloodRequestCarousel
            requests={availableRequests}
            onSendOffer={handleSendOffer}
            onOpenChat={handleOpenChat}
            getDistanceInfo={getDistanceInfo}
          />
        </div>
      </div>
    );
  };

  const renderMyRequests = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            My Blood Requests
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your blood requests and offers
          </p>
        </div>
        <button
          onClick={() => navigate("/create-request")}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
        >
          <span className="mr-2">+</span>
          Create Request
        </button>
      </div>
      <div className="p-6">
        {myRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 mb-4">
              You haven't created any blood requests yet
            </p>
            <button
              onClick={() => navigate("/create-request")}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              Create Your First Blood Request
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {myRequests.map((req) => (
              <div
                key={req._id}
                ref={(el) => {
                  if (el && !cardsRef.current.includes(el)) {
                    cardsRef.current.push(el);
                  }
                }}
                className="blood-card border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-red-600 flex items-center">
                      <span className="mr-2">🩸</span>
                      {req.bloodGroup} Blood Request
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created on: {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      req.fulfilled
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {req.fulfilled ? "Fulfilled" : "Active"}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Location:</strong> {req.location}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Urgency:</strong> {req.urgency}
                  </p>
                </div>

                {/* Chat Button for My Requests */}
                <div className="mb-4">
                  <button
                    onClick={() => handleOpenChat(req)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
                  >
                    <span className="mr-2">💬</span>
                    Open Chat Room
                    {req.offers && req.offers.length > 0 && (
                      <span className="ml-2 bg-blue-500 text-xs px-2 py-1 rounded-full">
                        {req.offers.length} potential helpers
                      </span>
                    )}
                  </button>
                </div>

                {req.offers && req.offers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">
                      Offers Received ({req.offers.length})
                    </h4>
                    <div className="space-y-3">
                      {req.offers.map((offer) => (
                        <div
                          key={offer._id}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                {offer.donor?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Blood Group: {offer.donor?.bloodGroup}
                              </p>
                              <p className="text-sm text-gray-600">
                                Location: {offer.donor?.location}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                offer.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : offer.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {offer.status.charAt(0).toUpperCase() +
                                offer.status.slice(1)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-700 italic mb-3">
                            "{offer.message}"
                          </p>

                          <p className="text-xs text-gray-500 mb-3">
                            Sent on:{" "}
                            {new Date(offer.createdAt).toLocaleDateString()}
                          </p>

                          {offer.status === "pending" && !req.fulfilled && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOffer(offer._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                              >
                                <span className="mr-1">✅</span>
                                Accept Offer
                              </button>
                              <button
                                onClick={() => handleOpenChat(req)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                              >
                                <span className="mr-1">💬</span>
                                Chat
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMyOffers = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          My Donation Offers
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Track your sent offers and their status
        </p>
      </div>
      <div className="p-6">
        {myOffers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💌</div>
            <p className="text-gray-500">
              You haven't sent any donation offers yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOffers.map((offer) => (
              <div
                key={offer._id}
                ref={(el) => {
                  if (el && !cardsRef.current.includes(el)) {
                    cardsRef.current.push(el);
                  }
                }}
                className="blood-card border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-red-600">
                      {offer.bloodRequest?.bloodGroup} Blood Donation Offer
                    </h3>
                    <p className="text-sm text-gray-600">
                      To: {offer.bloodRequest?.location}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      offer.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : offer.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {offer.status.charAt(0).toUpperCase() +
                      offer.status.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 italic mb-3">
                  "{offer.message}"
                </p>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p>
                      Sent: {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                    {offer.respondedAt && (
                      <p>
                        Responded:{" "}
                        {new Date(offer.respondedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Chat Button */}
                    <button
                      onClick={() => handleOpenChat(offer.bloodRequest)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-1"
                      title="Chat with requester"
                    >
                      <span>💬</span>
                      <span className="text-sm">Chat</span>
                    </button>

                    {/* Status-specific action */}
                    {offer.status === "accepted" && (
                      <div className="text-xs text-green-600 font-medium">
                        🎉 Accepted - Please coordinate with the requester
                      </div>
                    )}
                    {offer.status === "pending" && (
                      <div className="text-xs text-yellow-600 font-medium">
                        ⏳ Awaiting response
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

  useEffect(() => {
    // Initial animations
    gsap.from(mainContentRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: "power2.out",
    });

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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Main Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Blood Donation Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Connecting donors and recipients to save lives
                </p>
              </div>

              {/* User Info Card */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>

                  {/* User Details */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">
                          Blood Group:
                        </span>
                        <span className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          {user?.bloodGroup}
                        </span>
                      </div>
                    </div>

                    {/* Location Info */}
                    {user?.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-400">📍</span>
                        <span className="text-xs text-gray-500 truncate max-w-48">
                          {user.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Hospital-specific navigation */}
              {user?.isHospital && (
                <button
                  onClick={() => navigate("/hospital/requests")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                  title="Manage hospital blood requests"
                >
                  <span>🏥</span>
                  <span>Hospital Requests</span>
                </button>
              )}

              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Keyboard shortcuts (?)"
              >
                <span className="text-lg">⌨️</span>
              </button>

              {/* GSAP Demo Button */}
              <button
                onClick={() => navigate("/gsap-demo")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1 text-sm"
                title="View GSAP Animation Demo"
              >
                <span>🎨</span>
                <span>Animations</span>
              </button>

              {/* Admin Cleanup Button - Only show for admin users */}
              {user?.isAdmin && (
                <button
                  onClick={() => navigate("/admin-cleanup")}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-2 rounded-lg hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1 text-sm"
                  title="Admin Cleanup Tool"
                >
                  <span>🧹</span>
                  <span>Cleanup</span>
                </button>
              )}

              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
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
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => animateTabTransition(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center relative ${
                  activeTab === tab.id
                    ? tab.adminOnly
                      ? "border-purple-500 text-purple-600"
                      : "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                title={`${tab.label} (Press ${tab.shortcut})`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                <span
                  className={`ml-2 text-xs px-1 py-0.5 rounded opacity-60 ${
                    tab.adminOnly
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.shortcut}
                </span>
                {tab.adminOnly && (
                  <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-1 py-0.5 rounded">
                    ADMIN
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
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
        {activeTab === "my-offers" && renderMyOffers()}
        {activeTab === "accepted" && (
          <AcceptedOffers onOpenChat={handleOpenChat} />
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
