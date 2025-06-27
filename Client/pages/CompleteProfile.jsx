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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.put("/user/profile", formData);

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
              <input
                name="location"
                type="text"
                placeholder="Enter your city/location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
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
