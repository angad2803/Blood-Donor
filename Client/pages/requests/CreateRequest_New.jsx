import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.js";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const requestData = { ...form };


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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                🩸 Create Blood Request
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-1 font-medium">
                Request blood donation from nearby donors
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 font-semibold bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Blood Request Details
            </h2>
            <p className="text-base text-gray-700 dark:text-gray-300 mt-2 font-medium">
              Fill in the details for your blood donation request
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Blood Group */}
            <div>
              <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                Blood Group Required *
              </label>
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="" className="text-gray-500">
                  Select Blood Group
                </option>
                <option value="A+">A+ (A Positive)</option>
                <option value="A-">A- (A Negative)</option>
                <option value="B+">B+ (B Positive)</option>
                <option value="B-">B- (B Negative)</option>
                <option value="AB+">AB+ (AB Positive)</option>
                <option value="AB-">AB- (AB Negative)</option>
                <option value="O+">O+ (O Positive)</option>
                <option value="O-">O- (O Negative)</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="Enter hospital/clinic name and address"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                Urgency Level *
              </label>
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="Low">🟢 Low - Can wait a few days</option>
                <option value="Medium">
                  🟡 Medium - Needed within 24-48 hours
                </option>
                <option value="High">🟠 High - Needed within 12 hours</option>
                <option value="Emergency">
                  🔴 Emergency - Needed immediately
                </option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                Additional Details (Optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide any additional information about the blood requirement, patient condition, or special instructions..."
                className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all resize-y"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-base font-semibold">
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-4 text-base font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-3 focus:ring-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 text-base font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-3 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "🔄 Creating Request..." : "🩸 Create Blood Request"}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="px-8 py-6 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="flex items-start">
              <div className="text-blue-600 dark:text-blue-400 mr-4 mt-1 text-xl">
                ℹ️
              </div>
              <div className="text-base text-blue-800 dark:text-blue-300">
                <p className="font-bold text-lg mb-3">How it works:</p>
                <ul className="list-disc list-inside space-y-2 font-medium">
                  <li>Your request will be visible to nearby donors</li>
                  <li>Donors can send you offers to help</li>
                  <li>You can accept the best offer and coordinate directly</li>

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
