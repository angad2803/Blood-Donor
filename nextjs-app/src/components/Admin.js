"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import AdminUserManagement from "../components/AdminUserManagement";
import AdminRequestManagement from "../components/AdminRequestManagement";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatusAndStats = async () => {
      try {
        // First check if user email suggests admin access
        if (
          user?.email &&
          (user.email.includes("admin") ||
            user.email === "admin@blooddonor.com" ||
            user.email === "angad.28.03.2005@gmail.com")
        ) {
          setIsAdmin(true);
          return;
        }

        // Then check via API
        const response = await API.get("/admin/check-admin");
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        setIsAdmin(false);
        if (error.response?.status === 403) {
          alert("Access denied. Admin privileges required.");
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
        API.get("/admin/users"),
        API.get("/admin/requests"),
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
      // Fallback for requests if admin requests API fails
      if (error.response?.status === 404 || error.response?.status === 500) {
        try {
          const usersResponse = await API.get("/admin/users");
          const users = usersResponse.data.users;
          setStats({
            totalUsers: users.length,
            totalRequests: 0,
            activeRequests: 0,
            fulfilledRequests: 0,
          });
        } catch (fallbackError) {
          console.error("Failed to fetch fallback stats:", fallbackError);
        }
      }
    }
  };

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm p-8 rounded-2xl text-center shadow-xl">
          <LoadingSpinner size="lg" message="Checking admin access..." />
        </div>
      </div>
    );
  }

  // If user is not admin, redirect to dashboard
  if (isAdmin === false) {
    if (typeof window !== "undefined") {
      router.push("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-2xl mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <span className="text-4xl mr-3">🛡️</span>
                Blood Donor Admin Panel
              </h1>
              <p className="text-gray-600">
                Welcome back, <strong>{user?.name}</strong>. Manage users,
                requests, and system settings.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📋</div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalRequests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🔄</div>
              <div>
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.activeRequests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-sm text-gray-600">Fulfilled</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.fulfilledRequests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white bg-opacity-80 backdrop-blur-sm p-1 rounded-xl shadow-lg mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === "users"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white hover:bg-opacity-50"
              }`}
            >
              <span className="mr-2">👥</span>
              User Management
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === "requests"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white hover:bg-opacity-50"
              }`}
            >
              <span className="mr-2">📋</span>
              Request Management
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === "system"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white hover:bg-opacity-50"
              }`}
            >
              <span className="mr-2">⚙️</span>
              System Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl">
          {activeTab === "users" && (
            <AdminUserManagement onStatsUpdate={fetchStats} />
          )}

          {activeTab === "requests" && (
            <AdminRequestManagement onStatsUpdate={fetchStats} />
          )}

          {activeTab === "system" && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                System Settings
              </h3>
              <p className="text-gray-600 mb-4">
                Configure system-wide settings and preferences.
              </p>
              <p className="text-sm text-gray-500">
                This feature will be implemented in the next update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
