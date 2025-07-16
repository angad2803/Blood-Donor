// src/pages/MatchedRequests.jsx
import React, { useContext, useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { canDonateTo } from "../../Server/utils/compatability";

const MatchedRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/request/match");
        setRequests(res.data.requests);
      } catch (err) {
        console.error("Error loading matched requests:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.isDonor) fetch();
  }, [user]);

  return (
    <div className="min-h-screen bg-purple-50 py-10 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">
          Matched Blood Requests
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No matched requests found.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req._id}
                className="p-4 border border-purple-200 rounded bg-purple-50"
              >
                <p>
                  <strong>{req.bloodGroup}</strong> at <em>{req.location}</em> —{" "}
                  {req.urgency}
                </p>
                <p className="text-sm text-gray-600">
                  Requested by: {req.requester?.name || "Unknown"}
                </p>
                {canDonateTo(user.bloodGroup, req.bloodGroup) && (
                  <small className="text-purple-600 text-xs">
                    ✅ Compatible with your blood group
                  </small>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MatchedRequests;
