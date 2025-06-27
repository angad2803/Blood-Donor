import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import LocationCapture from "../components/LocationCapture";
import gpsLocationService from "../utils/gpsLocationService";

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

  // Override setLocation to prevent coordinates from being displayed
  const safeSetLocation = (newLocation) => {
    const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;
    if (
      typeof newLocation === "string" &&
      coordinatePattern.test(newLocation.trim())
    ) {
      console.log("Blocking coordinate display:", newLocation); // Debug log
      setLocation("Location captured (coordinates hidden for privacy)");
    } else {
      setLocation(newLocation);
    }
  };
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  // Immediate cleanup of coordinates if they exist
  useEffect(() => {
    const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;
    if (location && coordinatePattern.test(location.trim())) {
      console.log("Immediate cleanup of coordinates:", location);
      setLocation("Location captured (coordinates hidden for privacy)");
    }
  }, []); // Run once on mount

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setBloodGroup(user.bloodGroup || "");
      // Clean up location if it contains coordinates
      const userLocation = user.location || "";
      const coordinatePattern = /^-?\d+\.?\d*,?\s*-?\d+\.?\d*$/;

      console.log("User location:", userLocation); // Debug log

      if (coordinatePattern.test(userLocation.trim())) {
        console.log("Coordinates detected in user location, cleaning up"); // Debug log
        safeSetLocation("Location captured (coordinates hidden for privacy)");
      } else if (userLocation) {
        safeSetLocation(userLocation);
      }
      setIsDonor(user.isDonor || false);
    }
  }, [user]);

  // Auto-capture location when component mounts
  useEffect(() => {
    const autoCapturLocation = async () => {
      if (
        gpsLocationService.isSupported() &&
        !user?.coordinates?.coordinates?.[0]
      ) {
        try {
          const result = await gpsLocationService.captureLocationAutomatically(
            "complete your profile setup",
            false // Don't show prompt initially, capture silently
          );

          if (result.success) {
            setLocationData(result);
            safeSetLocation(
              result.address ||
                result.city ||
                result.region ||
                "Location captured (coordinates hidden for privacy)"
            );
            setLocationCaptured(true);
            toast.success("Location captured automatically!");
          } else {
            // If silent capture fails, show location capture component
            setShowLocationCapture(true);
          }
        } catch (error) {
          console.log("Auto location capture failed:", error);
          setShowLocationCapture(true);
        }
      }
    };

    // Small delay to let the component render first
    setTimeout(autoCapturLocation, 1000);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        needsAccountTypeSelection: false,
        location: location || user?.location,
      };

      // Include GPS coordinates if available
      if (locationData && locationData.coordinates) {
        updateData.coordinates = {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          accuracy: locationData.coordinates.accuracy,
        };
      }

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

  const handleLocationCaptured = (capturedLocationData) => {
    setLocationData(capturedLocationData);
    safeSetLocation(
      capturedLocationData.address || capturedLocationData.formatted
    );
    setLocationCaptured(true);
    setShowLocationCapture(false);
    toast.success("Location captured successfully!");
  };

  const handleLocationSkipped = () => {
    setShowLocationCapture(false);
    toast.info(
      "Location capture skipped. You can enable it later in settings."
    );
  };

  const handleLocationFieldChange = async (e) => {
    const value = e.target.value;
    safeSetLocation(value);

    // Try to capture location when user starts typing
    if (
      value.length > 3 &&
      !locationCaptured &&
      gpsLocationService.isSupported()
    ) {
      try {
        const result = await gpsLocationService.captureLocationAutomatically(
          "enhance location accuracy",
          false
        );

        if (result.success) {
          setLocationData(result);
          setLocationCaptured(true);
        }
      } catch (error) {
        console.log("Background location capture failed:", error);
      }
    }
  };

  const handleManualLocationCapture = () => {
    setShowLocationCapture(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-700">
            Welcome, {user?.name}!
          </h2>
          <p className="text-gray-600 mt-2">
            Please select your account type to continue
          </p>

          {/* Location Status */}
          {locationCaptured ? (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center justify-center">
                <span className="mr-2">📍</span>
                Location captured successfully
              </p>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 flex items-center justify-center">
                <span className="mr-2">⚠️</span>
                Location access recommended for better experience
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Account Type:
            </label>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedType === "individual"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
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
                  className="mr-3"
                />
                <div>
                  <h3 className="font-medium text-gray-900">Individual User</h3>
                  <p className="text-sm text-gray-600">
                    Create blood requests or become a donor
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedType === "hospital"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
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
                  className="mr-3"
                />
                <div>
                  <h3 className="font-medium text-gray-900">Hospital</h3>
                  <p className="text-sm text-gray-600">
                    Manage blood requests for your hospital
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual User Fields */}
          {selectedType === "individual" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">
                Personal Information
              </h4>

              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Location (e.g., Mumbai)"
                    value={location}
                    onChange={handleLocationFieldChange}
                    required
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleManualLocationCapture}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    title="Capture GPS Location"
                  >
                    📍
                  </button>
                </div>
                {locationCaptured && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ GPS location captured accurately
                  </p>
                )}
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isDonor}
                  onChange={(e) => setIsDonor(e.target.checked)}
                  className="form-checkbox"
                />
                <span>I want to register as a blood donor</span>
              </label>
            </div>
          )}

          {/* Hospital Fields */}
          {selectedType === "hospital" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">
                  Hospital Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Location (e.g., Mumbai)"
                    value={location}
                    onChange={handleLocationFieldChange}
                    required
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleManualLocationCapture}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    title="Capture GPS Location"
                  >
                    📍
                  </button>
                </div>
                {locationCaptured && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ GPS location captured accurately
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedType || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up account..." : "Continue"}
          </button>
        </form>

        {/* Location Capture Component */}
        {showLocationCapture && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
              <LocationCapture
                onLocationCaptured={handleLocationCaptured}
                onSkip={handleLocationSkipped}
                purpose="complete your account setup and find nearby blood requests"
                showSkipOption={true}
                className=""
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountTypeSelection;
