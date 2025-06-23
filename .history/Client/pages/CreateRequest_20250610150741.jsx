import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api.js";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    bloodGroup: user?.bloodGroup || "",
    location: user?.location || "",
    urgency: "Normal",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/request/create", form);
      setSuccess("Request created successfully!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    }
    setLoading(false);
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

      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          Create Blood Request
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md"
        >
          <input
            name="bloodGroup"
            placeholder="Blood Group (e.g., A+)"
            value={form.bloodGroup}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="location"
            placeholder="Location (e.g., Mumbai)"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="urgency"
            value={form.urgency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "+ Create Request"}
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm text-center mt-2">{success}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
