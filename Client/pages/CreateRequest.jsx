import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
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

    // Initial page animations
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    ).fromTo(
      formRef.current,
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Main Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Blood Donation Platform
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Create and manage blood requests
                </p>
              </div>

              {/* User Info Card */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>

                  {/* User Details */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">
                          Blood Group:
                        </span>
                        <span className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          {user?.bloodGroup}
                        </span>
                      </div>
                    </div>

                    {/* Location Info */}
                    {user?.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-400">📍</span>
                        <span className="text-xs text-gray-500 truncate max-w-48">
                          {user.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors duration-200"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Blood Requests Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Blood Requests
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Active blood requests in the system
            </p>
          </div>
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🩸</div>
                <p className="text-gray-500">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req, index) => (
                  <div
                    key={req._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    ref={(el) => (cardsRef.current[index] = el)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-semibold text-red-600">
                          {req.bloodGroup}
                        </span>
                        <span className="text-gray-600 ml-2">at</span>
                        <span className="text-gray-800 font-medium ml-2">
                          {req.location}
                        </span>
                        <span className="text-sm text-gray-500 ml-4">
                          ({req.urgency})
                        </span>
                      </div>
                      {req.fulfilled ? (
                        <span className="text-green-600 font-medium">
                          ✔ Fulfilled
                        </span>
                      ) : (
                        <button
                          onClick={() => markFulfilled(req._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Blood Request Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-blue-700 text-center">
                Create Blood Request
              </h2>
              <p className="text-sm text-gray-600 text-center mt-1">
                Fill out the form to create a new blood request
              </p>
            </div>
            <div className="p-6" ref={formRef}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <input
                    name="bloodGroup"
                    placeholder="Blood Group (e.g., A+)"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    name="location"
                    placeholder="Location (e.g., Mumbai)"
                    value={form.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "+ Create Request"}
                </button>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-600 text-sm text-center">
                      {success}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
