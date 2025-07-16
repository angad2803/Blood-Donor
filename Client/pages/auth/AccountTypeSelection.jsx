import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import LocationCapture from "../components/maps/LocationCapture";
import { gpsLocationService } from "../utils/gpsLocationService";
import { gsap } from "gsap";

const AccountTypeSelection = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [hospitalDetails, setHospitalDetails] = useState({
    hospitalName: "",
    hospitalAddress: "",
    hospitalLicense: "",
  });
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [isDonor, setIsDonor] = useState(false);

  // GSAP Refs
  const formRef = useRef(null);
  const headerRef = useRef(null);

  // Override setLocation to prevent coordinates from being displayed
  const safeSetLocation = (newLocation) => {
    const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;
    if (
      typeof newLocation === "string" &&
      coordinatePattern.test(newLocation.trim())
    ) {
      console.log("Blocking coordinate display:", newLocation); // Debug log
      setLocation("Location captured");
    } else {
      setLocation(newLocation);
    }
  };
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  // Immediate cleanup of coordinates if they exist
  useEffect(() => {
    const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;
    if (location && coordinatePattern.test(location.trim())) {
      console.log("Immediate cleanup of coordinates:", location);
      setLocation("Location captured");
    }
  }, [location]); // Include location dependency

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setBloodGroup(user.bloodGroup || "");
      // Clean up location if it contains coordinates
      const userLocation = user.location || "";
      const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;

      console.log("User location:", userLocation); // Debug log

      if (coordinatePattern.test(userLocation.trim())) {
        console.log("Coordinates detected in user location, cleaning up"); // Debug log
        safeSetLocation("Location captured");
      } else if (userLocation) {
        safeSetLocation(userLocation);
      }
      setIsDonor(user.isDonor || false);
    }
  }, [user]);

  // Auto-capture location when component mounts
  useEffect(() => {
    const autoCapturLocation = async () => {
      if (!user?.coordinates?.coordinates?.[0]) {
        try {
          const result = await gpsLocationService.captureLocationAutomatically(
            "complete your profile setup",
            false // Don't show prompt initially, capture silently
          );

          if (result.success) {
            setLocationData(result);
            safeSetLocation(
              result.address ||
                result.city ||
                result.region ||
                "Location captured"
            );
            setLocationCaptured(true);
            toast.success("Location captured automatically!");
          } else {
            // If silent capture fails, show location capture component
            setShowLocationCapture(true);
          }
        } catch (error) {
          console.log("Auto location capture failed:", error);
          setShowLocationCapture(true);
        }
      }
    };

    // Small delay to let the component render first
    setTimeout(autoCapturLocation, 1000);
  }, [user]);

  // GSAP animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, scale: 0.9, rotationY: -10 },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
        }
      );
    }

    // Add floating particles
    const particles = document.querySelectorAll(".account-particle");
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        needsAccountTypeSelection: false,
        location: location || user?.location,
      };

      // Include GPS coordinates if available
      if (locationData && locationData.coordinates) {
        updateData.coordinates = {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          accuracy: locationData.coordinates.accuracy,
        };
      }

      if (selectedType === "hospital") {
        updateData.isHospital = true;
        updateData.isDonor = false;
        updateData.hospitalName = hospitalDetails.hospitalName;
        updateData.hospitalAddress = hospitalDetails.hospitalAddress;
        updateData.hospitalLicense = hospitalDetails.hospitalLicense;
        // Clear blood group for hospitals
        updateData.bloodGroup = undefined;
      } else {
        updateData.isHospital = false;
        updateData.isDonor = isDonor;
        updateData.bloodGroup = bloodGroup;
      }

      const res = await api.put("/user/profile", updateData);

      // Update user in context
      updateUser(res.data.user);

      toast.success("Account type set successfully!");

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        "Failed to update account type: " + (err.response?.data?.message || "")
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationCaptured = (capturedLocationData) => {
    setLocationData(capturedLocationData);
    safeSetLocation(
      capturedLocationData.address || capturedLocationData.formatted
    );
    setLocationCaptured(true);
    setShowLocationCapture(false);
    toast.success("Location captured successfully!");
  };

  const handleLocationSkipped = () => {
    setShowLocationCapture(false);
    toast.info(
      "Location capture skipped. You can enable it later in settings."
    );
  };

  const handleLocationFieldChange = async (e) => {
    const value = e.target.value;
    safeSetLocation(value);

    // Try to capture location when user starts typing
    if (
      value.length > 3 &&
      !locationCaptured &&
      gpsLocationService.isSupported()
    ) {
      try {
        const result = await gpsLocationService.captureLocationAutomatically(
          "enhance location accuracy",
          false
        );

        if (result.success) {
          setLocationData(result);
          setLocationCaptured(true);
        }
      } catch (error) {
        console.log("Background location capture failed:", error);
      }
    }
  };

  const handleManualLocationCapture = () => {
    setShowLocationCapture(true);
  };

  return (
    <div className="min-h-screen plasma-bg relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="particle account-particle"
            style={{
              width: Math.random() * 6 + 4 + "px",
              height: Math.random() * 6 + 4 + "px",
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 15 + "s",
              animationDuration: Math.random() * 12 + 20 + "s",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8" ref={headerRef}>
          <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 glass-interactive">
            <span className="text-4xl neon-glow">👋</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 neon-glow">
            Welcome, {user?.name}!
          </h1>
          <p className="text-white/70 text-lg">
            Please select your account type to continue
          </p>

          {/* Location Status */}
          {locationCaptured ? (
            <div className="mt-4 glass-card-success p-3 rounded-lg">
              <p className="text-sm text-green-200 flex items-center justify-center">
                <span className="mr-2">📍</span>
                Location captured successfully
              </p>
            </div>
          ) : (
            <div className="mt-4 glass-card p-3 rounded-lg border border-yellow-400/30">
              <p className="text-sm text-yellow-200 flex items-center justify-center">
                <span className="mr-2">⚠️</span>
                Location access recommended for better experience
              </p>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 glass-interactive" ref={formRef}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-4">
              <label className="text-white/80 font-medium">Account Type:</label>

              <div
                className={`glass-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedType === "individual"
                    ? "ring-2 ring-white/30 glass-card-primary"
                    : "hover:ring-1 hover:ring-white/20"
                }`}
                onClick={() => setSelectedType("individual")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="individual"
                    checked={selectedType === "individual"}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="mr-3 accent-red-400"
                  />
                  <div>
                    <h3 className="font-medium text-white">Individual User</h3>
                    <p className="text-sm text-white/70">
                      Create blood requests or become a donor
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`glass-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedType === "hospital"
                    ? "ring-2 ring-white/30 glass-card-primary"
                    : "hover:ring-1 hover:ring-white/20"
                }`}
                onClick={() => setSelectedType("hospital")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="hospital"
                    checked={selectedType === "hospital"}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="mr-3 accent-red-400"
                  />
                  <div>
                    <h3 className="font-medium text-white">Hospital</h3>
                    <p className="text-sm text-white/70">
                      Manage blood requests for your hospital
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual User Fields */}
            {selectedType === "individual" && (
              <div className="space-y-4 glass-card p-4 rounded-lg">
                <h4 className="font-medium text-white neon-glow">
                  Personal Information
                </h4>

                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass-card text-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                >
                  <option value="" className="bg-gray-800">
                    Select Blood Group
                  </option>
                  <option value="A+" className="bg-gray-800">
                    A+
                  </option>
                  <option value="A-" className="bg-gray-800">
                    A-
                  </option>
                  <option value="B+" className="bg-gray-800">
                    B+
                  </option>
                  <option value="B-" className="bg-gray-800">
                    B-
                  </option>
                  <option value="AB+" className="bg-gray-800">
                    AB+
                  </option>
                  <option value="AB-" className="bg-gray-800">
                    AB-
                  </option>
                  <option value="O+" className="bg-gray-800">
                    O+
                  </option>
                  <option value="O-" className="bg-gray-800">
                    O-
                  </option>
                </select>

                <div className="space-y-2">
                  <label className="text-white/80 font-medium">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location (e.g., Mumbai)"
                      value={location}
                      onChange={handleLocationFieldChange}
                      required
                      className="w-full px-4 py-3 pr-12 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleManualLocationCapture}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 text-xl"
                      title="Capture GPS Location"
                    >
                      📍
                    </button>
                  </div>
                  {locationCaptured && (
                    <p className="text-xs text-green-300 mt-1">
                      ✅ GPS location captured accurately
                    </p>
                  )}
                </div>

                <label className="flex items-center space-x-3 glass-card p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    className="accent-red-400"
                  />
                  <span className="text-white/90">
                    I want to register as a blood donor
                  </span>
                </label>
              </div>
            )}

            {/* Hospital Fields */}
            {selectedType === "hospital" && (
              <div className="space-y-4 glass-card-primary p-4 rounded-lg">
                <h4 className="font-medium text-blue-200 neon-glow">
                  Hospital Information
                </h4>

                <input
                  type="text"
                  placeholder="Hospital Name"
                  value={hospitalDetails.hospitalName}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalName: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />

                <input
                  type="text"
                  placeholder="Hospital Address"
                  value={hospitalDetails.hospitalAddress}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalAddress: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />

                <input
                  type="text"
                  placeholder="Hospital License Number"
                  value={hospitalDetails.hospitalLicense}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalLicense: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />

                <div className="space-y-2">
                  <label className="text-blue-200 font-medium">
                    Hospital Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location (e.g., Mumbai)"
                      value={location}
                      onChange={handleLocationFieldChange}
                      required
                      className="w-full px-4 py-3 pr-12 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={handleManualLocationCapture}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 text-xl"
                      title="Capture GPS Location"
                    >
                      📍
                    </button>
                  </div>
                  {locationCaptured && (
                    <p className="text-xs text-green-300 mt-1">
                      ✅ GPS location captured accurately
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedType || loading}
              className="w-full glass-button py-4 text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:scale-105 glass-interactive disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="loading-pulse mr-2">⏳</div>
                  Setting up account...
                </span>
              ) : (
                <span>
                  <span className="mr-2">🚀</span>
                  Continue
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Location Capture Component */}
        {showLocationCapture && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card p-6 m-4 max-w-md w-full">
              <LocationCapture
                onLocationCaptured={handleLocationCaptured}
                onSkip={handleLocationSkipped}
                purpose="complete your account setup and find nearby blood requests"
                showSkipOption={true}
                className=""
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountTypeSelection;
