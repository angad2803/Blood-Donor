"use client";

import React, { useState } from "react";
import API from "../api/api.js";

function DonorsList() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/donors", {
        params: { bloodGroup, location },
      });
      setDonors(res.data.donors);
    } catch (err) {
      console.error(err);
      setError("Error fetching donors");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-red-600 mr-2">🩸</span>
        Find Blood Donors
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group
          </label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter city or area"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Search Donors
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {donors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Found {donors.length} donor{donors.length !== 1 ? "s" : ""}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map((donor) => (
              <div
                key={donor._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 font-bold">
                      {donor.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {donor.name}
                    </h4>
                    <p className="text-sm text-gray-600">{donor.location}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Blood Group:</span>{" "}
                    {donor.bloodGroup}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {donor.location}
                  </p>
                  {donor.phone && (
                    <p>
                      <span className="font-medium">Phone:</span>
                      <a
                        href={`tel:${donor.phone}`}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        {donor.phone}
                      </a>
                    </p>
                  )}
                  {donor.email && (
                    <p>
                      <span className="font-medium">Email:</span>
                      <a
                        href={`mailto:${donor.email}`}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        {donor.email}
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(donor.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  {donor.phone && (
                    <button
                      onClick={() => window.open(`tel:${donor.phone}`)}
                      className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center justify-center"
                    >
                      <span className="mr-1">📞</span>
                      Call
                    </button>
                  )}
                  {donor.email && (
                    <button
                      onClick={() => window.open(`mailto:${donor.email}`)}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                    >
                      <span className="mr-1">✉️</span>
                      Email
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {donors.length === 0 && !loading && bloodGroup && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 mb-2">No donors found</p>
          <p className="text-sm text-gray-400">
            Try searching with different criteria
          </p>
        </div>
      )}
    </div>
  );
}

export default DonorsList;
