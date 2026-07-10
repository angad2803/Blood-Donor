import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";


const AccountTypeSelection = () => {
  const { t } = useTranslation();
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Initialize form data from user
  // Do not pre-fill location if it's the server default placeholder
  useEffect(() => {
    if (user) {
      setBloodGroup(user.bloodGroup || "");
      const userLocation = user.location && user.location !== "Unknown" ? user.location : "";
      setLocation(userLocation);
      setIsDonor(user.isDonor || false);
    }
  }, [user]);

  // Auto-detect location on page load.
  // Runs once on mount. Treats missing, empty, or server-default "Unknown" as needing detection.
  useEffect(() => {
    const locationMissing =
      !user?.location ||
      user.location.trim() === "" ||
      user.location === "Unknown";

    if (locationMissing && navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await response.json();

            if (data && data.address) {
              const { city, town, village, state, suburb } = data.address;
              const locationStr = [city || town || village || suburb, state]
                .filter(Boolean)
                .join(", ");
              if (locationStr) {
                setLocation(locationStr);
              }
            }
          } catch (err) {
            setLocationError("Failed to auto-detect location. Please enter manually.");
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          setLocationError("Location permission denied. Please enter manually.");
          setLocationLoading(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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
              <label className="text-gray-700 dark:text-gray-300 font-semibold block">{t("register.account_type", "Account Type:")}</label>

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
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t("register.individual_user", "Individual User")}</h3>
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
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t("register.hospital", "Hospital")}</h3>
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
                  <option value="">{t("register.select_blood_group", "Select Blood Group")}</option>
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t("register.location", "Location")}</label>
                    {locationLoading && (
                      <span className="text-xs text-blue-500 flex items-center">
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Detecting...
                      </span>
                    )}
                  </div>
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
                  {locationError && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{locationError}</p>
                  )}
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                      {t("register.hospital_location", "Hospital Location")}
                    </label>
                    {locationLoading && (
                      <span className="text-xs text-blue-500 flex items-center">
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Detecting...
                      </span>
                    )}
                  </div>
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
                  {locationError && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{locationError}</p>
                  )}
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
