import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import AdminUserManagement from "./AdminUserManagement";
import AdminRequestManagement from "./AdminRequestManagement";
import ConfirmationModal from "./ConfirmationModal";

const AdminCleanup = () => {
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("cleanup");
  const { user } = useContext(AuthContext);

  // Confirmation modal states
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "default",
    requiresTyping: false,
    typingText: "",
    icon: null,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await api.get("/admin/check-admin");
      setIsAdmin(response.data.isAdmin);
    } catch (error) {
      setIsAdmin(false);
      if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      }
    }
  };

  const checkTestData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/test-data-count");
      setTestData(response.data);
      toast.info(`Found ${response.data.testData.users} test users`);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in.");
      } else {
        toast.error(
          "Failed to check test data: " +
            (error.response?.data?.message || error.message)
        );
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show confirmation modal
  const showConfirmation = ({
    title,
    message,
    onConfirm,
    type = "default",
    requiresTyping = false,
    typingText = "",
    icon = null,
  }) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      requiresTyping,
      typingText,
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
      requiresTyping: false,
      typingText: "",
      icon: null,
    });
  };

  const cleanupTestData = () => {
    showConfirmation({
      title: "🧹 Cleanup Test Data",
      message:
        "Are you sure you want to delete all test data? This will remove test users like Alice Singh and their associated requests and offers. This action cannot be undone!",
      type: "warning",
      icon: "🧹",
      onConfirm: async () => {
        try {
          setLoading(true);
          const response = await api.delete("/admin/cleanup-test-data");
          toast.success(
            `Cleanup completed! Deleted: ${response.data.deleted.users} users, ${response.data.deleted.requests} requests, ${response.data.deleted.offers} offers`
          );
          setTestData(null);
          closeConfirmation();
        } catch (error) {
          if (error.response?.status === 403) {
            toast.error("Access denied. Admin privileges required.");
          } else if (error.response?.status === 401) {
            toast.error("Authentication required. Please log in.");
          } else {
            toast.error(
              "Failed to cleanup test data: " +
                (error.response?.data?.message || error.message)
            );
          }
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const deleteAllUsers = () => {
    showConfirmation({
      title: "🚨 DELETE ALL USERS",
      message:
        "⚠️ EXTREME DANGER: This will permanently delete ALL user accounts except yourself, along with ALL blood requests and offers. This action cannot be undone and will completely wipe the user database!",
      type: "danger",
      icon: "🚨",
      requiresTyping: true,
      typingText: "DELETE ALL",
      onConfirm: async () => {
        try {
          setLoading(true);
          const response = await api.delete("/admin/delete-all-users");
          toast.success(
            `All users deleted! Removed: ${response.data.deleted.users} users, ${response.data.deleted.requests} requests, ${response.data.deleted.offers} offers`
          );
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to delete all users: " +
              (error.response?.data?.message || error.message)
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const deleteAllRequests = () => {
    showConfirmation({
      title: "🗑️ DELETE ALL BLOOD REQUESTS",
      message:
        "⚠️ WARNING: This will permanently delete ALL blood requests and related offers from the system. This action cannot be undone and will remove all pending and completed blood donation requests!",
      type: "danger",
      icon: "🗑️",
      requiresTyping: true,
      typingText: "DELETE REQUESTS",
      onConfirm: async () => {
        try {
          setLoading(true);
          const response = await api.delete("/admin/delete-all-requests");
          toast.success(
            `All requests deleted! Removed: ${response.data.deleted.requests} requests, ${response.data.deleted.offers} offers`
          );
          closeConfirmation();
        } catch (error) {
          toast.error(
            "Failed to delete all requests: " +
              (error.response?.data?.message || error.message)
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-red-600">
        ⚠️ Admin Control Panel
      </h1>

      {!isAdmin ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-800">
            <strong>Access Denied:</strong> This tool requires admin privileges.
            Contact your system administrator to gain access.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <p className="text-green-800">
              <strong>Admin Access Confirmed:</strong> Welcome, {user?.name}!
              You have full administrative control over the system.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: "cleanup", label: "Test Data Cleanup", icon: "🧹" },
                { id: "users", label: "User Management", icon: "👥" },
                { id: "requests", label: "Request Management", icon: "🩸" },
                { id: "danger", label: "Danger Zone", icon: "🚨" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? tab.id === "danger"
                        ? "border-red-500 text-red-600"
                        : "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "cleanup" && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800">
                  <strong>Test Data Cleanup:</strong> This tool will remove test
                  users like Alice Singh and other test data. This is safe for
                  production cleanup.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={checkTestData}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Checking..." : "Check Test Data"}
                </button>

                {testData && (
                  <div className="bg-white border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-3">
                      Test Data Found:
                    </h2>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {testData.testData.users}
                        </div>
                        <div className="text-sm text-gray-600">Test Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {testData.testData.requests}
                        </div>
                        <div className="text-sm text-gray-600">
                          Test Requests
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {testData.testData.offers}
                        </div>
                        <div className="text-sm text-gray-600">Test Offers</div>
                      </div>
                    </div>

                    {testData.testUsers.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Test Users Found:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {testData.testUsers.map((user, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {user.name} ({user.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testData.testData.users > 0 && (
                      <button
                        onClick={cleanupTestData}
                        disabled={loading}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? "Cleaning..." : "🗑️ Delete All Test Data"}
                      </button>
                    )}

                    {testData.testData.users === 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-700">
                          ✅ No test data found! Database is clean.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">
                    What test cleanup removes:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Users named: Alice Singh, test1, test2</li>
                    <li>
                      • Users with emails: test@example.com, alice@test.com,
                      alice.singh@test.com
                    </li>
                    <li>• All blood requests created by these users</li>
                    <li>• All offers sent by or to these users</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && <AdminUserManagement />}
          {activeTab === "requests" && <AdminRequestManagement />}

          {activeTab === "danger" && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800">
                  <strong>⚠️ DANGER ZONE:</strong> These actions will
                  permanently delete ALL data and cannot be undone. Use with
                  extreme caution!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delete All Users */}
                <div className="bg-white border-2 border-red-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🗑️👥</div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">
                      Delete All Users
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This will delete ALL users except yourself, along with all
                      their requests and offers.
                    </p>
                    <button
                      onClick={deleteAllUsers}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {loading ? "Deleting..." : "🚨 DELETE ALL USERS"}
                    </button>
                  </div>
                </div>

                {/* Delete All Requests */}
                <div className="bg-white border-2 border-red-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🗑️🩸</div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">
                      Delete All Blood Requests
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This will delete ALL blood requests and related offers
                      from the system.
                    </p>
                    <button
                      onClick={deleteAllRequests}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {loading ? "Deleting..." : "🚨 DELETE ALL REQUESTS"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-yellow-800">
                  Safety Features:
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Multiple confirmation dialogs required</li>
                  <li>• You cannot delete your own admin account</li>
                  <li>• All actions are logged on the server</li>
                  <li>• Requires typing exact confirmation text</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* Beautiful Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        requiresTyping={confirmationModal.requiresTyping}
        typingText={confirmationModal.typingText}
        icon={confirmationModal.icon}
        confirmText={
          confirmationModal.requiresTyping ? "Delete Forever" : "Confirm"
        }
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminCleanup;
