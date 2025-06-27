import { useEffect, useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import gpsLocationService from "../utils/gpsLocationService";
import LocationCapture from "../components/LocationCapture";

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Fetch user data and store in context
      api.defaults.headers.common["Authorization"] = `Bearer ${tokenFromUrl}`;
      api
        .get("/user/me")
        .then(async (res) => {
          const user = res.data.user;
          setUserData(user);
          loginWithToken(tokenFromUrl, user);

          // For new OAuth users, capture location immediately
          if (
            user.needsAccountTypeSelection ||
            (user.bloodGroup === "O+" && user.location === "Unknown")
          ) {
            // Check if user has location coordinates
            const hasLocation =
              user.coordinates &&
              user.coordinates.coordinates &&
              user.coordinates.coordinates[0] !== 0 &&
              user.coordinates.coordinates[1] !== 0;

            if (!hasLocation) {
              // Try automatic location capture first
              try {
                const locationResult =
                  await gpsLocationService.captureLocationAutomatically(
                    "complete your profile and find nearby blood requests",
                    false // Don't show prompt initially
                  );

                if (locationResult.success) {
                  console.log("Location captured automatically for OAuth user");
                  // Continue with normal flow
                  navigateBasedOnUserStatus(user);
                } else {
                  // Show location capture UI
                  setShowLocationCapture(true);
                }
              } catch (error) {
                console.log(
                  "Auto location capture failed, showing UI:",
                  error.message
                );
                setShowLocationCapture(true);
              }
            } else {
              navigateBasedOnUserStatus(user);
            }
          } else {
            navigateBasedOnUserStatus(user);
          }
        })
        .catch(() => {
          // If user fetch fails, still store token and navigate
          localStorage.setItem("token", tokenFromUrl);
          navigate("/complete-profile");
        });
    } else {
      navigate("/login");
    }
  }, [navigate, loginWithToken]);

  const navigateBasedOnUserStatus = (user) => {
    // Check if user needs to select account type (new OAuth users)
    if (user.needsAccountTypeSelection) {
      navigate("/account-type-selection");
    }
    // Check if user needs to complete profile (from OAuth with default values)
    else if (user.bloodGroup === "O+" && user.location === "Unknown") {
      navigate("/complete-profile");
    } else {
      navigate("/dashboard");
    }
  };

  const handleLocationCaptured = (locationData) => {
    console.log("Location captured during OAuth:", locationData);
    setShowLocationCapture(false);
    navigateBasedOnUserStatus(userData);
  };

  const handleLocationSkipped = () => {
    console.log("Location capture skipped during OAuth");
    setShowLocationCapture(false);
    navigateBasedOnUserStatus(userData);
  };

  if (showLocationCapture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
            Welcome! One More Step...
          </h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            To help you find and connect with nearby blood donors and requests,
            we need access to your location.
          </p>
          <LocationCapture
            onLocationCaptured={handleLocationCaptured}
            onSkip={handleLocationSkipped}
            purpose="complete your setup and find nearby blood requests"
            showSkipOption={true}
            autoCapture={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
