import React, { useState, useEffect } from "react";
import gpsLocationService from "../utils/gpsLocationService";

const LocationCapture = ({
  onLocationCaptured,
  onSkip,
  purpose = "improve your experience",
  showSkipOption = true,
  autoCapture = false,
  className = "",
}) => {
  const [status, setStatus] = useState("idle"); // idle, requesting, success, error
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (autoCapture) {
      handleCaptureLocation(false); // Don't show prompt for auto capture
    }
  }, [autoCapture]);

  const handleCaptureLocation = async (showPrompt = true) => {
    setStatus("requesting");
    setError("");

    try {
      const result = await gpsLocationService.captureLocationAutomatically(
        purpose,
        showPrompt
      );

      if (result.success) {
        setStatus("success");
        setLocation(result.position);
        setAddress(result.address);

        // Store location locally
        gpsLocationService.storeLocation(result.position);

        // Notify parent component
        if (onLocationCaptured) {
          onLocationCaptured({
            coordinates: result.position,
            address: result.address,
            formatted: result.address,
          });
        }
      } else {
        setStatus("error");
        setError(result.message || "Failed to capture location");
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Location capture failed");
    }
  };

  const handleSkip = () => {
    setStatus("skipped");
    if (onSkip) {
      onSkip();
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setError("");
    handleCaptureLocation(true);
  };

  if (status === "success") {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Location Captured Successfully!
            </h3>
            <p className="text-sm text-green-700 mt-1">{address}</p>
            <p className="text-xs text-green-600 mt-1">
              Coordinates: {location?.latitude.toFixed(6)},{" "}
              {location?.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}
      >
        <div className="text-center">
          <p className="text-sm text-yellow-800">Location capture skipped</p>
          <button
            onClick={() => setStatus("idle")}
            className="text-xs text-yellow-600 hover:text-yellow-800 mt-1"
          >
            Click here to enable location later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="text-center">
        <div className="mb-3">
          <svg
            className="w-8 h-8 text-blue-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Enable Location Access
        </h3>

        <p className="text-sm text-blue-700 mb-4">
          Help us {purpose} by sharing your location. This allows us to:
        </p>

        <ul className="text-xs text-blue-600 mb-4 text-left max-w-xs mx-auto">
          <li className="flex items-center mb-1">
            <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
            Find nearby blood requests
          </li>
          <li className="flex items-center mb-1">
            <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
            Show relevant donors in your area
          </li>
          <li className="flex items-center mb-1">
            <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
            Calculate accurate distances
          </li>
        </ul>

        {status === "requesting" ? (
          <div className="flex items-center justify-center mb-4">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-blue-700">Capturing location...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => handleCaptureLocation(true)}
              disabled={status === "requesting"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              📍 Share My Location
            </button>

            {showSkipOption && (
              <button
                onClick={handleSkip}
                disabled={status === "requesting"}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200 text-sm"
              >
                Skip for Now
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
            <p className="text-red-700 mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Your location is only used for matching purposes and is never shared
          with third parties.
        </p>
      </div>
    </div>
  );
};

export default LocationCapture;
