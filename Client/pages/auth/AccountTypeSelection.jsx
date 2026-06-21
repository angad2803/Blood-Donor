import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";


const AccountTypeSelection = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [hospitalDetails, setHospitalDetails] = useState({
    hospitalName: "",
    hospitalAddress: "",
    hospitalLicense: "",
  });
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [isDonor, setIsDonor] = useState(false);

  const [loading, setLoading] = useState(false);

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setBloodGroup(user.bloodGroup || "");
      setLocation(user.location || "");
      setIsDonor(user.isDonor || false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        needsAccountTypeSelection: false,
        location: location || user?.location,
      };



      if (selectedType === "hospital") {
        updateData.isHospital = true;
        updateData.isDonor = false;
        updateData.hospitalName = hospitalDetails.hospitalName;
        updateData.hospitalAddress = hospitalDetails.hospitalAddress;
        updateData.hospitalLicense = hospitalDetails.hospitalLicense;
        // Clear blood group for hospitals
        updateData.bloodGroup = undefined;
      } else {
        updateData.isHospital = false;
        updateData.isDonor = isDonor;
        updateData.bloodGroup = bloodGroup;
      }

      const res = await api.put("/user/profile", updateData);

      // Update user in context
      updateUser(res.data.user);

      toast.success("Account type set successfully!");

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        "Failed to update account type: " + (err.response?.data?.message || "")
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Please select your account type to continue
          </p>

        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-4">
              <label className="text-gray-700 dark:text-gray-300 font-semibold block">Account Type:</label>

              <div
                className={`bg-gray-50 dark:bg-gray-700/50 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedType === "individual"
                    ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
                onClick={() => setSelectedType("individual")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="individual"
                    checked={selectedType === "individual"}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Individual User</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create blood requests or become a donor
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`bg-gray-50 dark:bg-gray-700/50 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedType === "hospital"
                    ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
                onClick={() => setSelectedType("hospital")}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="accountType"
                    value="hospital"
                    checked={selectedType === "hospital"}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Hospital</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Manage blood requests for your hospital
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual User Fields */}
            {selectedType === "individual" && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h4>

                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

                <div className="space-y-2">
                  <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location (e.g., Mumbai)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                  <input
                    type="checkbox"
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-900 dark:text-white font-medium text-sm">
                    I want to register as a blood donor
                  </span>
                </label>
              </div>
            )}

            {/* Hospital Fields */}
            {selectedType === "hospital" && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                  Hospital Information
                </h4>

                <input
                  type="text"
                  placeholder="Hospital Name"
                  value={hospitalDetails.hospitalName}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalName: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder="Hospital Address"
                  value={hospitalDetails.hospitalAddress}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalAddress: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder="Hospital License Number"
                  value={hospitalDetails.hospitalLicense}
                  onChange={(e) =>
                    setHospitalDetails((prev) => ({
                      ...prev,
                      hospitalLicense: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <div className="space-y-2">
                  <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                    Hospital Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location (e.g., Mumbai)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedType || loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up account...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-2">🚀</span>
                  Continue
                </span>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AccountTypeSelection;
