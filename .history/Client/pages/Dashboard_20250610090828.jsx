import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import Dashboard from "../pages/Dashboard";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/request");
        setRequests(res.data.requests);
      } catch (err) {
        console.error("Error fetching requests", err);
      }
    };

    fetchRequests();
  }, []);

  const markFulfilled = async (id) => {
    try {
      await api.put(`/request/${id}`);
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, fulfilled: true } : req))
      );
    } catch (err) {
      console.error("Error marking fulfilled", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Blood Group: {user?.bloodGroup}</p>
      <p>Location: {user?.location}</p>
      <button onClick={logout}>Logout</button>

      <h3 style={{ marginTop: 30 }}>Blood Requests</h3>
      {requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req._id} style={{ marginBottom: 10 }}>
              <strong>{req.bloodGroup}</strong> at <em>{req.location}</em> -{" "}
              {req.urgency}
              {req.fulfilled ? (
                <span style={{ color: "green" }}> ✔ Fulfilled</span>
              ) : (
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => markFulfilled(req._id)}
                >
                  Mark Fulfilled
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
