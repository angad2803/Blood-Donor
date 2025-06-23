import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

const NearbyRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/request");
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
                className="p-4 rounded border bg-yellow-50 border-yellow-300"
              >
                <strong className="text-lg">{req.bloodGroup}</strong> needed at{" "}
                <em>{req.location}</em> — {req.urgency}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NearbyRequests;
