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
    <div style={{ padding: 20 }}>
      <h2>
        Nearby Requests for {user?.bloodGroup} in {user?.location}
      </h2>
      {requests.length === 0 ? (
        <p>No active requests near you.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req._id} style={{ marginBottom: 10 }}>
              <strong>{req.bloodGroup}</strong> needed at{" "}
              <em>{req.location}</em> — {req.urgency}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NearbyRequests;
