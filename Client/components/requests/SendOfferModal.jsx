import React, { useState, useEffect, useRef } from "react";
import api from "../api/api.js";
import aiService from "../services/aiService.js";
import { toast } from "react-toastify";
import { gsap } from "gsap";

const SendOfferModal = ({ isOpen, onClose, bloodRequest, onOfferSent }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [includeMessage, setIncludeMessage] = useState(true);

  // AI Enhancement States
  const [isPolishing, setIsPolishing] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // GSAP Refs
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Modal entrance animation
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
          delay: 0.1,
        }
      );

      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          delay: 0.3,
        }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    // Exit animation
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.9,
      y: -30,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  const getDefaultMessage = () => {
    return `Hi! I'm available to donate ${
      bloodRequest?.bloodGroup
    } blood and can help with your ${bloodRequest?.urgency?.toLowerCase()} request. Please let me know the best time and any specific details.`;
  };

  // AI Enhancement Functions
  const polishMessage = async () => {
    if (!message.trim()) {
      toast.error("Please write a message first before polishing");
      return;
    }

    setIsPolishing(true);
    try {
      const polishPrompt = `Polish and improve this blood donation offer message. Make it ${selectedTone}, clear, and professional. Keep the same meaning but improve grammar, flow, and tone:

Message: "${message}"
Tone: ${selectedTone}
Context: This is for a ${bloodRequest?.urgency} blood donation request for ${bloodRequest?.bloodGroup} blood type.

Please respond with only the improved message, no additional text.`;

      const response = await aiService.generateResponse(polishPrompt);
      setMessage(response.message);
      toast.success("✨ Message polished successfully!");
    } catch (error) {
      console.error("Polish error:", error);
      toast.error("Failed to polish message. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  const translateMessage = async () => {
    if (!message.trim()) {
      toast.error("Please write a message first before translating");
      return;
    }

    setIsPolishing(true);
    try {
      const translatePrompt = `Translate this blood donation offer message to ${selectedLanguage}. Keep the same professional and caring tone:

Message: "${message}"
Target Language: ${selectedLanguage}
Context: This is for a ${bloodRequest?.urgency} blood donation request.

Please respond with only the translated message, no additional text.`;

      const response = await aiService.generateResponse(translatePrompt);
      setMessage(response.message);
      toast.success(`🌍 Message translated to ${selectedLanguage}!`);
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate message. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  const generateSuggestions = async () => {
    setIsPolishing(true);
    try {
      const suggestionPrompt = `Generate 3 different blood donation offer messages for a ${bloodRequest?.urgency} ${bloodRequest?.bloodGroup} blood request. Make them ${selectedTone} and include:
1. Availability confirmation
2. Willingness to help
3. Request for coordination details

Context: 
- Blood type needed: ${bloodRequest?.bloodGroup}
- Urgency: ${bloodRequest?.urgency}
- Requester: ${bloodRequest?.requester?.name}
- Location: ${bloodRequest?.location}

Please provide 3 different message options, each on a new line starting with "Option 1:", "Option 2:", "Option 3:".`;

      const response = await aiService.generateResponse(suggestionPrompt);
      const suggestions = response.message
        .split(/Option [1-3]:/)
        .filter((s) => s.trim())
        .map((s) => s.trim());

      setAiSuggestions(suggestions);
      setShowSuggestions(true);
      toast.success("💡 Generated message suggestions!");
    } catch (error) {
      console.error("Suggestions error:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    toast.success("✅ Applied suggestion to your message!");
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
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 transition-colors duration-300"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Send Donation Offer
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🩸</span>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
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
        <form ref={formRef} onSubmit={handleSubmit}>
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

              {/* AI Enhancement Section */}
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI Message Assistant
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAITools(!showAITools)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showAITools ? "Hide" : "Show"} Tools
                  </button>
                </div>

                {showAITools && (
                  <div className="space-y-3">
                    {/* Tone and Language Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tone
                        </label>
                        <select
                          value={selectedTone}
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="urgent">Urgent</option>
                          <option value="compassionate">Compassionate</option>
                          <option value="formal">Formal</option>
                          <option value="casual">Casual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Language
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="english">English</option>
                          <option value="spanish">Spanish</option>
                          <option value="french">French</option>
                          <option value="german">German</option>
                          <option value="italian">Italian</option>
                          <option value="portuguese">Portuguese</option>
                          <option value="hindi">Hindi</option>
                          <option value="chinese">Chinese</option>
                          <option value="arabic">Arabic</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={polishMessage}
                        disabled={isPolishing || !message.trim()}
                        className="flex-1 min-w-[80px] px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPolishing ? (
                          <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          "✨"
                        )}
                        <span className="ml-1">Polish</span>
                      </button>

                      <button
                        type="button"
                        onClick={translateMessage}
                        disabled={isPolishing || !message.trim()}
                        className="flex-1 min-w-[80px] px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPolishing ? (
                          <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          "🌍"
                        )}
                        <span className="ml-1">Translate</span>
                      </button>

                      <button
                        type="button"
                        onClick={generateSuggestions}
                        disabled={isPolishing}
                        className="flex-1 min-w-[80px] px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPolishing ? (
                          <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          "💡"
                        )}
                        <span className="ml-1">Suggest</span>
                      </button>
                    </div>

                    {/* AI Suggestions */}
                    {showSuggestions && aiSuggestions.length > 0 && (
                      <div className="mt-3 p-2 bg-white border border-purple-200 rounded">
                        <h5 className="text-xs font-medium text-purple-800 mb-2">
                          💡 AI Generated Suggestions (click to use):
                        </h5>
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              className="w-full text-left p-2 text-xs bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
                            >
                              <span className="font-medium text-purple-700">
                                Option {index + 1}:
                              </span>
                              <br />
                              <span className="text-gray-700">
                                {suggestion}
                              </span>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="mt-2 text-xs text-purple-600 hover:text-purple-800"
                        >
                          ✕ Close suggestions
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-blue-600">
                      💡 <strong>Tip:</strong> Use AI to polish your message,
                      change the tone, or translate to different languages for
                      better communication!
                    </p>
                  </div>
                )}
              </div>
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
              onClick={handleClose}
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
