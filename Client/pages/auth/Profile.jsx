import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 text-center shadow-xl">
          <p className="text-gray-600 dark:text-gray-300 text-lg">Not logged in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
              <span className="text-3xl">{user.isDonor ? "🩸" : "🏥"}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.name}
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-1.5 rounded-full inline-block">
              <span className="font-medium text-sm">
                {user.isDonor
                  ? "Blood Donor"
                  : user.isHospital
                    ? "Hospital"
                    : "User"}
              </span>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl opacity-80">📧</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {user.bloodGroup && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">🩸</span>
                  <div>
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">Blood Group</p>
                    <p className="text-red-700 dark:text-red-300 font-bold text-lg">
                      {user.bloodGroup}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl opacity-80">📍</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Location</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user.location || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl opacity-80">{user.isDonor ? "💖" : "🏥"}</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Account Type</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user.isDonor
                      ? "Active Donor"
                      : user.isHospital
                        ? "Medical Institution"
                        : "Standard User"}
                  </p>
                </div>
              </div>
            </div>

            {user.isHospital && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl opacity-80">🏥</span>
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Hospital Name</p>
                      <p className="text-blue-900 dark:text-blue-200 font-medium">
                        {user.hospitalName}
                      </p>
                    </div>
                  </div>
                  {user.hospitalAddress && (
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl opacity-80">🏢</span>
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                          Hospital Address
                        </p>
                        <p className="text-blue-900 dark:text-blue-200 font-medium">
                          {user.hospitalAddress}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors border border-gray-300 dark:border-gray-600 flex items-center justify-center"
              >
                <span className="mr-2">←</span>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
