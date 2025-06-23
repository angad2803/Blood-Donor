import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const endpoint = user?.isDonor
          ? "/request"
          : `/request/user/${user._id}`;
        const res = await api.get(endpoint);

        const sortedRequests = res.data.requests.sort((a, b) => {
          if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setRequests(sortedRequests);
      } catch (err) {
        console.error("Error fetching requests", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchRequests();
  }, [user]);

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
      <button onClick={logout} style={{ marginBottom: 20 }}>
        Logout
      </button>      {!user?.isDonor && (
        <Link to="/request">
          <button
            style={{
              padding: "10px 15px",
              marginBottom: 20,
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            + New Blood Request
          </button>
        </Link>
      )}

      <h3>Blood Requests</h3>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {requests.map((req) => (
            <li
              key={req._id}
              style={{
                listStyle: "none",
                padding: 10,
                marginBottom: 10,
                border: "1px solid #ccc",
                borderRadius: 5,
                backgroundColor: req.fulfilled ? "#e0ffe0" : "#fff",
              }}
            >
              <strong>{req.bloodGroup}</strong> at <em>{req.location}</em> –{" "}
              {req.urgency}
              {req.fulfilled ? (
                <span style={{ color: "green", marginLeft: 10 }}>
                  ✔ Fulfilled
                </span>
              ) : (
                user?.isDonor && (
                  <button
                    style={{ marginLeft: 10 }}
                    onClick={() => markFulfilled(req._id)}
                  >
                    Mark Fulfilled
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
