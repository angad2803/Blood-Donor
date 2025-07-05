"use client";

import React, { useState, useEffect } from "react";
import API from "../api/api";
import ConfirmationModal from "./ConfirmationModal";

const AdminUserManagement = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, donors, hospitals, admins

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
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/admin/users");
      setUsers(response.data.users);
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert(
        "Failed to fetch users: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (userId, userName) => {
    showConfirmation({
      title: "🗑️ Delete User",
      message: `Are you sure you want to delete user "${userName}"? This will permanently remove their account, blood requests, and offers. This action cannot be undone!`,
      type: "danger",
      icon: "🗑️",
      onConfirm: async () => {
        try {
          await API.delete(`/admin/users/${userId}`);
          alert(`User "${userName}" deleted successfully`);
          fetchUsers(); // Refresh the list
          closeConfirmation();
        } catch (error) {
          alert(
            "Failed to delete user: " +
              (error.response?.data?.message || error.message)
          );
        }
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    if (filter === "donors")
      return user.accountType === "donor" || !user.accountType;
    if (filter === "hospitals") return user.accountType === "hospital";
    if (filter === "admins")
      return (
        user.email &&
        (user.email.includes("admin") || user.email === "admin@blooddonor.com")
      );
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserTypeIcon = (user) => {
    if (
      user.email &&
      (user.email.includes("admin") || user.email === "admin@blooddonor.com")
    ) {
      return "👑";
    }
    if (user.accountType === "hospital") {
      return "🏥";
    }
    return "🩸";
  };

  const getUserTypeBadge = (user) => {
    if (
      user.email &&
      (user.email.includes("admin") || user.email === "admin@blooddonor.com")
    ) {
      return (
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
          👑 Admin
        </span>
      );
    }
    if (user.accountType === "hospital") {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          🏥 Hospital
        </span>
      );
    }
    return (
      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
        🩸 Donor
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            User Management
          </h2>
          <p className="text-gray-600">
            Manage all registered users in the system
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mt-4 md:mt-0"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-100 p-1 rounded-lg mb-6">
        <div className="flex space-x-1">
          {[
            { key: "all", label: "All Users", icon: "👥" },
            { key: "donors", label: "Donors", icon: "🩸" },
            { key: "hospitals", label: "Hospitals", icon: "🏥" },
            { key: "admins", label: "Admins", icon: "👑" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                filter === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "No users registered yet."
              : `No ${filter} found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {getUserTypeIcon(user)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="flex items-center mt-1">
                            {getUserTypeBadge(user)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        {user.bloodGroup || "Not specified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.location || "Not specified"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={closeConfirmation}
        type={confirmationModal.type}
        icon={confirmationModal.icon}
      />
    </div>
  );
};

export default AdminUserManagement;
