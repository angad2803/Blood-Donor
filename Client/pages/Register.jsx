import React, { useState, useEffect, useRef } from "react";
import api from "../api/api.js";
import { useNavigate } from "react-router-dom";
import LocationCapture from "../components/LocationCapture";
import { gsap } from "gsap";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bloodGroup: "",
    location: "",
    isDonor: false,
    isHospital: false,
    hospitalName: "",
    hospitalAddress: "",
    hospitalLicense: "",
  });

  const [error, setError] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [registrationStep, setRegistrationStep] = useState("form"); // form, location, complete
  const navigate = useNavigate();

  // GSAP Refs
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const fieldsRef = useRef([]);

  useEffect(() => {
    // Enhanced entrance animations with glassmorphism
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: -40, rotationX: -90 },
      { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: "back.out(1.7)" }
    )
      .fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.8, rotationY: -15 },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      )
      .fromTo(
        fieldsRef.current,
        { opacity: 0, x: -30, scale: 0.95 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        },
        "-=0.4"
      );

    // Add floating particle effects
    const particles = document.querySelectorAll(".register-particle");
    particles.forEach((particle) => {
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      });

      gsap.to(particle, {
        y: `+=${(Math.random() - 0.5) * 200}`,
        x: `+=${(Math.random() - 0.5) * 100}`,
        rotation: 360,
        duration: Math.random() * 15 + 20,
        repeat: -1,
        ease: "none",
        delay: Math.random() * 5,
      });
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // First, complete the form registration
    try {
      const registrationData = { ...form };

      // If we have location data, include coordinates
      if (locationData && locationData.coordinates) {
        registrationData.coordinates = {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          accuracy: locationData.coordinates.accuracy,
        };
        // Update location field with more precise address if available
        if (locationData.address) {
          registrationData.location = locationData.address;
        }
      }

      await api.post("/auth/register", registrationData);

      // If no location captured yet, show location capture
      if (!locationData) {
        setRegistrationStep("location");
      } else {
        // Registration complete
        setRegistrationStep("complete");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const handleLocationCaptured = (capturedLocationData) => {
    console.log("Location captured during registration:", capturedLocationData);
    setLocationData(capturedLocationData);
    setRegistrationStep("complete");

    // Navigate to login after a short delay
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const handleLocationSkipped = () => {
    console.log("Location capture skipped during registration");
    setRegistrationStep("complete");
    setTimeout(() => navigate("/login"), 2000);
  };

  // Auto-capture location when user fills in location field
  const handleLocationFieldChange = async (e) => {
    const { name, value } = e.target;
    handleChange(e);

    // If user is typing location and we don't have GPS coordinates yet
    if (
      name === "location" &&
      value.length > 3 &&
      !locationData &&
      navigator.geolocation
    ) {
      try {
        // Try to capture location silently in background
        const result = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };
              resolve({
                coordinates,
                address: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
                success: true,
              });
            },
            (error) => {
              reject(error);
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
          );
        });
        if (result.success) {
          setLocationData(result);
          console.log(
            "Background location capture successful during registration"
          );
        }
      } catch (error) {
        // Silent fail - user can still register without GPS
        console.log("Background location capture failed:", error.message);
      }
    }
  };

  // Show location capture step
  if (registrationStep === "location") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
            Almost Done! 🎉
          </h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Your account has been created successfully! Now let's enable
            location access to help you connect with nearby blood requests and
            donors.
          </p>
          <LocationCapture
            onLocationCaptured={handleLocationCaptured}
            onSkip={handleLocationSkipped}
            purpose="find nearby blood requests and donors"
            showSkipOption={true}
            autoCapture={false}
          />
        </div>
      </div>
    );
  }

  // Show completion step
  if (registrationStep === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-green-700 mb-4">
            Registration Complete! ✅
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been successfully created
            {locationData ? " with location access" : ""}. You can now log in
            and start{" "}
            {form.isDonor
              ? "helping save lives by donating blood"
              : "finding blood donors in your area"}
            .
          </p>
          <div className="animate-pulse text-blue-600">
            Redirecting to login...
          </div>
        </div>
      </div>
    );
  }

  // Show main registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden flex items-center justify-center font-[Inter,sans-serif]">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={`plasma-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 150 + 50 + "px",
              height: Math.random() * 150 + 50 + "px",
              background: `radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)`,
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 25 + 30}s infinite linear`,
            }}
          />
        ))}

        {/* Subtle floating blood cells */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`blood-cell-${i}`}
            className="absolute opacity-10 text-xl"
            style={{
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 20 + 25}s infinite linear`,
              animationDelay: Math.random() * 10 + "s",
            }}
          >
            🩸
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div
          className="backdrop-blur-xl bg-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl px-10 py-8 border border-white/20"
          ref={cardRef}
          style={{
            boxShadow:
              "0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
          }}
        >
          <h2
            className="text-3xl font-bold text-center text-white mb-8"
            ref={titleRef}
            style={{
              textShadow:
                "0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(220, 38, 127, 0.3)",
            }}
          >
            Join Blood Donor Network
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" ref={formRef}>
            <div ref={(el) => (fieldsRef.current[0] = el)}>
              <input
                name="name"
                placeholder="Full Name"
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                style={{
                  fontFamily: "inherit",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>

            <div ref={(el) => (fieldsRef.current[1] = el)}>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                style={{
                  fontFamily: "inherit",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>

            <div ref={(el) => (fieldsRef.current[2] = el)}>
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                style={{
                  fontFamily: "inherit",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>

            <div ref={(el) => (fieldsRef.current[3] = el)}>
              <input
                name="bloodGroup"
                placeholder="Blood Group (e.g., A+)"
                onChange={handleChange}
                required={!form.isHospital}
                disabled={form.isHospital}
                className={`w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${
                  form.isHospital ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  fontFamily: "inherit",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>

            <div className="relative" ref={(el) => (fieldsRef.current[4] = el)}>
              <input
                name="location"
                placeholder="Location (e.g., Mumbai)"
                value={form.location}
                onChange={handleLocationFieldChange}
                required
                className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                style={{
                  fontFamily: "inherit",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              />
              {locationData && (
                <div className="absolute right-3 top-3">
                  <svg
                    className="w-6 h-6 text-green-300 neon-glow"
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
              )}
            </div>

            {locationData && (
              <div className="text-sm text-green-300 glass-card-success p-3 rounded-lg">
                📍 GPS location captured: {locationData.address}
              </div>
            )}

            {/* User Type Selection */}
            <div
              className="glass-card p-4 space-y-4"
              ref={(el) => (fieldsRef.current[5] = el)}
            >
              <h3 className="text-sm font-semibold text-white/90">
                Select Account Type:
              </h3>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="isDonor"
                  type="checkbox"
                  onChange={handleChange}
                  disabled={form.isHospital}
                  className="form-checkbox h-5 w-5 text-blue-400 rounded focus:ring-blue-300 glass-interactive"
                />
                <span
                  className={`text-white/80 ${form.isHospital ? "opacity-50" : ""}`}
                >
                  I want to register as a donor
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="isHospital"
                  type="checkbox"
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.checked) {
                      setForm((prev) => ({
                        ...prev,
                        isDonor: false,
                        bloodGroup: "",
                      }));
                    }
                  }}
                  className="form-checkbox h-5 w-5 text-red-400 rounded focus:ring-red-300 glass-interactive"
                />
                <span className="text-white/80">
                  I want to register as a hospital
                </span>
              </label>
            </div>

            {/* Hospital-specific fields */}
            {form.isHospital && (
              <div
                className="glass-card-primary p-4 space-y-4"
                ref={(el) => (fieldsRef.current[6] = el)}
              >
                <h3 className="text-sm font-semibold text-white/90">
                  Hospital Information:
                </h3>
                <input
                  name="hospitalName"
                  placeholder="Hospital Name"
                  onChange={handleChange}
                  required={form.isHospital}
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />
                <input
                  name="hospitalAddress"
                  placeholder="Hospital Address"
                  onChange={handleChange}
                  required={form.isHospital}
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />
                <input
                  name="hospitalLicense"
                  placeholder="Hospital License Number"
                  onChange={handleChange}
                  required={form.isHospital}
                  className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                />
              </div>
            )}

            {error && (
              <div className="glass-card-danger p-3 text-red-300 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full glass-button py-4 text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:scale-105 glass-interactive"
              ref={(el) => (fieldsRef.current[7] = el)}
            >
              <span className="mr-2">🚀</span>
              Create Account
            </button>

            <div className="text-center">
              <span className="text-white/60">Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
              >
                Sign in here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
