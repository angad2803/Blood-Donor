"use client";

import React, { useState, useEffect } from "react";

const ConfirmationModal = ({
  isOpen,
  onCancel,
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
      if (onConfirm) {
        await onConfirm();
      }
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-2">
                  Type <strong>"{typingText}"</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={typingText}
                  autoComplete="off"
                />
              </div>
              {typedText !== typingText && typedText.length > 0 && (
                <p className="text-sm text-red-600">
                  Text doesn't match. Type exactly: "{typingText}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
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
