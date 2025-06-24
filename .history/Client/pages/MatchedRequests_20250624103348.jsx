import React, { useContext, useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { canDonateTo } from "../../Server/utils/compatability.js";

const MatchedRequests = () => {
  const { user } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get("/match");
        setMatches(res.data.matches);
      } catch (err) {
        toast.error("❌ Failed to fetch matched requests");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.isDonor) fetchMatches();
  }, [user]);

  const markFulfilled = async (id) => {
    try {
      await api.put(`/request/${id}/fulfill`);
      setMatches((prev) =>
        prev.map((r) => (r._id === id ? { ...r, fulfilled: true } : r))
      );
      toast.success("✅ Marked as fulfilled!");
    } catch (err) {
      toast.error("❌ Could not mark as fulfilled.");
      console.error(err);
    }
  };

  if (!user?.isDonor) return <p>Only donors can view matched requests.</p>;

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">
          Matched Requests
        </h2>
        {loading ? (
          <p>Loading...</p>
        ) : matches.length === 0 ? (
          <p>No compatible requests found.</p>
        ) : (
          <ul className="space-y-4">
            {matches.map((req) => (
              <li
                key={req._id}
                className="p-4 border rounded shadow bg-white flex justify-between items-center"
              >
                <div>
                  <p>
                    <strong>{req.bloodGroup}</strong> at <em>{req.location}</em>{" "}
                    — {req.urgency}
                  </p>
                  <p className="text-sm text-gray-500">
                    Requested by: {req.requester?.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    Compatible with your blood group
                  </p>
                </div>
                {!req.fulfilled && (
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => markFulfilled(req._id)}
                  >
                    Fulfill
                  </button>
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
