import React, { useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import ConfirmationModal from "./ConfirmationModal";

const AdminRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, active, fulfilled, urgent

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "default",
    icon: null,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  // Helper function to show confirmation modal
  const showConfirmation = ({
    title,
    message,
    onConfirm,
    type = "default",
    icon = null,
  }) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      icon,
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
      type: "default",
      icon: null,
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/requests");
      setRequests(response.data.requests);
    } catch (error) {
      toast.error(
        "Failed to fetch requests: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = (requestId, bloodGroup, location) => {
    showConfirmation({
      title: "🗑️ Delete Blood Request",
      message: `Are you sure you want to delete the ${bloodGroup} blood request from ${location}? This will permanently remove the request and all associated offers. This action cannot be undone!`,
      type: "danger",
      icon: "🗑️",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/requests/${requestId}`);
          toast.success(`Blood request deleted successfully`);
          fetchRequests(); // Refresh the list
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to delete request: " +
              (error.response?.data?.message || error.message)
          );
        }
      },
    });
  };

  const toggleFulfillmentStatus = (
    requestId,
    bloodGroup,
    location,
    isCurrentlyFulfilled
  ) => {
    const action = isCurrentlyFulfilled
      ? "mark as active"
      : "mark as fulfilled";
    const actionType = isCurrentlyFulfilled
      ? "Reactivate"
      : "Mark as Fulfilled";

    showConfirmation({
      title: `${isCurrentlyFulfilled ? "🔄" : "✅"} ${actionType} Request`,
      message: `Are you sure you want to ${action} the ${bloodGroup} blood request from ${location}? ${
        isCurrentlyFulfilled
          ? "This will make the request active again and available for new offers."
          : "This will mark the request as completed and stop accepting new offers."
      }`,
      type: isCurrentlyFulfilled ? "default" : "success",
      icon: isCurrentlyFulfilled ? "🔄" : "✅",
      onConfirm: async () => {
        try {
          await api.put(`/admin/requests/${requestId}/status`, {
            fulfilled: !isCurrentlyFulfilled,
          });
          toast.success(`Request status updated successfully`);
          fetchRequests(); // Refresh the list
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to update request status: " +
              (error.response?.data?.message || error.message)
          );
        }
      },
    });
  };

  const filteredRequests = requests.filter((request) => {
    switch (filter) {
      case "active":
        return !request.fulfilled;
      case "fulfilled":
        return request.fulfilled;
      case "urgent":
        return request.urgency === "high" || request.urgency === "critical";
      default:
        return true;
    }
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              🩸 Request Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage blood requests and their status
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex space-x-4">
          {[
            { id: "all", label: "All Requests", icon: "📋" },
            { id: "active", label: "Active", icon: "🔴" },
            { id: "fulfilled", label: "Fulfilled", icon: "✅" },
            { id: "urgent", label: "Urgent", icon: "🚨" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                filter === tab.id
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="bg-white text-xs px-2 py-0.5 rounded-full">
                {tab.id === "all"
                  ? requests.length
                  : requests.filter((r) => {
                      switch (tab.id) {
                        case "active":
                          return !r.fulfilled;
                        case "fulfilled":
                          return r.fulfilled;
                        case "urgent":
                          return (
                            r.urgency === "high" || r.urgency === "critical"
                          );
                        default:
                          return true;
                      }
                    }).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">
              No requests found for the selected filter
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-red-600 flex items-center">
                        <span className="mr-2">🩸</span>
                        {request.bloodGroup} Blood Request
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor(
                            request.urgency
                          )}`}
                        >
                          {request.urgency?.toUpperCase() || "NORMAL"}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            request.fulfilled
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.fulfilled ? "FULFILLED" : "ACTIVE"}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Requester:</strong>{" "}
                        {request.requester?.name || request.requesterName}
                      </p>
                      <p>
                        <strong>Location:</strong> {request.location}
                      </p>
                      <p>
                        <strong>Contact:</strong>{" "}
                        {request.requester?.email || "N/A"}
                      </p>
                      <p>
                        <strong>Created:</strong>{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {request.description && (
                        <p>
                          <strong>Description:</strong> {request.description}
                        </p>
                      )}
                      {request.offers && (
                        <p>
                          <strong>Offers Received:</strong>{" "}
                          {request.offers.length}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Toggle Status Button */}
                    <button
                      onClick={() =>
                        toggleFulfillmentStatus(
                          request._id,
                          request.bloodGroup,
                          request.location,
                          request.fulfilled
                        )
                      }
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        request.fulfilled
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {request.fulfilled ? "Mark Active" : "Mark Fulfilled"}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() =>
                        deleteRequest(
                          request._id,
                          request.bloodGroup,
                          request.location
                        )
                      }
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beautiful Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        icon={confirmationModal.icon}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminRequestManagement;
