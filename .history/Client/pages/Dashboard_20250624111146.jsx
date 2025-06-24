import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api.js";
import { io } from "socket.io-client";
import { canDonateTo } from "../../Server/utils/compatability.js";

const socket = io("http://localhost:5000");

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/request/all");

        let relevant = [];
        if (user?.isDonor) {
          relevant = res.data.requests.filter(
            (r) =>
              !r.fulfilled &&
              r.location === user.location &&
              canDonateTo(user.bloodGroup, r.bloodGroup)
          );
        } else {
          relevant = res.data.requests.filter((r) => r.user === user._id);
        }

        const sorted = relevant.sort((a, b) => {
          if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setRequests(sorted);
      } catch (err) {
        console.error("Error fetching requests:", err.response || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchRequests();
  }, [user]);

  useEffect(() => {
    socket.on("new-blood-request", (data) => {
      alert(`🩸 New request: ${data.bloodGroup} at ${data.location}`);
    });
    return () => socket.off("new-blood-request");
  }, []);

  const markFulfilled = async (id) => {
    try {
      await api.put(`/request/${id}/fulfill`);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, fulfilled: true } : r))
      );
      toast.success("✅ Marked as fulfilled!");
    } catch (err) {
      toast.error("❌ Could not mark as fulfilled.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 py-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        {/* Top user details */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-blue-700 mb-2">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-700">
              Blood Group:{" "}
              <span className="font-semibold">{user?.bloodGroup}</span>
            </p>
            <p className="text-gray-700">
              Location: <span className="font-semibold">{user?.location}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="mt-4 md:mt-0 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          {!user?.isDonor && (
            <Link to="/request" className="w-full md:w-auto">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
                + New Blood Request
              </button>
            </Link>
          )}
          <Link to="/nearby" className="w-full md:w-auto">
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition">
              View Nearby Requests
            </button>
          </Link>
          {user?.isDonor && (
            <Link to="/match" className="w-full md:w-auto">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition">
                View Matched Requests
              </button>
            </Link>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-4">
          {user?.isDonor ? "Requests You Can Fulfill" : "Your Blood Requests"}
        </h3>

        {/* Request List */}
        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No requests found</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req._id}
                className={`p-4 rounded border ${
                  req.fulfilled
                    ? "bg-green-50 border-green-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <strong className="text-lg">{req.bloodGroup}</strong> at{" "}
                    <em>{req.location}</em> – {req.urgency}
                    {user?.isDonor &&
                      canDonateTo(user.bloodGroup, req.bloodGroup) && (
                        <div className="text-xs text-blue-600 mt-1">
                          Compatible with your blood group
                        </div>
                      )}
                    {req.fulfilledBy?.name && (
                      <p className="text-sm text-gray-500 mt-1">
                        Fulfilled by: {req.fulfilledBy.name} on{" "}
                        {new Date(req.fulfilledAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 md:mt-0 flex gap-2">
                    {req.fulfilled ? (
                      <span className="text-green-600 font-semibold">
                        ✔ Fulfilled
                      </span>
                    ) : (
                      user?.isDonor && (
                        <>
                          <button
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            onClick={() => markFulfilled(req._id)}
                          >
                            Mark Fulfilled
                          </button>
                          <Link to={`/chat/${req._id}`}>
                            <button className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition">
                              Chat
                            </button>
                          </Link>
                        </>
                      )
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
