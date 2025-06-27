import React, { useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import ConfirmationModal from "./ConfirmationModal";

const AdminUserManagement = () => {
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
      const response = await api.get("/admin/users");
      setUsers(response.data.users);
    } catch (error) {
      toast.error(
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
          await api.delete(`/admin/users/${userId}`);
          toast.success(`User "${userName}" deleted successfully`);
          fetchUsers(); // Refresh the list
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to delete user: " +
              (error.response?.data?.message || error.message)
          );
        }
      },
    });
  };

  const toggleAdminStatus = (userId, userName, isCurrentlyAdmin) => {
    const action = isCurrentlyAdmin
      ? "remove admin privileges from"
      : "grant admin privileges to";
    const actionType = isCurrentlyAdmin ? "Remove" : "Grant";

    showConfirmation({
      title: `${
        isCurrentlyAdmin ? "👑➡️" : "➡️👑"
      } ${actionType} Admin Privileges`,
      message: `Are you sure you want to ${action} "${userName}"? ${
        isCurrentlyAdmin
          ? "This will remove their administrative access and they won't be able to manage users or perform admin actions."
          : "This will give them full administrative access including user management and system control."
      }`,
      type: isCurrentlyAdmin ? "warning" : "default",
      icon: isCurrentlyAdmin ? "👑➡️" : "➡️👑",
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${userId}/admin`, {
            isAdmin: !isCurrentlyAdmin,
          });
          toast.success(`Admin status updated for "${userName}"`);
          fetchUsers(); // Refresh the list
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to update admin status: " +
              (error.response?.data?.message || error.message)
          );
        }
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    switch (filter) {
      case "donors":
        return user.isDonor;
      case "hospitals":
        return user.isHospital;
      case "admins":
        return user.isAdmin;
      default:
        return true;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              👥 User Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage users, permissions, and accounts
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex space-x-4">
          {[
            { id: "all", label: "All Users", icon: "👥" },
            { id: "donors", label: "Donors", icon: "🩸" },
            { id: "hospitals", label: "Hospitals", icon: "🏥" },
            { id: "admins", label: "Admins", icon: "👑" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                filter === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="bg-white text-xs px-2 py-0.5 rounded-full">
                {tab.id === "all"
                  ? users.length
                  : users.filter((u) => {
                      switch (tab.id) {
                        case "donors":
                          return u.isDonor;
                        case "hospitals":
                          return u.isHospital;
                        case "admins":
                          return u.isAdmin;
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-500">
              No users found for the selected filter
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {user.isAdmin && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                            👑 Admin
                          </span>
                        )}
                        {user.isDonor && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                            🩸 Donor
                          </span>
                        )}
                        {user.isHospital && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            🏥 Hospital
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p>
                        <strong>Blood Group:</strong>{" "}
                        {user.bloodGroup || "Not specified"}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {user.location || "Not specified"}
                      </p>
                      <p>
                        <strong>Joined:</strong>{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      {user.lastLoginAt && (
                        <p>
                          <strong>Last Login:</strong>{" "}
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Admin Toggle Button */}
                    <button
                      onClick={() =>
                        toggleAdminStatus(user._id, user.name, user.isAdmin)
                      }
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteUser(user._id, user.name)}
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

export default AdminUserManagement;
