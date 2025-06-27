import React, { useState } from "react";
import api from "../api/api.js";
import { toast } from "react-toastify";

const SendOfferModal = ({ isOpen, onClose, bloodRequest, onOfferSent }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [includeMessage, setIncludeMessage] = useState(true);

  const getDefaultMessage = () => {
    return `Hi! I'm available to donate ${
      bloodRequest?.bloodGroup
    } blood and can help with your ${bloodRequest?.urgency?.toLowerCase()} request. Please let me know the best time and any specific details.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/offer/send", {
        requestId: bloodRequest._id,
        message: includeMessage
          ? message.trim() || getDefaultMessage()
          : getDefaultMessage(),
      });

      setMessage("");
      setIncludeMessage(true);
      toast.success(
        "💌 Your donation offer has been sent! The requester will be notified."
      );
      onOfferSent(response.data.offer);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send offer";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Send Donation Offer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close offer modal"
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

        {/* Blood Request Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🩸</span>
            <div>
              <h3 className="font-semibold text-red-800">
                {bloodRequest.bloodGroup} Blood Needed
              </h3>
              <p className="text-sm text-red-600">
                Urgency:{" "}
                <span className="font-medium">{bloodRequest.urgency}</span>
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-700">
            <p>
              <strong>Location:</strong> {bloodRequest.location}
            </p>
            <p>
              <strong>Requested by:</strong> {bloodRequest.requester?.name}
            </p>
            <p>
              <strong>Posted:</strong>{" "}
              {new Date(bloodRequest.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit}>
          {/* Message Option Checkbox */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="includeMessage"
                type="checkbox"
                checked={includeMessage}
                onChange={(e) => setIncludeMessage(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeMessage"
                className="ml-2 block text-sm text-gray-700"
              >
                ✍️ I want to include a personal message
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {includeMessage
                ? "Write a custom message to the requester"
                : "A standard offer message will be sent automatically"}
            </p>
          </div>

          {/* Conditional Message Input */}
          {includeMessage && (
            <div className="mb-4">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Message to the Requester
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={getDefaultMessage()}
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to use default message
              </p>
            </div>
          )}

          {/* Preview of default message when checkbox is unchecked */}
          {!includeMessage && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Standard message that will be sent:</strong>
              </p>
              <p className="text-sm text-gray-700 italic">
                "{getDefaultMessage()}"
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Offer"}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Once you send this offer, the requester will
            be notified immediately. If they accept your offer, you'll receive
            the exact location and contact details to coordinate the donation.
            {!includeMessage && (
              <span className="block mt-1">
                <strong>Quick Offer:</strong> A standard message will be sent to
                speed up the process.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendOfferModal;
