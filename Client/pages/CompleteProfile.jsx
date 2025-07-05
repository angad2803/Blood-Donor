import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import GPSSetupPrompt from "../components/GPSSetupPrompt";
import { gpsLocationService } from "../utils/gpsLocationService";
import { gsap } from "gsap";

const CompleteProfile = () => {
  const { user, loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();

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
        setLocationData(result);
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

      await api.put("/user/profile", profileData);

      // Update user context with new data
      const updatedUser = { ...user, ...profileData };
      const token = localStorage.getItem("token");
      loginWithToken(token, updatedUser);

      // Show GPS setup prompt for new users
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden flex items-center justify-center">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 300 + 100 + "px",
                height: Math.random() * 300 + 100 + "px",
                background: `radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)`,
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                animation: `float ${Math.random() * 20 + 30}s infinite linear`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-2xl px-6">
          {/* Header Section */}
          <div className="text-center mb-8" ref={headerRef}>
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-5xl">👤</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Complete Your Profile
            </h1>
            <p className="text-white/70 text-lg max-w-md mx-auto">
              Please provide your blood group and location to help us match you
              with blood donation requests.
            </p>
          </div>

          {/* Form Card */}
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
            ref={formRef}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/90 font-medium mb-3 text-sm">
                  Blood Group *
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-white">
                    Select Blood Group
                  </option>
                  <option value="A+" className="bg-gray-800 text-white">
                    A+
                  </option>
                  <option value="A-" className="bg-gray-800 text-white">
                    A-
                  </option>
                  <option value="B+" className="bg-gray-800 text-white">
                    B+
                  </option>
                  <option value="B-" className="bg-gray-800 text-white">
                    B-
                  </option>
                  <option value="AB+" className="bg-gray-800 text-white">
                    AB+
                  </option>
                  <option value="AB-" className="bg-gray-800 text-white">
                    AB-
                  </option>
                  <option value="O+" className="bg-gray-800 text-white">
                    O+
                  </option>
                  <option value="O-" className="bg-gray-800 text-white">
                    O-
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-white/90 font-medium mb-3 text-sm">
                  Location *
                </label>

                {/* Location Capture Section - Similar to screenshot */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white/70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2">
                    Enable Location Access
                  </h3>
                  <p className="text-white/60 text-sm mb-4 max-w-sm mx-auto">
                    Help us match you with nearby blood donation requests by
                    sharing your location. This allows us to:
                  </p>

                  <div className="space-y-2 text-sm text-white/70 mb-6">
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Find nearby blood requests
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Show relevant donors in your area
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Calculate accurate distances
                    </div>
                  </div>

                  {/* Location Status */}
                  {locationLoading && (
                    <div className="flex items-center justify-center space-x-2 text-white/70">
                      <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full"></div>
                      <span>Capturing location...</span>
                    </div>
                  )}

                  {locationData && !locationLoading && (
                    <div className="text-green-300 font-medium">
                      ✅ Location captured successfully
                      <div className="text-sm text-white/60 mt-1">
                        {formData.location}
                      </div>
                    </div>
                  )}

                  {locationError && !locationLoading && (
                    <div className="text-orange-300">
                      <div className="font-medium">⚠️ {locationError}</div>
                      <button
                        type="button"
                        onClick={captureLocation}
                        className="mt-2 text-sm underline hover:no-underline transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  <p className="text-white/40 text-xs mt-4">
                    Your location is only used for matching purposes and is
                    never shared with third parties.
                  </p>
                </div>

                {/* Fallback manual input */}
                <div className="mt-4">
                  <input
                    name="location"
                    type="text"
                    placeholder="Or enter your location manually"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    name="isDonor"
                    type="checkbox"
                    checked={formData.isDonor}
                    onChange={handleChange}
                    className="h-5 w-5 accent-purple-400 rounded border-white/30 bg-white/10"
                  />
                  <span className="text-white/90 font-medium">
                    I want to register as a blood donor
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 text-red-300">
                  {error}
                </div>
              )}

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
