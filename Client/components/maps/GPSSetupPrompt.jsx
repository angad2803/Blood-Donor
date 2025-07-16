import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const GPSSetupPrompt = ({
  onClose,
  isNewUser = false,
  canDismiss = true,
  title,
  description,
}) => {
  const navigate = useNavigate();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleQuickSetup = () => {
    if (!navigator.geolocation) {
      toast.error("❌ GPS not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        toast.success("📍 GPS location detected! Redirecting to save it...");
        navigate("/geolocation-test");
        if (onClose) onClose();
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "❌ GPS access denied. Please allow location access and try again."
          );
        } else {
          toast.error(
            "❌ Unable to get your location. You can set it up manually."
          );
        }
        navigate("/geolocation-test");
        if (onClose) onClose();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleManualSetup = () => {
    navigate("/geolocation-test");
    if (onClose) onClose();
  };

  const handleSkip = () => {
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📍</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {title ||
                (isNewUser
                  ? "Welcome! Set Up GPS Location"
                  : "Enable GPS Features")}
            </h3>
            <p className="text-sm text-gray-600">
              {description ||
                (isNewUser
                  ? "Get the most out of our blood donor platform!"
                  : "Unlock powerful location-based features")}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-red-700 mb-2">🌟 GPS Benefits:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Find nearby donors/requests by actual distance</li>
            <li>• Get real-time travel times and directions</li>
            <li>• Emergency requests prioritized automatically</li>
            <li>• Smart blood type compatibility matching</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleQuickSetup}
            disabled={isGettingLocation}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGettingLocation ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Getting GPS Location...
              </span>
            ) : (
              "📡 Quick Setup (Use My Current Location)"
            )}
          </button>

          <button
            onClick={handleManualSetup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition"
          >
            🗺️ Manual Setup (Choose Location)
          </button>

          {canDismiss && (
            <button
              onClick={handleSkip}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition"
            >
              {isNewUser ? "⏭️ Skip for Now" : "✕ Maybe Later"}
            </button>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          {isNewUser
            ? "You can always set this up later from your dashboard"
            : "GPS location is optional but highly recommended for better matching"}
        </p>
      </div>
    </div>
  );
};

export default GPSSetupPrompt;
