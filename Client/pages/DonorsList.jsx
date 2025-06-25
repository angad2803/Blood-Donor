// src/pages/DonorList.jsx
import React, { useState, useContext, useEffect } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

const DonorList = () => {
  const { user } = useContext(AuthContext);
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Set default location for hospitals
  useEffect(() => {
    if (user?.isHospital && user.location) {
      setLocation(user.location);
    }
  }, [user]);

  const fetchDonors = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = user?.isHospital ? "/user/all-donors" : "/user/donors";
      const res = await api.get(
        `${endpoint}?bloodGroup=${bloodGroup}&location=${location}`
      );
      setDonors(res.data.donors);
    } catch (err) {
      setError("No donors found or error occurred.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          {user?.isHospital
            ? `Find Donors - ${user.hospitalName}`
            : "Find Donors"}
        </h2>
        {user?.isHospital && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Hospital:</strong> {user.hospitalName} |{" "}
              <strong>Location:</strong> {user.location}
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            placeholder="Blood Group"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={fetchDonors}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        <ul className="divide-y divide-gray-200 mt-4">
          {donors.map((donor) => (
            <li
              key={donor._id}
              className="py-3 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <span className="font-semibold">{donor.name}</span>
              <span>{donor.bloodGroup}</span>
              <span>{donor.location}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DonorList;
