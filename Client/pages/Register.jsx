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
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [registrationStep, setRegistrationStep] = useState("form"); // form, location, complete
  const navigate = useNavigate();

  // GSAP Refs
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const fieldsRef = useRef([]);

  useEffect(() => {
    // Stagger form field animations
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: -40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
    )
      .fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        fieldsRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
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
              const address = new google.maps.Geocoder()
                .geocode({
                  location: coordinates,
                })
                .then((results) => {
                  if (results.length > 0) {
                    resolve({
                      coordinates,
                      address: results[0].formatted_address,
                    });
                  } else {
                    reject(new Error("No results found"));
                  }
                });
            },
            (error) => {
              reject(error);
            }
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
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2
          className="text-2xl font-semibold text-center text-blue-700 mb-6"
          ref={titleRef}
        >
          Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" ref={formRef}>
          <input
            name="name"
            placeholder="Name"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="bloodGroup"
            placeholder="Blood Group (e.g., A+)"
            onChange={handleChange}
            required={!form.isHospital}
            disabled={form.isHospital}
            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              form.isHospital ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
          <div className="relative">
            <input
              name="location"
              placeholder="Location (e.g., Mumbai)"
              value={form.location}
              onChange={handleLocationFieldChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {locationData && (
              <div className="absolute right-2 top-2">
                <svg
                  className="w-5 h-5 text-green-500"
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
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              📍 GPS location captured: {locationData.address}
            </div>
          )}

          {/* User Type Selection */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Select Account Type:
            </h3>
            <label className="flex items-center space-x-2">
              <input
                name="isDonor"
                type="checkbox"
                onChange={handleChange}
                disabled={form.isHospital}
                className="form-checkbox"
              />
              <span className={form.isHospital ? "text-gray-400" : ""}>
                I want to register as a donor
              </span>
            </label>
            <label className="flex items-center space-x-2">
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
                className="form-checkbox"
              />
              <span>I want to register as a hospital</span>
            </label>
          </div>

          {/* Hospital-specific fields */}
          {form.isHospital && (
            <div className="space-y-4 p-4 border border-blue-200 rounded-md bg-blue-50">
              <h3 className="text-sm font-medium text-blue-700">
                Hospital Information:
              </h3>
              <input
                name="hospitalName"
                placeholder="Hospital Name"
                onChange={handleChange}
                required={form.isHospital}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                name="hospitalAddress"
                placeholder="Hospital Address"
                onChange={handleChange}
                required={form.isHospital}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                name="hospitalLicense"
                placeholder="Hospital License Number"
                onChange={handleChange}
                required={form.isHospital}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200"
          >
            Register
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </form>
        <div className="mt-4 flex justify-center">
          <a href="http://localhost:5000/api/auth/google">
            <button className="bg-red-500 text-white px-4 py-2 rounded">
              Login with Google
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;
