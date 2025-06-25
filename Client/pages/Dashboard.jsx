import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api.js";
import { io } from "socket.io-client";
import { canDonateTo } from "../../Server/utils/compatability.js";

const socket = io("http://localhost:5000");

const Dashboard = () => {
  const { user, logout, loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // Requests made by the user (for requesters)
  const [fulfilledRequests, setFulfilledRequests] = useState([]); // Requests fulfilled by the user (for donors)
  const [loading, setLoading] = useState(true);

  // Handle token from OAuth redirect
  useEffect(() => {
    const token = params.get("token");
    if (token && !user) {
      // Set token and fetch user data
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/user/me")
        .then((res) => {
          loginWithToken(token, res.data.user);
        })
        .catch(() => {
          localStorage.setItem("token", token);
          navigate("/login");
        });
    }
  }, [params, user, loginWithToken, navigate]);

  // Check if user needs to complete profile
  useEffect(() => {
    if (user && user.bloodGroup === "O+" && user.location === "Unknown") {
      navigate("/complete-profile");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/request/all");

        let relevant = [];
        let userRequests = [];
        let donorFulfilled = [];

        if (user?.isDonor) {
          // Donors see unfulfilled requests they can help with
          relevant = res.data.requests.filter(
            (r) =>
              !r.fulfilled &&
              r.location === user.location &&
              canDonateTo(user.bloodGroup, r.bloodGroup)
          );

          // Also get requests they have fulfilled
          donorFulfilled = res.data.requests.filter(
            (r) => r.fulfilled && r.fulfilledBy?._id === user._id
          );
        }

        // All users can see their own requests (requests they made)
        userRequests = res.data.requests.filter(
          (r) => r.requester._id === user._id
        );

        const sorted = relevant.sort((a, b) => {
          if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const sortedUserRequests = userRequests.sort((a, b) => {
          if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const sortedFulfilled = donorFulfilled.sort((a, b) => {
          return new Date(b.fulfilledAt) - new Date(a.fulfilledAt);
        });

        setRequests(sorted);
        setMyRequests(sortedUserRequests);
        setFulfilledRequests(sortedFulfilled);
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

      // Update the requests state by moving the fulfilled request to the fulfilled list
      const fulfilledRequest = requests.find((r) => r._id === id);
      if (fulfilledRequest) {
        const updatedRequest = {
          ...fulfilledRequest,
          fulfilled: true,
          fulfilledBy: { _id: user._id, name: user.name },
          fulfilledAt: new Date(),
        };

        setRequests((prev) => prev.filter((r) => r._id !== id));
        setFulfilledRequests((prev) => [updatedRequest, ...prev]);
      }

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

        {/* My Blood Requests Section (for all users) */}
        {myRequests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-700">
              📋 Your Blood Requests
            </h3>
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req._id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    req.fulfilled
                      ? "bg-green-50 border-green-200 shadow-sm"
                      : "bg-white border-gray-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-lg">{req.bloodGroup}</strong>
                        <span className="text-gray-600">at</span>
                        <em className="text-gray-800">{req.location}</em>
                        <span className="text-gray-600">–</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            req.urgency === "urgent" ||
                            req.urgency === "Emergency"
                              ? "bg-red-100 text-red-800"
                              : req.urgency === "moderate" ||
                                req.urgency === "High"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {req.urgency}
                        </span>
                        {req.fulfilled && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            ✓ FULFILLED
                          </span>
                        )}
                      </div>

                      {req.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {req.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Requested on:{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>

                      {req.fulfilledBy?.name && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Fulfilled by: {req.fulfilledBy.name}
                          </p>
                          <p className="text-xs text-green-600">
                            Completed on:{" "}
                            {new Date(req.fulfilledAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 md:mt-0 md:ml-4 flex flex-col gap-2">
                      {req.fulfilled ? (
                        <div className="flex flex-col gap-2">
                          <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm text-center">
                            ✓ Request Completed
                          </span>
                          <Link to={`/chat/${req._id}`}>
                            <button className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium">
                              💬 View Chat History
                            </button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="inline-block px-3 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium text-sm text-center">
                            Waiting for donor
                          </span>
                          <Link to={`/chat/${req._id}`}>
                            <button className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                              💬 Chat with Donors
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Fulfilled by User (for donors) */}
        {user?.isDonor && fulfilledRequests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-green-700">
              💚 Requests You Have Fulfilled
            </h3>
            <div className="space-y-4">
              {fulfilledRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-lg border-2 bg-green-50 border-green-200 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-lg">{req.bloodGroup}</strong>
                        <span className="text-gray-600">at</span>
                        <em className="text-gray-800">{req.location}</em>
                        <span className="text-gray-600">–</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            req.urgency === "urgent" ||
                            req.urgency === "Emergency"
                              ? "bg-red-100 text-red-800"
                              : req.urgency === "moderate" ||
                                req.urgency === "High"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {req.urgency}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          ✓ FULFILLED BY YOU
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">
                        Requested by: {req.requester?.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Originally requested:{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>

                      <p className="text-xs text-green-600 font-medium">
                        Fulfilled on:{" "}
                        {new Date(req.fulfilledAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-3 md:mt-0 md:ml-4">
                      <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Requests to Fulfill (for donors) */}
        {user?.isDonor && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">
              🩸 Requests You Can Fulfill
            </h3>

            {loading ? (
              <p>Loading...</p>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No matching requests found at the moment
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  We'll notify you when new requests match your blood type and
                  location
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-lg border-2 bg-white border-gray-200 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-lg">{req.bloodGroup}</strong>
                          <span className="text-gray-600">at</span>
                          <em className="text-gray-800">{req.location}</em>
                          <span className="text-gray-600">–</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              req.urgency === "urgent" ||
                              req.urgency === "Emergency"
                                ? "bg-red-100 text-red-800"
                                : req.urgency === "moderate" ||
                                  req.urgency === "High"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </div>

                        {req.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {req.description}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 mb-1">
                          Requested by: {req.requester?.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          Requested on:{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>

                        <div className="text-xs text-blue-600 mt-1">
                          ✓ Compatible with your blood group ({user.bloodGroup})
                        </div>
                      </div>

                      <div className="mt-3 md:mt-0 md:ml-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                            onClick={() => markFulfilled(req._id)}
                          >
                            Mark Fulfilled
                          </button>
                          <Link to={`/chat/${req._id}`}>
                            <button className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium">
                              Chat
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* For Non-Donors: Show message if no requests */}
        {!user?.isDonor && myRequests.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">
              No Blood Requests Yet
            </h3>
            <p className="text-gray-500 mb-4">
              You haven't made any blood requests yet. Create your first request
              to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
