import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import GPSSetupPrompt from "../components/GPSSetupPrompt";

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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

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
          // Try to get a readable address from coordinates
          const response = await api.post("/user/reverse-geocode", {
            latitude,
            longitude,
          });

          if (response.data.success && response.data.data.address) {
            setFormData({
              ...formData,
              location: response.data.data.address,
            });
          } else {
            // Fallback to coordinates if address lookup fails
            setFormData({
              ...formData,
              location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            });
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          // Fallback to coordinates
          setFormData({
            ...formData,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        }

        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = "Failed to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.put("/user/profile", formData);

      console.log("Profile update response:", res.data);

      // Update user context with new data
      const updatedUser = { ...user, ...formData };
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
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-center text-blue-700 mb-4">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Please provide your blood group and location to help us match you
            with blood donation requests.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group *
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <div className="flex gap-2">
                <input
                  name="location"
                  type="text"
                  placeholder="Enter your city/location or use GPS"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {locationLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        ></path>
                      </svg>
                      Getting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      GPS
                    </>
                  )}
                </button>
              </div>
              {locationError && (
                <p className="text-red-500 text-xs mt-1">{locationError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Click GPS to automatically detect your current location
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                name="isDonor"
                type="checkbox"
                checked={formData.isDonor}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">
                I want to register as a blood donor
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Complete Profile"}
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}
          </form>
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
