import React, { useState, useEffect } from "react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // default, danger, warning, success
  requiresTyping = false,
  typingText = "",
  icon = null,
}) => {
  const [typedText, setTypedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTypedText("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requiresTyping && typedText !== typingText) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const canConfirm = requiresTyping ? typedText === typingText : true;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          border: "border-red-200",
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          border: "border-yellow-200",
        };
      case "success":
        return {
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          confirmBtn: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
          border: "border-green-200",
        };
      default:
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          border: "border-blue-200",
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${styles.border}`}>
          <div className="flex items-center space-x-3">
            {icon && (
              <div
                className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}
              >
                <span className={`text-xl ${styles.iconColor}`}>{icon}</span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 leading-relaxed mb-4">{message}</p>

          {requiresTyping && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Type{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">
                  "{typingText}"
                </span>{" "}
                to confirm:
              </p>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  typedText === typingText
                    ? "border-green-300 focus:ring-green-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder={`Type "${typingText}" here...`}
                autoFocus
              />
              {typedText && typedText !== typingText && (
                <p className="text-sm text-red-600">
                  ❌ Text doesn't match. Please type exactly: "{typingText}"
                </p>
              )}
              {typedText === typingText && (
                <p className="text-sm text-green-600">
                  ✅ Confirmation text matches!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`flex-1 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 font-medium transition-all ${
              styles.confirmBtn
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
