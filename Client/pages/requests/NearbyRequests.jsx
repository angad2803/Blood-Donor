import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LocationManager from "../../components/maps/LocationManager";
import { gsap } from "gsap";

const NearbyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [includeRoutes, setIncludeRoutes] = useState(false);

  // GSAP Refs
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const sidebarRef = useRef(null);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setError("");
      },
      (error) => {
        setError("Failed to get your location. Please enable location access.");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Auto-get location on component mount
  useEffect(() => {
    if (user) {
      // Try to get location from user profile first
      if (
        user.coordinates &&
        user.coordinates.coordinates &&
        user.coordinates.coordinates[0] !== 0 &&
        user.coordinates.coordinates[1] !== 0
      ) {
        setUserLocation({
          latitude: user.coordinates.coordinates[1],
          longitude: user.coordinates.coordinates[0],
        });
      } else {
        // Get current location
        getCurrentLocation();
      }
    }
  }, [user, getCurrentLocation]);

  const fetchNearbyRequests = useCallback(async () => {
    if (!userLocation && !user?.isDonor) {
      setError(
        "Location is required to find nearby requests. Please enable location access."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Update user location on server if available
      if (userLocation) {
        await api.post("/user/location", {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: 50,
        });
      }

      // Use the enhanced geolocation-based matching
      const params = new URLSearchParams({
        maxDistance: (searchRadius * 1000).toString(), // Convert km to meters
        limit: "20",
        includeRoutes: includeRoutes.toString(),
      });

      if (urgencyFilter) {
        params.append("urgencyFilter", urgencyFilter);
      }

      const res = await api.get(`/match/nearby?${params}`);

      if (res.data.success) {
        setRequests(res.data.data.requests || []);

        if (res.data.data.requests.length === 0) {
          setError(
            res.data.message ||
              `No blood requests found within ${searchRadius}km. Try expanding your search radius.`
          );
        }
      } else {
        setRequests([]);
        setError(res.data.message || "No blood requests found in your area.");
      }
    } catch (err) {
      console.error("Error fetching nearby requests:", err);
      setError("Failed to find nearby requests. Please try again.");
      setRequests([]);
    }
    setLoading(false);
  }, [user, userLocation, searchRadius, urgencyFilter, includeRoutes]);

  // Auto-fetch when location is available
  useEffect(() => {
    if (user?.isDonor && userLocation) {
      fetchNearbyRequests();
    }
  }, [user, userLocation, fetchNearbyRequests]);

  // GSAP animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
      );
    }

    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { opacity: 0, x: -50, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
        }
      );
    }

    // Animate cards when they load
    setTimeout(() => {
      if (cardsRef.current.length > 0) {
        gsap.fromTo(
          cardsRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          }
        );
      }
    }, 100);

    // Add floating particles
    const particles = document.querySelectorAll(".nearby-particle");
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
  }, [requests]);

  const handleFulfill = async (id) => {
    try {
      await api.put(`/request/${id}/fulfill`);
      toast.success("✅ Request fulfilled!");

      // Update UI
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error fulfilling request", err);
      toast.error("❌ Failed to fulfill request");
    }
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Format route info for display
  const formatRouteInfo = (routeInfo) => {
    if (!routeInfo) return null;

    const duration = Math.round(routeInfo.duration / 60); // Convert to minutes
    const distance = formatDistance(routeInfo.distance);

    return `${distance} • ${duration} min`;
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Emergency":
        return "glass-card-danger text-red-200";
      case "High":
        return "glass-card text-orange-200 border-orange-400/30";
      case "Medium":
        return "glass-card text-yellow-200 border-yellow-400/30";
      case "Low":
        return "glass-card-success text-green-200";
      default:
        return "glass-card text-white/80";
    }
  };

  return (
    <div className="min-h-screen plasma-bg relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle nearby-particle"
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center" ref={headerRef}>
          <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 glass-interactive">
            <span className="text-4xl neon-glow">
              {user?.isDonor ? "🩸" : "🏥"}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 neon-glow">
            {user?.isDonor ? "Nearby Blood Requests" : "Blood Requests"}
          </h1>
          <p className="text-white/70 text-lg">
            {user?.isDonor
              ? "Find blood requests near your location where you can help save lives"
              : "View blood requests in your area"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Controls */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6" ref={sidebarRef}>
              <h2 className="text-xl font-semibold mb-4 text-white neon-glow">
                Search Settings
              </h2>

              {/* Location Status */}
              {userLocation ? (
                <div className="mb-4 glass-card-success p-3 rounded-lg">
                  <p className="text-sm text-green-200">
                    📍 <strong>Location:</strong>{" "}
                    {userLocation.latitude.toFixed(4)},{" "}
                    {userLocation.longitude.toFixed(4)}
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="mt-2 text-sm text-green-300 hover:text-green-200 underline transition-colors"
                  >
                    Update Location
                  </button>
                </div>
              ) : (
                <div className="mb-4 glass-card p-3 rounded-lg border border-yellow-400/30">
                  <p className="text-sm text-yellow-200 mb-2">
                    📍 Location access needed to find nearby requests
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="w-full glass-button py-2 px-4 text-white hover:scale-105 transition-all duration-300"
                  >
                    Get My Location
                  </button>
                </div>
              )}

              {/* Search Radius */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Search Radius: {searchRadius}km
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-full accent-red-400"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>5km</span>
                  <span>100km</span>
                </div>
              </div>

              {/* Urgency Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Urgency Filter
                </label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full p-2 glass-card text-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300"
                >
                  <option value="" className="bg-gray-800">
                    All Urgency Levels
                  </option>
                  <option value="Emergency" className="bg-gray-800">
                    Emergency Only
                  </option>
                  <option value="High" className="bg-gray-800">
                    High Priority
                  </option>
                  <option value="Medium" className="bg-gray-800">
                    Medium Priority
                  </option>
                  <option value="Low" className="bg-gray-800">
                    Low Priority
                  </option>
                </select>
              </div>

              {/* Include Routes */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRoutes}
                    onChange={(e) => setIncludeRoutes(e.target.checked)}
                    className="mr-2 accent-red-400"
                  />
                  <span className="text-sm text-white/80">
                    Include driving directions
                  </span>
                </label>
              </div>

              {/* Search Button */}
              <button
                onClick={fetchNearbyRequests}
                disabled={loading || (!userLocation && user?.isDonor)}
                className="w-full glass-button py-3 px-4 text-white font-semibold transition-all duration-300 hover:scale-105 glass-interactive disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="loading-pulse mr-2">⏳</div>
                    Searching...
                  </span>
                ) : (
                  <span>
                    <span className="mr-2">🔍</span>
                    Find Requests
                  </span>
                )}
              </button>

              {/* Quick Distance Buttons */}
              <div className="mt-4">
                <p className="text-sm font-medium text-white/80 mb-2">
                  Quick Distance:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => setSearchRadius(distance)}
                      className={`py-2 px-3 text-xs rounded transition-all duration-300 ${
                        searchRadius === distance
                          ? "glass-card-danger text-red-200 scale-105"
                          : "glass-card text-white/80 hover:scale-105"
                      }`}
                    >
                      {distance}km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Manager Component */}
            <div className="mt-6">
              <div className="glass-card p-4">
                <LocationManager />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-white neon-glow">
                Blood Requests ({requests.length})
              </h2>

              {error && (
                <div className="mb-4 glass-card-danger p-4 rounded-lg">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4 neon-glow">🔍</div>
                  <p className="text-white/80 text-lg loading-pulse">
                    Searching for nearby blood requests...
                  </p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 neon-glow">🩸</div>
                  <p className="text-white/80 text-lg font-medium">
                    No blood requests found
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    {user?.isDonor
                      ? "No one needs your blood type in your area right now. Thank you for being ready to help!"
                      : "Try expanding your search radius or check back later"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request, index) => (
                    <div
                      key={request.id}
                      className="glass-card p-4 glass-interactive hover:scale-105 transition-all duration-300"
                      ref={(el) => (cardsRef.current[index] = el)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="glass-card-danger px-3 py-1 rounded-full text-sm font-medium text-red-200 neon-glow">
                              {request.bloodGroup}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(
                                request.urgency
                              )} ${request.urgency === "Emergency" ? "heartbeat" : ""}`}
                            >
                              {request.urgency}
                            </span>
                            {request.distance && (
                              <span className="glass-card-primary px-3 py-1 rounded-full text-sm font-medium text-blue-200">
                                📍 {formatDistance(request.distance)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-2 neon-glow">
                            {request.hospitalName || "Medical Emergency"}
                          </h3>

                          <div className="space-y-1 text-sm text-white/80">
                            {request.location && (
                              <p>
                                📍{" "}
                                <strong className="text-white">
                                  Location:
                                </strong>{" "}
                                {request.location}
                              </p>
                            )}
                            {request.requester?.name && (
                              <p>
                                👤{" "}
                                <strong className="text-white">Contact:</strong>{" "}
                                {request.requester.name}
                              </p>
                            )}
                            {request.contactInfo && (
                              <p>
                                📞{" "}
                                <strong className="text-white">Phone:</strong>{" "}
                                {request.contactInfo}
                              </p>
                            )}
                            {request.routeInfo && (
                              <p>
                                🛣️{" "}
                                <strong className="text-white">Route:</strong>{" "}
                                {formatRouteInfo(request.routeInfo)}
                              </p>
                            )}
                            <p>
                              📅 <strong className="text-white">Posted:</strong>{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {user?.isDonor && (
                            <button
                              onClick={() => handleFulfill(request.id)}
                              className="glass-button px-4 py-2 text-green-300 hover:text-green-200 transition-colors glass-interactive"
                            >
                              ✅ I Can Help
                            </button>
                          )}
                          {request.contactInfo && (
                            <a
                              href={`tel:${request.contactInfo}`}
                              className="glass-button px-4 py-2 text-blue-300 hover:text-blue-200 transition-colors text-center"
                            >
                              📞 Call
                            </a>
                          )}
                          {request.coordinates && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${request.coordinates.coordinates[1]},${request.coordinates.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="glass-button px-4 py-2 text-white/80 hover:text-white transition-colors text-center"
                            >
                              🗺️ Navigate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyRequests;
