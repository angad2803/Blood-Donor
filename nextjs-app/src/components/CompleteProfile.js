// CompleteProfile.js
"use client";

import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import GPSSetupPrompt from "./GPSSetupPrompt";

const CompleteProfile = () => {
  const { user, loginWithToken } = useContext(AuthContext);
  const router = useRouter();

  const [formData, setFormData] = useState({
    bloodGroup: "",
    location: "",
    isDonor: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGPSPrompt, setShowGPSPrompt] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // GSAP Refs
  const formRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const animateElements = async () => {
      if (typeof window !== "undefined") {
        try {
          const { gsap } = await import("gsap");

          // Enhanced entrance animations
          const tl = gsap.timeline();

          if (headerRef.current) {
            tl.fromTo(
              headerRef.current,
              { opacity: 0, y: -30, scale: 0.9 },
              { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
            );
          }

          if (formRef.current) {
            tl.fromTo(
              formRef.current,
              { opacity: 0, scale: 0.9, rotationY: -10 },
              {
                opacity: 1,
                scale: 1,
                rotationY: 0,
                duration: 0.8,
                ease: "power2.out",
              },
              "-=0.6"
            );
          }

          // Add floating particles
          const particles = document.querySelectorAll(".complete-particle");
          particles.forEach((particle) => {
            gsap.set(particle, {
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            });

            gsap.to(particle, {
              y: `+=${(Math.random() - 0.5) * 200}`,
              x: `+=${(Math.random() - 0.5) * 100}`,
              rotation: 360,
              duration: Math.random() * 25 + 30,
              repeat: -1,
              ease: "none",
            });
          });
        } catch (error) {
          console.log("GSAP not available, skipping animations");
        }
      }
    };

    animateElements();
    // Auto-capture location when component mounts
    captureLocation();
  }, []);

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationResult = {
          latitude,
          longitude,
          accuracy,
          coordinates: { latitude, longitude },
        };

        setLocationData(locationResult);
        setFormData((prev) => ({
          ...prev,
          location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        setLocationLoading(false);
      },
      (error) => {
        setLocationError("Location capture failed: " + error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profileData = { ...formData };

      // Include GPS coordinates if available
      if (locationData && locationData.coordinates) {
        profileData.coordinates = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        };
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update user context with new data
      const updatedUser = { ...user, ...profileData };
      const token = localStorage.getItem("token");
      loginWithToken(token, updatedUser);

      // Show GPS setup prompt for new users
      setShowGPSPrompt(true);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleGPSPromptClose = () => {
    setShowGPSPrompt(false);
    router.push("/dashboard");
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden flex items-center justify-center">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="complete-particle absolute rounded-full opacity-30"
              style={{
                width: Math.random() * 8 + 4 + "px",
                height: Math.random() * 8 + 4 + "px",
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 20 + "s",
                animationDuration: Math.random() * 20 + 20 + "s",
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full mb-6">
              <span className="text-4xl">👤</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-white/70 text-lg">
              Help us personalize your blood donation experience
            </p>
          </div>

          {/* Form */}
          <div
            ref={formRef}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Blood Group */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Blood Group *
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-white/20 backdrop-blur-lg border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Select your blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group} className="bg-gray-800">
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                    required
                    className="w-full p-3 bg-white/20 backdrop-blur-lg border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={locationLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                    title="Auto-detect location"
                  >
                    {locationLoading ? "📍" : "🌍"}
                  </button>
                </div>
                {locationLoading && (
                  <p className="text-blue-300 text-sm mt-1">
                    📍 Detecting location...
                  </p>
                )}
                {locationError && (
                  <p className="text-red-300 text-sm mt-1">{locationError}</p>
                )}
                {locationData && (
                  <p className="text-green-300 text-sm mt-1">
                    ✅ Location captured successfully
                  </p>
                )}
              </div>

              {/* Donor Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isDonor"
                  name="isDonor"
                  checked={formData.isDonor}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isDonor" className="text-white font-medium">
                  I want to be a blood donor
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-lg p-3">
                  <p className="text-red-300 text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Completing Profile...
                  </span>
                ) : (
                  "Complete Profile"
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 bg-blue-500/20 backdrop-blur-lg border border-blue-400/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">
                ℹ️ Why we need this information:
              </h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>
                  • Blood group helps us match you with compatible requests
                </li>
                <li>
                  • Location enables us to find nearby donation opportunities
                </li>
                <li>
                  • Donor status helps us prioritize notifications for you
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Setup Prompt */}
      {showGPSPrompt && (
        <GPSSetupPrompt
          onClose={handleGPSPromptClose}
          isNewUser={true}
          canDismiss={true}
          title="Welcome! Set Up GPS Location"
          description="Enhance your blood donation experience with location features"
        />
      )}
    </>
  );
};

export default CompleteProfile;
