import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api.js";
import ChatComponent from "../../components/chat/ChatComponent";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import { gsap } from "gsap";

const HospitalRequests = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [filter, setFilter] = useState("all"); // all, urgent, critical

  // GSAP Refs
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const filterRef = useRef(null);

  // Redirect non-hospital users
  useEffect(() => {
    if (user && !user.isHospital) {
      navigate("/dashboard");
      toast.error("Access denied. This page is for hospitals only.");
      return;
    }
    if (user?.isHospital) {
      fetchRequests();
    }
  }, [user, navigate, fetchRequests]);

  // GSAP animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -50, rotationX: -15 },
        { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (filterRef.current) {
      gsap.fromTo(
        filterRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", delay: 0.3 }
      );
    }

    // Animate cards when they load
    setTimeout(() => {
      if (cardsRef.current.length > 0) {
        gsap.fromTo(
          cardsRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          }
        );
      }
    }, 100);

    // Add floating particles
    const particles = document.querySelectorAll(".hospital-particle");
    particles.forEach((particle) => {
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      });

      gsap.to(particle, {
        y: `+=${(Math.random() - 0.5) * 250}`,
        x: `+=${(Math.random() - 0.5) * 100}`,
        rotation: 360,
        duration: Math.random() * 30 + 35,
        repeat: -1,
        ease: "none",
      });
    });
  }, [requests]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/request/all");

      // Filter requests based on location proximity if hospital has location
      let filteredRequests = response.data.requests;

      if (user?.location) {
        // Prioritize requests in the same location as the hospital
        filteredRequests = response.data.requests.sort((a, b) => {
          const aMatch =
            a.location?.toLowerCase() === user.location?.toLowerCase();
          const bMatch =
            b.location?.toLowerCase() === user.location?.toLowerCase();

          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;

          // Sort by urgency for same location priority
          const urgencyOrder = {
            critical: 4,
            urgent: 3,
            high: 2,
            medium: 1,
            low: 0,
          };
          return (
            (urgencyOrder[b.urgency?.toLowerCase()] || 0) -
            (urgencyOrder[a.urgency?.toLowerCase()] || 0)
          );
        });
      }

      setRequests(filteredRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch blood requests");
    } finally {
      setLoading(false);
    }
  }, [user?.location]);

  const handleFulfillRequest = async (requestId) => {
    try {
      await api.put(`/request/${requestId}/fulfill`, {
        fulfilledBy: user._id,
        hospitalName: user.hospitalName,
      });

      toast.success("🎉 Blood request marked as fulfilled successfully!");
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error fulfilling request:", error);
      toast.error(error.response?.data?.message || "Failed to fulfill request");
    }
  };

  const handleOpenChat = (request) => {
    setSelectedChatRequest(request);
    setShowChatModal(true);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "glass-card-danger text-red-200";
      case "urgent":
        return "glass-card text-orange-200 border-orange-400/30";
      case "high":
        return "glass-card text-yellow-200 border-yellow-400/30";
      case "medium":
        return "glass-card-primary text-blue-200";
      default:
        return "glass-card text-white/80";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.urgency?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen plasma-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4 neon-glow">🏥</div>
          <p className="text-white/80 text-lg">Loading blood requests...</p>
          <div className="loading-pulse mt-4">⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen plasma-bg relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle hospital-particle"
            style={{
              width: Math.random() * 7 + 4 + "px",
              height: Math.random() * 7 + 4 + "px",
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 20 + "s",
              animationDuration: Math.random() * 15 + 25 + "s",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div
          className="glass-header backdrop-blur-xl border-b border-white/20"
          ref={headerRef}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              {/* Main Title */}
              <div className="flex items-center space-x-4">
                <div className="glass-card w-16 h-16 rounded-full flex items-center justify-center glass-interactive">
                  <span className="text-3xl neon-glow">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 neon-glow">
                    Hospital Blood Requests
                  </h1>
                  <p className="text-white/70 text-sm">
                    Manage and fulfill blood requests in your area
                  </p>
                </div>
              </div>

              {/* Hospital Info Card */}
              <div className="glass-card-primary p-4 flex items-center space-x-4">
                <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.hospitalName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">
                      {user?.hospitalName}
                    </span>
                  </div>
                  {user?.location && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-blue-300">📍</span>
                      <span className="text-blue-200 text-sm truncate max-w-48">
                        {user.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  <span className="mr-2">🏠</span>
                  Dashboard
                </button>
                <button
                  onClick={logout}
                  className="glass-button px-4 py-2 text-red-300 hover:text-red-200 transition-colors"
                >
                  <span className="mr-2">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="glass-card p-6 mb-8" ref={filterRef}>
          <div className="flex items-center space-x-4">
            <span className="text-white/80 font-medium">
              Filter by urgency:
            </span>
            {[
              { id: "all", label: "All Requests", variant: "glass-card" },
              {
                id: "critical",
                label: "Critical",
                variant: "glass-card-danger",
              },
              { id: "urgent", label: "Urgent", variant: "glass-card" },
              { id: "high", label: "High", variant: "glass-card-primary" },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 glass-interactive ${
                  filter === filterOption.id
                    ? `${filterOption.variant} scale-105 ring-2 ring-white/30`
                    : "glass-card hover:scale-105"
                } text-white/90 hover:text-white`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="glass-card p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 neon-glow">
              Blood Requests ({filteredRequests.length})
            </h2>
            <p className="text-white/70">
              Active blood requests requiring hospital attention
            </p>
          </div>
          <div className="space-y-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 neon-glow">🩺</div>
                <p className="text-white/60 text-lg">
                  {filter === "all"
                    ? "No blood requests found"
                    : `No ${filter} priority requests found`}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  Check back later or adjust your filters
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRequests.map((request, index) => (
                  <div
                    key={request._id}
                    className={`glass-card p-6 glass-interactive ${
                      request.location?.toLowerCase() ===
                      user?.location?.toLowerCase()
                        ? "ring-2 ring-blue-400/30 glass-card-primary"
                        : ""
                    }`}
                    ref={(el) => (cardsRef.current[index] = el)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center glass-card-danger p-3 rounded-lg">
                          <div className="text-2xl font-bold text-red-200 neon-glow">
                            {request.bloodGroup}
                          </div>
                          <div className="text-xs text-red-300/80">
                            Blood Type
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Request #{request._id.slice(-6)}
                          </h3>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white/80">
                              📍 {request.location}
                            </span>
                            {request.location?.toLowerCase() ===
                              user?.location?.toLowerCase() && (
                              <span className="glass-card-primary px-2 py-0.5 rounded-full text-blue-200 text-xs">
                                Same Location
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">
                              Requested by: {request.requester?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(
                            request.urgency
                          )} ${request.urgency?.toLowerCase() === "critical" ? "heartbeat" : ""}`}
                        >
                          {request.urgency?.toUpperCase() || "NORMAL"}
                        </span>
                        <div className="text-right text-xs text-white/40">
                          <div>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/20">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenChat(request)}
                          className="glass-button px-4 py-2 text-blue-300 hover:text-blue-200 transition-colors flex items-center space-x-2"
                        >
                          <span>💬</span>
                          <span>Contact</span>
                        </button>

                        {!request.fulfilled && (
                          <button
                            onClick={() => handleFulfillRequest(request._id)}
                            className="glass-button px-4 py-2 text-green-300 hover:text-green-200 transition-colors flex items-center space-x-2 glass-interactive"
                          >
                            <span>✅</span>
                            <span>Fulfill</span>
                          </button>
                        )}
                      </div>

                      {request.fulfilled && (
                        <div className="glass-card-success px-4 py-2 rounded-lg text-green-300 font-medium flex items-center space-x-1">
                          <span>✅</span>
                          <span>Fulfilled</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatComponent
        bloodRequest={selectedChatRequest}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
};

export default HospitalRequests;
