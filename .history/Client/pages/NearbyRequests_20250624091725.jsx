import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const NearbyRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/request/all");
        const filtered = res.data.requests.filter(
          (r) =>
            r.bloodGroup === user.bloodGroup &&
            r.location === user.location &&
            !r.fulfilled
        );
        setRequests(filtered);
      } catch (err) {
        console.error("Error fetching requests", err);
      }
    };

    fetch();
  }, [user]);

  const handleFulfill = async (id) => {
    try {
      await api.put(`/request/${id}/fulfill`);
      toast.success("✅ Request fulfilled!");

      // Update UI
      setRequests(
        (prev) => prev.filter((r) => r._id !== id) // Remove the fulfilled one
      );
    } catch (err) {
      toast.error("❌ Failed to fulfill the request.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Nearby Requests for {user?.bloodGroup} in {user?.location}
        </h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No active requests near you.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req._id}
                className="p-4 rounded border bg-yellow-50 border-yellow-300 flex flex-col md:flex-row md:justify-between md:items-center"
              >
                <div>
                  <strong className="text-lg">{req.bloodGroup}</strong> needed
                  at <em>{req.location}</em> — {req.urgency}
                </div>
                {user?.isDonor && (
                  <button
                    onClick={() => handleFulfill(req._id)}
                    className="mt-2 md:mt-0 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
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

export default NearbyRequests;
