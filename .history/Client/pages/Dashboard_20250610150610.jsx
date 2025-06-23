import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
      toast.success("✅ Marked as fulfilled!");
    } catch (err) {
      toast.error("❌ Could not mark as fulfilled.");
      console.error("Error marking fulfilled", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 py-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
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
              Location:{" "}
              <span className="font-semibold">{user?.location}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="mt-4 md:mt-0 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
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
        </div>
        <h3 className="text-xl font-semibold mb-4">Blood Requests</h3>
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
                  </div>
                  <div className="mt-2 md:mt-0">
                    {req.fulfilled ? (
                      <span className="text-green-600 font-semibold">
                        ✔ Fulfilled
                      </span>
                    ) : (
                      user?.isDonor && (
                        <button
                          className="ml-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                          onClick={() => markFulfilled(req._id)}
                        >
                          Mark Fulfilled
                        </button>
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
