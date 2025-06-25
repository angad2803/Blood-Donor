import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
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
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-700">
            Welcome, {user?.name}!
          </h2>
          <p className="text-gray-600 mt-2">
            Please select your account type to continue
          </p>
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

              <input
                type="text"
                placeholder="Location (e.g., Mumbai)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

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

              <input
                type="text"
                placeholder="Location (e.g., Mumbai)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
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
      </div>
    </div>
  );
};

export default AccountTypeSelection;
