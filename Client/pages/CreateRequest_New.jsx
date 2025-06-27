import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import gpsLocationService from "../utils/gpsLocationService";
import { toast } from "react-toastify";

const CreateRequest = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    bloodGroup: user?.bloodGroup || "",
    location: user?.location || "",
    urgency: "Medium",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationData, setLocationData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLocationFieldChange = async (e) => {
    const value = e.target.value;
    setForm({ ...form, location: value });

    // Try to capture location when user starts typing
    if (value.length > 3 && !locationData && gpsLocationService.isSupported()) {
      try {
        const result = await gpsLocationService.captureLocationAutomatically(
          "enhance location accuracy for your blood request",
          false
        );

        if (result.success) {
          setLocationData(result);
        }
      } catch (error) {
        console.log("Background location capture failed:", error);
      }
    }
  };

  const handleCaptureLocation = async () => {
    try {
      toast.info("📍 Capturing your location...");
      const result = await gpsLocationService.captureLocationAutomatically(
        "get precise location for your blood request",
        true
      );

      if (result.success) {
        setLocationData(result);
        setForm({
          ...form,
          location:
            result.address ||
            result.city ||
            result.region ||
            "Location captured (coordinates hidden for privacy)",
        });
        toast.success("✅ Location captured successfully!");
      }
    } catch (error) {
      console.error("Location capture failed:", error);
      toast.error("Failed to capture location. Please enter manually.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const requestData = { ...form };

      // Include GPS coordinates if available
      if (locationData && locationData.coordinates) {
        requestData.coordinates = {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          accuracy: locationData.coordinates.accuracy,
        };
      }

      await api.post("/request/create", requestData);

      // Success! Show success message and navigate
      toast.success(
        "🩸 Blood request created successfully! Donors in your area will be notified."
      );

      // Navigate back to dashboard
      navigate("/dashboard", {
        state: {
          message:
            "Your blood request is now live! Check the 'My Requests' tab to track offers.",
          activeTab: "my-requests",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Blood Request
              </h1>
              <p className="text-sm text-gray-600">
                Request blood donation from nearby donors
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Blood Request Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Fill in the details for your blood donation request
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group Required *
              </label>
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleLocationFieldChange}
                  required
                  placeholder="Enter location where blood is needed"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800"
                  title="Capture GPS Location"
                >
                  📍
                </button>
              </div>
              {locationData && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ GPS location captured for precise matching
                </p>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Low">Low - Can wait a few days</option>
                <option value="Medium">
                  Medium - Needed within 24-48 hours
                </option>
                <option value="High">High - Needed within 12 hours</option>
                <option value="Emergency">
                  Emergency - Needed immediately
                </option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide any additional information about the blood requirement..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Request..." : "Create Blood Request"}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
            <div className="flex items-start">
              <div className="text-blue-500 mr-3 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-700">
                <p className="font-medium">How it works:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Your request will be visible to nearby donors</li>
                  <li>Donors can send you offers to help</li>
                  <li>You can accept the best offer and coordinate directly</li>
                  <li>
                    GPS location helps find the closest donors for faster
                    response
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
