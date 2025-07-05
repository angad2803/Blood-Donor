// MatchedRequests.js
"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

// Blood group compatibility helper function
const canDonateTo = (donorGroup, recipientGroup) => {
  const compatibility = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
  };

  return compatibility[donorGroup]?.includes(recipientGroup) || false;
};

const MatchedRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchedRequests = async () => {
      try {
        const res = await fetch("/api/requests/match");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        } else {
          console.error("Failed to fetch matched requests");
        }
      } catch (err) {
        console.error("Error loading matched requests:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.isDonor) {
      fetchMatchedRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-purple-50 py-10 flex justify-center">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            Please log in to view matched requests.
          </p>
        </div>
      </div>
    );
  }

  if (!user.isDonor) {
    return (
      <div className="min-h-screen bg-purple-50 py-10 flex justify-center">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            Matched Blood Requests
          </h2>
          <p className="text-gray-600">
            This feature is only available for registered donors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-10 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">
          Matched Blood Requests
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">
              Loading matched requests...
            </span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600 mb-2">No matched requests found.</p>
            <p className="text-sm text-gray-500">
              We'll notify you when there are blood requests that match your
              donor profile.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req._id}
                className="p-4 border border-purple-200 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">
                      <span className="text-red-600">{req.bloodGroup}</span>{" "}
                      needed at{" "}
                      <em className="text-purple-700">{req.location}</em>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested by: {req.requester?.name || "Unknown"}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          req.urgency === "Emergency" ||
                          req.urgency === "urgent"
                            ? "bg-red-100 text-red-800"
                            : req.urgency === "High" ||
                                req.urgency === "moderate"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {req.urgency} Priority
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {canDonateTo(user.bloodGroup, req.bloodGroup) && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ✅ Compatible
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {req.description && (
                  <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                    {req.description}
                  </p>
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
