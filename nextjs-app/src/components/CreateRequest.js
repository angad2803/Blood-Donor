"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { useSession, signOut } from "next-auth/react";
import api from "../api/api.js";
import { toast } from "react-toastify";
import { gsap } from "gsap";
import LoadingSpinner from "./LoadingSpinner";

const CreateRequest = () => {
  const { user, logout } = useContext(AuthContext);
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    bloodGroup: user?.bloodGroup || "",
    urgency: "normal",
    location: user?.location || "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // GSAP Refs
  const formRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const containerRef = useRef(null);
  const plasmaContainerRef = useRef(null);

  // Get current user from either AuthContext or NextAuth session
  const currentUser = user || session?.user;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/request/all");
        // Filter out the current user's own requests with comprehensive checking
        const filteredRequests = res.data.requests.filter((req) => {
          // Check multiple possible user identifier fields
          const currentUserId = currentUser?.id || currentUser?._id;
          const currentUserEmail = currentUser?.email;
          const currentUserName = currentUser?.name;

          // Log for debugging (remove in production)
          console.log("Filtering request:", {
            requestId: req._id,
            requester: req.requester,
            requesterEmail: req.requesterEmail,
            requesterName: req.requesterName,
            currentUser: {
              id: currentUserId,
              email: currentUserEmail,
              name: currentUserName,
            },
          });

          return (
            req.requester !== currentUserId &&
            req.requester?._id !== currentUserId &&
            req.requesterName !== currentUserName &&
            req.requesterEmail !== currentUserEmail &&
            req.createdBy !== currentUserId
          );
        });
        setRequests(filteredRequests);

        // Animate cards after data loads
        setTimeout(() => {
          if (cardsRef.current.length > 0) {
            gsap.fromTo(
              cardsRef.current,
              { opacity: 0, y: 50, scale: 0.9 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.15,
                ease: "power2.out",
              }
            );
          }
        }, 100);
      } catch (err) {
        console.error("Error fetching requests", err);
        // Add dummy data for development (not current user's requests)
        setRequests([
          {
            _id: "1",
            bloodGroup: "O+",
            location: "City Hospital",
            urgency: "critical",
            fulfilled: false,
            requesterName: "Other User",
          },
          {
            _id: "2",
            bloodGroup: "A+",
            location: "General Hospital",
            urgency: "normal",
            fulfilled: true,
            requesterName: "Another User",
          },
        ]);
      }
    };

    fetchRequests();

    // Enhanced initial page animations
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
        { opacity: 0, y: -50, rotationX: -15 },
        { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (formRef.current) {
      tl.fromTo(
        formRef.current,
        { opacity: 0, x: -50, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      );
    }

    // Add floating particles
    if (plasmaContainerRef.current) {
      const particles =
        plasmaContainerRef.current.querySelectorAll(".create-particle");
      particles.forEach((particle) => {
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });

        gsap.to(particle, {
          y: `+=${(Math.random() - 0.5) * 300}`,
          x: `+=${(Math.random() - 0.5) * 150}`,
          rotation: 360,
          duration: Math.random() * 25 + 30,
          repeat: -1,
          ease: "none",
        });
      });
    }
  }, [currentUser]);

  const markFulfilled = async (id) => {
    try {
      await api.put(`/request/${id}`, { fulfilled: true });
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, fulfilled: true } : req))
      );
      toast.success("Request marked as fulfilled!");
    } catch (err) {
      console.error("Error marking fulfilled", err);
      toast.error("Failed to mark request as fulfilled");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Try to get address from coordinates using reverse geocoding
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );

          if (response.ok) {
            const data = await response.json();
            const address =
              data.results[0]?.formatted || `${latitude}, ${longitude}`;
            setForm({ ...form, location: address });
            toast.success("Location captured successfully!");
          } else {
            // Fallback to coordinates
            setForm({ ...form, location: `${latitude}, ${longitude}` });
            toast.success("Location coordinates captured!");
          }
        } catch (error) {
          // Fallback to coordinates
          setForm({ ...form, location: `${latitude}, ${longitude}` });
          toast.success("Location coordinates captured!");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              "Location access denied. Please enable location permissions."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out.");
            break;
          default:
            toast.error("An error occurred while getting location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/request/create", {
        ...form,
        bloodType: form.bloodGroup, // Map bloodGroup to bloodType for API compatibility
        patientName: currentUser?.name || "Anonymous", // Use logged-in user's name
        requesterName: currentUser?.name || "Anonymous",
        hospitalName: "Not specified", // Default value
        contactNumber:
          currentUser?.contactNumber || currentUser?.email || "Not provided", // Use user's contact or email
        unitsNeeded: 1, // Default to 1 unit
      });
      setSuccess("Request created successfully!");
      toast.success("🎉 Blood request created successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to create request";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden"
      ref={containerRef}
    >
      {/* Animated Background Particles */}
      <div
        ref={plasmaContainerRef}
        className="absolute inset-0 pointer-events-none opacity-30"
      >
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="create-particle absolute rounded-full"
            style={{
              width: Math.random() * 8 + 5 + "px",
              height: Math.random() * 8 + 5 + "px",
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 15 + 25}s infinite linear`,
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
                  <span className="text-3xl neon-glow">🩸</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 neon-glow">
                    Create Blood Request
                  </h1>
                  <p className="text-white/70 text-sm">
                    Help save lives by requesting blood donations
                  </p>
                </div>
              </div>

              {/* User Info Card */}
              <div className="glass-card-danger p-4 flex items-center space-x-4">
                <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {currentUser?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">
                      {currentUser?.name}
                    </span>
                    <span className="glass-card-danger px-3 py-1 rounded-full text-red-200 font-semibold text-sm">
                      {currentUser?.bloodGroup || "Unknown"}
                    </span>
                  </div>
                  {currentUser?.location && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-red-300">📍</span>
                      <span className="text-red-200 text-sm">
                        {currentUser.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  <span className="mr-2">🏠</span>
                  Dashboard
                </button>
                <button
                  onClick={async () => {
                    console.log("Logout button clicked", {
                      hasLogout: !!logout,
                      hasSignOut: !!signOut,
                      currentUser: currentUser?.name,
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Create Request Form */}
        <div
          className="glass-card p-8 mb-8 border-2 border-white/30"
          ref={formRef}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-black text-white mb-3 neon-glow"
              style={{
                color: "#ffffff",
                fontWeight: "900",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              Quick Blood Request
            </h2>
            <p
              className="text-white font-bold text-lg"
              style={{
                color: "#ffffff",
                fontWeight: "700",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              Fill out the essential details to create your blood request
              quickly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-white font-black mb-3 text-lg"
                  style={{
                    color: "#ffffff",
                    fontWeight: "900",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  Blood Group *
                </label>
                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-white border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 rounded-lg font-bold text-lg"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  <option value="" className="bg-gray-900 text-white font-bold">
                    Select Blood Group
                  </option>
                  <option
                    value="A+"
                    className="bg-gray-900 text-white font-bold"
                  >
                    A+
                  </option>
                  <option
                    value="A-"
                    className="bg-gray-900 text-white font-bold"
                  >
                    A-
                  </option>
                  <option
                    value="B+"
                    className="bg-gray-900 text-white font-bold"
                  >
                    B+
                  </option>
                  <option
                    value="B-"
                    className="bg-gray-900 text-white font-bold"
                  >
                    B-
                  </option>
                  <option
                    value="AB+"
                    className="bg-gray-900 text-white font-bold"
                  >
                    AB+
                  </option>
                  <option
                    value="AB-"
                    className="bg-gray-900 text-white font-bold"
                  >
                    AB-
                  </option>
                  <option
                    value="O+"
                    className="bg-gray-900 text-white font-bold"
                  >
                    O+
                  </option>
                  <option
                    value="O-"
                    className="bg-gray-900 text-white font-bold"
                  >
                    O-
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="block text-white font-black mb-3 text-lg"
                  style={{
                    color: "#ffffff",
                    fontWeight: "900",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  Urgency Level *
                </label>
                <select
                  name="urgency"
                  value={form.urgency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-white border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 rounded-lg font-bold text-lg"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  <option
                    value="normal"
                    className="bg-gray-900 text-white font-bold"
                  >
                    Normal
                  </option>
                  <option
                    value="urgent"
                    className="bg-gray-900 text-white font-bold"
                  >
                    Urgent
                  </option>
                  <option
                    value="critical"
                    className="bg-gray-900 text-white font-bold"
                  >
                    Critical
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                className="block text-white font-black mb-3 text-lg"
                style={{
                  color: "#ffffff",
                  fontWeight: "900",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                Location *
              </label>
              <div className="flex space-x-2">
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Enter hospital/clinic location"
                  required
                  className="flex-1 px-4 py-3 text-white border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 rounded-lg font-bold text-lg"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="px-4 py-3 text-white border-2 border-white/40 hover:border-white/60 transition-colors disabled:opacity-50 rounded-lg font-bold text-lg"
                  title="Get current location"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    "📍"
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                className="block text-white font-black mb-3 text-lg"
                style={{
                  color: "#ffffff",
                  fontWeight: "900",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional information about the request..."
                className="w-full px-4 py-3 text-white border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "#ffffff",
                  fontWeight: "700",
                }}
              />
            </div>

            {error && (
              <div
                className="p-4 text-white font-black rounded-lg border-2 text-lg"
                style={{
                  backgroundColor: "#7f1d1d",
                  borderColor: "#dc2626",
                  color: "#ffffff",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                ❌ {error}
              </div>
            )}

            {success && (
              <div
                className="p-4 text-white font-black rounded-lg border-2 text-lg"
                style={{
                  backgroundColor: "#14532d",
                  borderColor: "#16a34a",
                  color: "#ffffff",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-black text-xl rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/40"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.8)",
                color: "#ffffff",
                fontWeight: "900",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Request...
                </span>
              ) : (
                <span>
                  <span className="mr-2">🆘</span>
                  Create Blood Request
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Requests */}
        <div className="glass-card p-6">
          <h3
            className="text-xl font-bold text-white mb-6 neon-glow"
            style={{
              color: "#ffffff",
              fontWeight: "900",
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            Active Blood Requests
          </h3>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 neon-glow">🩸</div>
                <p
                  className="text-white font-black text-2xl"
                  style={{
                    color: "#ffffff",
                    fontWeight: "900",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  No active requests found
                </p>
              </div>
            ) : (
              requests.map((req, index) => (
                <div
                  key={req._id}
                  className="glass-card p-6 glass-interactive border-2 border-white/30"
                  ref={(el) => (cardsRef.current[index] = el)}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`px-4 py-2 rounded-full border-2 border-red-400 ${
                          req.urgency === "critical" ? "emergency-pulse" : ""
                        }`}
                        style={{
                          backgroundColor: "#7f1d1d",
                          borderColor: "#dc2626",
                        }}
                      >
                        <span
                          className="text-white font-black text-xl"
                          style={{
                            color: "#ffffff",
                            fontWeight: "900",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {req.bloodGroup}
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-white font-black text-lg"
                          style={{
                            color: "#ffffff",
                            fontWeight: "900",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          📍 {req.location}
                        </p>
                        <p
                          className="text-white font-bold text-base"
                          style={{
                            color: "#ffffff",
                            fontWeight: "700",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          ⚡ Urgency:{" "}
                          <span className="uppercase font-black">
                            {req.urgency}
                          </span>
                        </p>
                      </div>
                    </div>
                    {req.fulfilled ? (
                      <span
                        className="px-6 py-3 rounded-lg font-black text-lg border-2"
                        style={{
                          backgroundColor: "#14532d",
                          color: "#ffffff",
                          borderColor: "#16a34a",
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        ✔ Fulfilled
                      </span>
                    ) : (
                      <button
                        onClick={() => markFulfilled(req._id)}
                        className="px-6 py-3 rounded-lg font-black text-lg border-2 transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: "#14532d",
                          color: "#ffffff",
                          borderColor: "#16a34a",
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        Mark Fulfilled
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Information Box */}
        <div
          className="mt-8 glass-card p-6 border-2 border-white/30"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-start">
            <div className="text-blue-300 text-2xl mr-3">ℹ️</div>
            <div>
              <h3
                className="text-white font-black mb-3 text-xl"
                style={{
                  color: "#ffffff",
                  fontWeight: "900",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                Important Information
              </h3>
              <ul
                className="text-white font-bold text-base space-y-2"
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                <li>
                  • Your request will be visible to registered donors in your
                  area
                </li>
                <li>
                  • Donors can send offers to help with your blood request
                </li>
                <li>
                  • You can accept offers and coordinate directly with donors
                </li>
                <li>• Make sure all information is accurate and up-to-date</li>
                <li>• Emergency requests are prioritized and highlighted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
