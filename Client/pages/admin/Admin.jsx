import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import AdminUserManagement from "../../components/admin/AdminUserManagement";
import AdminRequestManagement from "../../components/admin/AdminRequestManagement";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(null); // null = loading, false = not admin, true = admin
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    activeRequests: 0,
    fulfilledRequests: 0,
  });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatusAndStats = async () => {
      try {
        // First check if user email is admin email (quick check)
        if (user?.email === "angad.28.03.2005@gmail.com") {
          setIsAdmin(true);
          return;
        }

        // Then check via API
        const response = await api.get("/admin/check-admin");
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        setIsAdmin(false);
        if (error.response?.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        }
      }
    };

    checkAdminStatusAndStats();
  }, [user?.email]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [usersResponse, requestsResponse] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/requests"),
      ]);

      const users = usersResponse.data.users;
      const requests = requestsResponse.data.requests;

      setStats({
        totalUsers: users.length,
        totalRequests: requests.length,
        activeRequests: requests.filter((r) => !r.fulfilled).length,
        fulfilledRequests: requests.filter((r) => r.fulfilled).length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="glass-morphism p-8 rounded-2xl text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, redirect to dashboard
  if (isAdmin === false) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      {/* Glassmorphism Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="glass-morphism p-6 rounded-2xl mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                🛡️ Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Manage your blood donation platform.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {!isAdmin ? (
          <div className="glass-morphism p-6 rounded-2xl border border-red-200 bg-red-50/50">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Access Denied
              </h2>
              <p className="text-red-700">
                This area requires administrator privileges. Contact your system
                administrator to gain access.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-morphism p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="glass-morphism p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl mb-2">🩸</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.totalRequests}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="glass-morphism p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl mb-2">🔄</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.activeRequests}
                </div>
                <div className="text-sm text-gray-600">Active Requests</div>
              </div>
              <div className="glass-morphism p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.fulfilledRequests}
                </div>
                <div className="text-sm text-gray-600">Fulfilled Requests</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="glass-morphism p-1 rounded-2xl mb-8 shadow-lg">
              <div className="flex flex-wrap">
                {[
                  { id: "users", label: "User Management", icon: "👥" },
                  { id: "requests", label: "Request Management", icon: "🩸" },
                  { id: "cleanup", label: "System Cleanup", icon: "🧹" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-0 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="glass-morphism p-6 rounded-2xl shadow-xl">
              {activeTab === "users" && (
                <div>
                  <AdminUserManagement />
                </div>
              )}

              {activeTab === "requests" && (
                <div>
                  <AdminRequestManagement />
                </div>
              )}

              {activeTab === "cleanup" && (
                <div className="space-y-6">
                  <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 p-6 rounded-xl">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">⚠️</span>
                      <h3 className="text-lg font-semibold text-yellow-800">
                        System Cleanup Tools
                      </h3>
                    </div>
                    <p className="text-yellow-700">
                      These tools allow you to perform system maintenance and
                      cleanup operations. Use with caution as these actions are
                      irreversible.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 rounded-xl">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🧹</div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          Advanced Cleanup
                        </h4>
                        <p className="text-gray-600 mb-4 text-sm">
                          Access the full cleanup dashboard with test data
                          management and danger zone operations.
                        </p>
                        <button
                          onClick={() => navigate("/admin-cleanup")}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                          Open Cleanup Dashboard
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 rounded-xl">
                      <div className="text-center">
                        <div className="text-4xl mb-3">📊</div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          Queue Dashboard
                        </h4>
                        <p className="text-gray-600 mb-4 text-sm">
                          Monitor background jobs and message queue processing
                          in real-time.
                        </p>
                        <button
                          onClick={() => window.open("/admin/queues", "_blank")}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                          Open Queue Monitor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
