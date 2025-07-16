import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import GPSSetupPrompt from "../components/GPSSetupPrompt";
import { gpsLocationService } from "../utils/gpsLocationService";
import { gsap } from "gsap";

const CompleteProfile = () => {
  const { loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: "",
    location: "",
    isDonor: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGPSPrompt, setShowGPSPrompt] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // GSAP Refs
  const formRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    // Enhanced entrance animations
    const tl = gsap.timeline();

    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
    ).fromTo(
      formRef.current,
      { opacity: 0, scale: 0.9, rotationY: -10 },
      { opacity: 1, scale: 1, rotationY: 0, duration: 0.8, ease: "power2.out" },
      "-=0.6"
    );

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

    // Auto-capture location when component mounts
    captureLocation();
  }, []);

  const captureLocation = async () => {
    if (!gpsLocationService.isSupported()) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    try {
      const result = await gpsLocationService.captureLocationAutomatically(
        "complete profile setup",
        false
      );

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          location:
            result.city ||
            result.address ||
            `${result.latitude?.toFixed(4)}, ${result.longitude?.toFixed(4)}`,
        }));
        setLocationError("");
      } else {
        setLocationError(result.error || "Failed to capture location");
      }
    } catch (error) {
      setLocationError("Location capture failed: " + error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await api.put("/users/complete-profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = response.data.user;
      loginWithToken(updatedUser, token);

      // Show GPS prompt if successful
      setShowGPSPrompt(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleGPSPromptClose = () => {
    setShowGPSPrompt(false);
    navigate("/dashboard");
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use the server's reverse geocoding endpoint
          const token = localStorage.getItem("token");
          const response = await api.post(
            "/users/reverse-geocode",
            { latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            const location = response.data.data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData({ ...formData, location });
          } else {
            // Fallback to coordinates
            const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData({ ...formData, location });
          }
          setLocationLoading(false);
          setLocationError("");
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          // Fallback to coordinates if reverse geocoding fails
          const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData({ ...formData, location });
          setLocationLoading(false);
          setLocationError("");
        }
      },
      (error) => {
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      }
    );
  };

  return (
    <>
      {/* Background Particles */}
      <div className="complete-particle fixed w-2 h-2 bg-purple-400/20 rounded-full pointer-events-none"></div>
      <div className="complete-particle fixed w-3 h-3 bg-blue-400/20 rounded-full pointer-events-none"></div>
      <div className="complete-particle fixed w-1 h-1 bg-pink-400/30 rounded-full pointer-events-none"></div>
      <div className="complete-particle fixed w-2 h-2 bg-green-400/20 rounded-full pointer-events-none"></div>
      <div className="complete-particle fixed w-3 h-3 bg-yellow-400/20 rounded-full pointer-events-none"></div>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-blue-100/40 to-pink-100/40"></div>
        
        <div className="relative max-w-md w-full space-y-8">
          {/* Header */}
          <div ref={headerRef} className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-3xl">👤</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-gray-600">
              Help us serve you better by completing your profile
            </p>
          </div>

          {/* Form */}
          <div
            ref={formRef}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Location
                </label>
                <div className="flex gap-2">
                  <input
                    name="location"
                    type="text"
                    placeholder="Enter your city/location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        <span className="hidden sm:inline">Getting...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="hidden sm:inline">GPS</span>
                      </>
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="text-red-500 text-sm mt-2">{locationError}</p>
                )}
                {locationLoading && (
                  <p className="text-blue-500 text-sm mt-2">📍 Detecting your location...</p>
                )}
              </div>

              {/* Donor Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  name="isDonor"
                  type="checkbox"
                  checked={formData.isDonor}
                  onChange={handleChange}
                  className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  I want to register as a blood donor
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-3"></div>
                    Updating Profile...
                  </span>
                ) : (
                  <span>
                    <span className="mr-2">✅</span>
                    Complete Profile
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* GPS Setup Prompt for New Users */}
      {showGPSPrompt && (
        <GPSSetupPrompt
          onClose={handleGPSPromptClose}
          isNewUser={true}
          canDismiss={true}
          title="🎉 Profile Complete! Set Up GPS?"
          description="Unlock powerful location-based blood donation features!"
        />
      )}
    </>
  );
};

export default CompleteProfile;
