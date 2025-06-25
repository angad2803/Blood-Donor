import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api.js";
import { io } from "socket.io-client";
import { canDonateTo } from "../../Server/utils/compatability.js";

const socket = io("http://localhost:5000");

const Dashboard = () => {
  const { user, logout, logoutCurrentTab, loginWithToken, tabId } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // Requests made by the user (for requesters)
  const [fulfilledRequests, setFulfilledRequests] = useState([]); // Requests fulfilled by the user (for donors)
  const [loading, setLoading] = useState(true);
  const [crossedOutRequests, setCrossedOutRequests] = useState(() => {
    // Load crossed out requests from localStorage
    const saved = localStorage.getItem("crossedOutRequests");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }); // Track crossed out fulfilled requests
  const [showCrossedOut, setShowCrossedOut] = useState(true); // Toggle to show/hide crossed out requests

  const toggleCrossOut = (requestId) => {
    setCrossedOutRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      // Save to localStorage
      localStorage.setItem("crossedOutRequests", JSON.stringify([...newSet]));
      return newSet;
    });
  };

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
        // But we only show this section for non-donors in the UI
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

    // Make fetchRequests available for socket event handlers
    window.fetchRequests = fetchRequests;
  }, [user]);

  useEffect(() => {
    socket.on("new-blood-request", (data) => {
      alert(`🩸 New request: ${data.bloodGroup} at ${data.location}`);
    });

    socket.on("new-fulfillment-offer", (data) => {
      if (
        user &&
        data.requestId &&
        myRequests.some((req) => req._id === data.requestId)
      ) {
        toast.info(
          `💝 New offer from ${data.donorName} for your blood request!`
        );
        // Refresh requests to show new offer
        if (window.fetchRequests) window.fetchRequests();
      }
    });

    socket.on("offer-response", (data) => {
      if (user && data.donorId === user._id) {
        if (data.action === "accept") {
          toast.success(`✅ Your offer was accepted by ${data.requesterName}!`);
        } else {
          toast.info(`ℹ️ Your offer was declined by ${data.requesterName}`);
        }
        // Refresh requests to update status
        if (window.fetchRequests) window.fetchRequests();
      }
    });

    return () => {
      socket.off("new-blood-request");
      socket.off("new-fulfillment-offer");
      socket.off("offer-response");
    };
  }, [user, myRequests]);

  // Function for donors to send fulfillment offers
  const sendOffer = async (requestId, message = "") => {
    try {
      await api.post(`/request/${requestId}/offer`, { message });
      toast.success("🤝 Fulfillment offer sent successfully!");

      // Refresh requests to update UI
      const res = await api.get("/request/all");
      const sorted = res.data.requests
        .filter(
          (r) =>
            !r.fulfilled &&
            r.location === user.location &&
            canDonateTo(user.bloodGroup, r.bloodGroup)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(sorted);
    } catch (err) {
      toast.error(
        "❌ Could not send offer. " + (err.response?.data?.message || "")
      );
      console.error(err);
    }
  };

  // Function for requesters to respond to offers
  const respondToOffer = async (requestId, offerId, action) => {
    try {
      await api.put(`/request/${requestId}/offer/${offerId}/${action}`);
      toast.success(
        action === "accept" ? "✅ Offer accepted!" : "ℹ️ Offer declined"
      );

      // Refresh requests to update status
      const res = await api.get("/request/all");
      const userRequests = res.data.requests.filter(
        (r) => r.requester._id === user._id
      );
      setMyRequests(
        userRequests.sort((a, b) => {
          if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      );

      if (action === "accept") {
        // If accepted, also update fulfilled requests for donors
        const fulfilledRequest = userRequests.find((r) => r._id === requestId);
        if (fulfilledRequest && user?.isDonor) {
          setFulfilledRequests((prev) => [fulfilledRequest, ...prev]);
        }
      }
    } catch (err) {
      toast.error(
        "❌ Could not respond to offer. " + (err.response?.data?.message || "")
      );
      console.error(err);
    }
  };

  // Legacy function - kept for backward compatibility
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
            <p className="text-xs text-gray-500 mt-1">
              Tab ID: {tabId?.substring(0, 12)}... | User ID:{" "}
              {user?._id?.substring(0, 8)}...
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => logout(true)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout All Tabs
            </button>
            <button
              onClick={() => logoutCurrentTab()}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
            >
              Logout This Tab
            </button>
          </div>
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

        {/* My Blood Requests Section (for requesters only - non-donors) */}
        {!user?.isDonor && myRequests.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-blue-700">
                📋 Your Blood Requests
                {crossedOutRequests.size > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({crossedOutRequests.size} crossed out)
                  </span>
                )}
              </h3>
              {myRequests.some(
                (req) => req.fulfilled && crossedOutRequests.has(req._id)
              ) && (
                <button
                  onClick={() => setShowCrossedOut(!showCrossedOut)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {showCrossedOut
                    ? "🙈 Hide Crossed Out"
                    : "👀 Show Crossed Out"}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {myRequests
                .filter(
                  (req) => showCrossedOut || !crossedOutRequests.has(req._id)
                )
                .map((req) => (
                  <div
                    key={req._id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      req.fulfilled
                        ? "bg-green-50 border-green-200 shadow-sm"
                        : "bg-white border-gray-200 shadow-md hover:shadow-lg"
                    } ${crossedOutRequests.has(req._id) ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div
                        className={`flex-1 ${
                          crossedOutRequests.has(req._id) ? "line-through" : ""
                        }`}
                      >
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
                          {req.fulfilled && (
                            <button
                              onClick={() => toggleCrossOut(req._id)}
                              className={`ml-2 px-2 py-1 rounded text-xs font-medium transition ${
                                crossedOutRequests.has(req._id)
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title={
                                crossedOutRequests.has(req._id)
                                  ? "Restore request"
                                  : "Cross out request"
                              }
                            >
                              {crossedOutRequests.has(req._id)
                                ? "↶ Restore"
                                : "✕ Cross Out"}
                            </button>
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

                        {/* Show fulfillment offers for unfulfilled requests */}
                        {!req.fulfilled &&
                          req.fulfillmentOffers &&
                          req.fulfillmentOffers.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                💝 Fulfillment Offers (
                                {req.fulfillmentOffers.length})
                              </p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {req.fulfillmentOffers.map((offer) => (
                                  <div
                                    key={offer._id}
                                    className={`p-2 rounded border text-xs ${
                                      offer.status === "pending"
                                        ? "bg-blue-50 border-blue-200"
                                        : offer.status === "accepted"
                                        ? "bg-green-50 border-green-200"
                                        : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-medium">
                                        {offer.donor.name}
                                      </span>
                                      <span
                                        className={`px-1 py-0.5 rounded text-xs ${
                                          offer.status === "pending"
                                            ? "bg-blue-100 text-blue-800"
                                            : offer.status === "accepted"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {offer.status}
                                      </span>
                                    </div>
                                    {offer.message && (
                                      <p className="text-gray-600 text-xs mb-2">
                                        {offer.message}
                                      </p>
                                    )}
                                    {offer.status === "pending" && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            respondToOffer(
                                              req._id,
                                              offer._id,
                                              "accept"
                                            )
                                          }
                                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() =>
                                            respondToOffer(
                                              req._id,
                                              offer._id,
                                              "reject"
                                            )
                                          }
                                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                        >
                                          ✗ Decline
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
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
                          {/* Check if user already made an offer */}
                          {req.fulfillmentOffers &&
                          req.fulfillmentOffers.some(
                            (offer) => offer.donor._id === user._id
                          ) ? (
                            <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                              {req.fulfillmentOffers.find(
                                (offer) => offer.donor._id === user._id
                              )?.status === "pending"
                                ? "🕒 Offer Sent"
                                : req.fulfillmentOffers.find(
                                    (offer) => offer.donor._id === user._id
                                  )?.status === "rejected"
                                ? "❌ Offer Declined"
                                : "✅ Offer Accepted"}
                            </span>
                          ) : (
                            <button
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                              onClick={() =>
                                sendOffer(
                                  req._id,
                                  `Hi! I'm ${user.bloodGroup} and available to help with your blood request in ${user.location}.`
                                )
                              }
                            >
                              🤝 Send Offer
                            </button>
                          )}
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

        {/* Requests Fulfilled by User (for donors) */}
        {user?.isDonor && fulfilledRequests.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-700">
                💚 Requests You Have Fulfilled
                {fulfilledRequests.filter((req) =>
                  crossedOutRequests.has(req._id)
                ).length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    (
                    {
                      fulfilledRequests.filter((req) =>
                        crossedOutRequests.has(req._id)
                      ).length
                    }{" "}
                    crossed out)
                  </span>
                )}
              </h3>
              {fulfilledRequests.some((req) =>
                crossedOutRequests.has(req._id)
              ) && (
                <button
                  onClick={() => setShowCrossedOut(!showCrossedOut)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {showCrossedOut
                    ? "🙈 Hide Crossed Out"
                    : "👀 Show Crossed Out"}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {fulfilledRequests
                .filter(
                  (req) => showCrossedOut || !crossedOutRequests.has(req._id)
                )
                .map((req) => (
                  <div
                    key={req._id}
                    className={`p-4 rounded-lg border-2 bg-green-50 border-green-200 shadow-sm transition-all ${
                      crossedOutRequests.has(req._id) ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div
                        className={`flex-1 ${
                          crossedOutRequests.has(req._id) ? "line-through" : ""
                        }`}
                      >
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
                          <button
                            onClick={() => toggleCrossOut(req._id)}
                            className={`ml-2 px-2 py-1 rounded text-xs font-medium transition ${
                              crossedOutRequests.has(req._id)
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={
                              crossedOutRequests.has(req._id)
                                ? "Restore request"
                                : "Cross out request"
                            }
                          >
                            {crossedOutRequests.has(req._id)
                              ? "↶ Restore"
                              : "✕ Cross Out"}
                          </button>
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
