import React from "react";

const KeyboardShortcutsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shortcuts = [
    { key: "1", description: "Browse Blood Requests", category: "navigation" },
    { key: "2", description: "My Requests", category: "navigation" },
    { key: "3", description: "My Offers", category: "navigation" },
    { key: "4", description: "Accepted Offers", category: "navigation" },
    ...(user?.isAdmin
      ? [
          { key: "5", description: "Manage Users", category: "admin" },
          { key: "6", description: "Manage Requests", category: "admin" },
        ]
      : []),
    { key: "C", description: "Create New Request", category: "actions" },
    { key: "?", description: "Show/Hide This Help", category: "actions" },
    { key: "Esc", description: "Close Modal/Dialog", category: "actions" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Navigation
            </h3>
            {shortcuts
              .filter((s) => s.category === "navigation")
              .map((shortcut, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-gray-700 text-sm">
                    {shortcut.description}
                  </span>
                  <kbd
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      shortcut.category === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
          </div>

          {/* Admin Shortcuts */}
          {user?.isAdmin && (
            <div>
              <h3 className="text-sm font-semibold text-purple-600 mb-2">
                Admin Controls
              </h3>
              {shortcuts
                .filter((s) => s.category === "admin")
                .map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="text-gray-700 text-sm">
                      {shortcut.description}
                    </span>
                    <kbd className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>
          )}

          {/* Action Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Actions
            </h3>
            {shortcuts
              .filter((s) => s.category === "actions")
              .map((shortcut, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-gray-700 text-sm">
                    {shortcut.description}
                  </span>
                  <kbd className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: These shortcuts work when not typing in input fields
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
