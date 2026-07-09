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
        let filtered;

        if (user?.isHospital) {
          // Hospitals see all requests for their hospital or in their location
          filtered = res.data.requests.filter(
            (r) =>
              ((user?.hospitalName && r.hospital === user.hospitalName) ||
                (user?.location && r.location === user.location)) &&
              !r.fulfilled
          );
        } else {
          // Donors and regular users see requests matching their blood group and location
          filtered = res.data.requests.filter(
            (r) =>
              r.bloodGroup === user.bloodGroup &&
              r.location === user.location &&
              !r.fulfilled
          );
        }

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
          {user?.isHospital
            ? `All Blood Requests for ${user.hospitalName}`
            : `Nearby Requests for ${user?.bloodGroup} in ${user?.location}`}
        </h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">
            {user?.isHospital
              ? "No active requests for your hospital at the moment."
              : "No active requests near you."}
          </p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req._id}
                className="p-4 rounded border bg-yellow-50 border-yellow-300 flex flex-col md:flex-row md:justify-between md:items-center"
              >
                <div>
                  <strong className="text-lg">{req.bloodGroup}</strong> needed
                  {req.hospital && (
                    <span>
                      {" "}
                      at{" "}
                      <em className="text-blue-800 font-medium">
                        {req.hospital}
                      </em>
                    </span>
                  )}
                  <span>
                    {" "}
                    in <em>{req.location}</em>
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      req.urgency === "Emergency"
                        ? "bg-red-100 text-red-800"
                        : req.urgency === "High"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {req.urgency}
                  </span>
                  {req.requester?.name && (
                    <p className="text-sm text-gray-600 mt-1">
                      Requested by: {req.requester.name}
                    </p>
                  )}
                </div>
                {(user?.isDonor || user?.isHospital) && (
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
