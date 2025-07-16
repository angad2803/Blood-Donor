import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const SessionManager = () => {
  const { user, tabId, logout } = useContext(AuthContext);
  const [conflictingTabs, setConflictingTabs] = useState([]);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkConflictingSessions = () => {
      const activeTabs = JSON.parse(localStorage.getItem("activeTabs") || "[]");
      const currentTime = Date.now();

      // Find tabs with different users or multiple tabs with same user
      const conflicts = activeTabs.filter(
        (tab) =>
          tab.tabId !== tabId &&
          currentTime - tab.timestamp < 30000 && // Active within last 30 seconds
          tab.userId !== user._id // Different user
      );

      if (conflicts.length > 0) {
        setConflictingTabs(conflicts);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkConflictingSessions, 5000); // Check every 5 seconds
    checkConflictingSessions(); // Initial check

    return () => clearInterval(interval);
  }, [user, tabId]);

  const handleLogoutOtherSessions = () => {
    // Clear all localStorage to force logout on other tabs
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeTabs");

    // Trigger storage event for other tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "token",
        newValue: null,
        oldValue: localStorage.getItem("token"),
      })
    );

    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm font-medium">Session Conflict Detected</p>
          <p className="text-xs mt-1">
            Another user appears to be logged in on a different tab. This might
            cause issues.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleLogoutOtherSessions}
              className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              Clear Other Sessions
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
