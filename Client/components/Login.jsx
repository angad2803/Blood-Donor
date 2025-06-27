import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import gpsLocationService from "../utils/gpsLocationService";
import LocationCapture from "./LocationCapture";
import { gsap } from "gsap";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [userData, setUserData] = useState(null);

  // GSAP Refs
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    ).fromTo(
      cardRef.current,
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Loading animation
    gsap.to(formRef.current, {
      scale: 0.98,
      opacity: 0.7,
      duration: 0.3,
      ease: "power2.out",
    });

    const result = await login(email, password);

    if (result.success) {
      // Success animation
      gsap.to(cardRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to(cardRef.current, {
            x: -window.innerWidth,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
          });
        },
      });

      const user = result.user;

      // Check if user has GPS coordinates
      const hasLocation =
        user.coordinates &&
        user.coordinates.coordinates &&
        user.coordinates.coordinates[0] !== 0 &&
        user.coordinates.coordinates[1] !== 0;

      if (!hasLocation && gpsLocationService.isSupported()) {
        // Try to capture location automatically first
        try {
          const locationResult =
            await gpsLocationService.captureLocationAutomatically(
              "find nearby blood requests and donors",
              false // Don't show prompt initially
            );

          if (locationResult.success) {
            console.log("Location captured automatically for existing user");
            navigate("/dashboard");
          } else {
            // Show location capture UI
            setUserData(user);
            setShowLocationCapture(true);
          }
        } catch (error) {
          console.log(
            "Auto location capture failed, showing UI:",
            error.message
          );
          setUserData(user);
          setShowLocationCapture(true);
        }
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.message || "Login failed");

      // Error shake animation
      gsap.to(cardRef.current, {
        x: -10,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          gsap.set(cardRef.current, { x: 0 });
        },
      });
    }

    // Reset form animation
    gsap.to(formRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });

    setLoading(false);
  };

  const handleLocationCaptured = (locationData) => {
    console.log("Location captured during login:", locationData);
    setShowLocationCapture(false);
    navigate("/dashboard");
  };

  const handleLocationSkipped = () => {
    console.log("Location capture skipped during login");
    setShowLocationCapture(false);
    navigate("/dashboard");
  };

  if (showLocationCapture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
            Welcome back, {userData?.name}! 👋
          </h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            To help you find nearby blood requests and donors, we'd like to
            access your current location.
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div
        className="w-full max-w-md p-8 bg-white rounded-lg shadow-md"
        ref={cardRef}
      >
        <h2
          className="text-2xl font-semibold text-center text-blue-700 mb-6"
          ref={titleRef}
        >
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" ref={formRef}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
        <div className="mt-4 flex justify-center">
          <a href="http://localhost:5000/api/auth/google">
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Login with Google
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
