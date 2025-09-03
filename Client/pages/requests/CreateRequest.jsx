import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api.js";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    bloodGroup: user?.bloodGroup || "",
    location: user?.location || "",
    urgency: "Normal",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // GSAP Refs
  const formRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/request/all");
        setRequests(res.data.requests);

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
      }
    };

    fetchRequests();

    // Enhanced initial page animations
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -50, rotationX: -15 },
      { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: "back.out(1.7)" }
    ).fromTo(
      formRef.current,
      { opacity: 0, x: -50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power2.out" },
      "-=0.6"
    );

    // Add floating particles
    const particles = document.querySelectorAll(".create-particle");
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
  }, []);

  const markFulfilled = async (id) => {
    try {
      await api.put(`/request/${id}`);
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, fulfilled: true } : req))
      );
    } catch (err) {
      console.error("Error marking fulfilled", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/request/create", form);
      setSuccess("Request created successfully!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen plasma-bg relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="particle create-particle"
            style={{
              width: Math.random() * 8 + 5 + "px",
              height: Math.random() * 8 + 5 + "px",
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
                  <span className="text-3xl neon-glow">🩸</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 neon-glow">
                    Create Blood Request
                  </h1>
                  <p className="text-white text-sm font-medium">
                    Help save lives by requesting blood donations
                  </p>
                </div>
              </div>

              {/* User Info Card */}
              <div className="glass-card-danger p-4 flex items-center space-x-4">
                <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">{user?.name}</span>
                    <span className="glass-card-danger px-3 py-1 rounded-full text-red-200 font-semibold text-sm">
                      {user?.bloodGroup}
                    </span>
                  </div>
                  {user?.location && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-red-300">📍</span>
                      <span className="text-red-200 text-sm">
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Create Request Form */}
        <div className="glass-card p-8 mb-8" ref={formRef}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 neon-glow">
              Emergency Blood Request
            </h2>
            <p className="text-white font-medium">
              Fill out the details for your blood request
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-medium mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
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
              </div>

              <div>
                <label className="block text-white/80 font-medium mb-2">
                  Urgency Level
                </label>
                <select
                  name="urgency"
                  value={form.urgency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-card text-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                >
                  <option value="Normal" className="bg-gray-800">
                    Normal
                  </option>
                  <option value="Urgent" className="bg-gray-800">
                    Urgent
                  </option>
                  <option value="Emergency" className="bg-gray-800">
                    Emergency
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter hospital/clinic location"
                required
                className="w-full px-4 py-3 glass-card text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
              />
            </div>

            {error && (
              <div className="glass-card-danger p-4 text-red-300 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="glass-card-success p-4 text-green-300 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-4 text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:scale-105 glass-interactive disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="loading-pulse mr-2">⏳</div>
                  Creating Request...
                </span>
              ) : (
                <span>
                  <span className="mr-2">🆘</span>
                  Create Emergency Request
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Requests */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6 neon-glow">
            Active Blood Requests
          </h3>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 neon-glow">🩸</div>
                <p className="text-white/60">No active requests found</p>
              </div>
            ) : (
              requests.map((req, index) => (
                <div
                  key={req._id}
                  className="glass-card p-4 glass-interactive"
                  ref={(el) => (cardsRef.current[index] = el)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`glass-card-danger px-3 py-1 rounded-full ${req.urgency === "Emergency" ? "heartbeat" : ""}`}
                      >
                        <span className="text-red-200 font-bold text-lg">
                          {req.bloodGroup}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{req.location}</p>
                        <p className="text-white/60 text-sm">
                          Urgency: {req.urgency}
                        </p>
                      </div>
                    </div>
                    {req.fulfilled ? (
                      <span className="glass-card-success px-4 py-2 rounded-lg text-green-300 font-medium">
                        ✔ Fulfilled
                      </span>
                    ) : (
                      <button
                        onClick={() => markFulfilled(req._id)}
                        className="glass-button px-4 py-2 text-green-300 hover:text-green-200 transition-colors"
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
      </div>
    </div>
  );
};

export default Dashboard;
