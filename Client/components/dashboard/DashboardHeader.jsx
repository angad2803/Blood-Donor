import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ThemeToggle from "../ui/ThemeToggle";

const DashboardHeader = ({
  user,
  logout,
  refreshUserData,
  setShowShortcutsModal,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-gray-700/30 transition-colors duration-300 dashboard-header"
      style={{
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-4">
            {/* Logo Only */}
            <div
              className="flex items-center cursor-pointer group"
              onClick={() => navigate("/")}
            >
              {/* Logo - Larger Size */}
              <div className="w-16 h-16 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 bg-transparent">
                <img
                  src="/ChatGPT-Image-Jun-27_-2025_-10_06_09-PM.svg"
                  alt="Blood Donation App"
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    // Fallback to emoji if image doesn't load
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <span className="text-red-500 text-4xl font-bold hidden">
                  🩸
                </span>
              </div>
            </div>

            {/* User Info Card - Enhanced Visibility */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-3">
                {/* User Avatar - Larger */}
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-base">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                {/* User Details - Larger and More Visible */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {user?.name}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-bold text-white bg-red-600 px-3 py-1 rounded-full shadow-sm">
                        {user?.bloodGroup}
                      </span>
                    </div>
                  </div>

                  {/* Location Info - More Visible */}
                  {user?.location && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-sm text-red-500">📍</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate max-w-40">
                        {user.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Actions - Smaller and less prominent */}
          <div className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
            {/* Theme Toggle */}
            <ThemeToggle className="mr-1" />

            {/* Hospital-specific navigation */}
            {user?.isHospital && (
              <button
                onClick={() => navigate("/hospital/requests")}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200 flex items-center space-x-1 text-sm"
                title="Manage hospital blood requests"
              >
                <span className="text-sm">🏥</span>
                <span>Hospital</span>
              </button>
            )}

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
              title="Keyboard shortcuts (?)"
            >
              <span className="text-sm">⌨️</span>
            </button>

            {/* GSAP Demo Button */}
            <button
              onClick={() => navigate("/gsap-demo")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1.5 rounded-md hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all duration-200 flex items-center space-x-1 text-xs"
              title="View GSAP Animation Demo"
            >
              <span className="text-sm">🎨</span>
              <span>Demos</span>
            </button>

            {/* Admin Cleanup Button - Only show for admin users */}
            {user?.isAdmin && (
              <button
                onClick={async () => {
                  // Refresh user data to check current admin status
                  const freshUser = await refreshUserData();
                  if (freshUser?.isAdmin) {
                    navigate("/admin-cleanup");
                  } else {
                    toast.error(
                      "Access denied. Admin privileges have been revoked."
                    );
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1.5 rounded-md hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-1 focus:ring-orange-400 transition-all duration-200 flex items-center space-x-1 text-xs"
                title="Admin Cleanup Tool"
              >
                <span className="text-sm">🧹</span>
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-400 transition-all duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
