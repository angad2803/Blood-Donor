"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useAuth } from "../../context/AuthContext";
import LocationCapture from "../../components/LocationCapture";

const OAuthSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { loginWithToken } = useAuth();
  const [showLocationCapture, setShowLocationCapture] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is authenticated via NextAuth
      console.log("OAuth Success - Session data:", session);
      setUserData(session.user);

      // Check if user needs account type selection or profile completion
      if (session.user.needsAccountTypeSelection) {
        console.log("Redirecting to account type selection");
        router.push("/account-type-selection");
      } else if (
        session.user.bloodGroup === "O+" &&
        session.user.location === "Unknown"
      ) {
        console.log("Redirecting to complete profile");
        router.push("/complete-profile");
      } else {
        console.log("User profile complete, redirecting to dashboard");
        router.push("/dashboard");
      }
    } else {
      // Check for token in URL (legacy support)
      const tokenFromUrl = searchParams.get("token");
      if (tokenFromUrl) {
        handleLegacyToken(tokenFromUrl);
      } else {
        console.log("No session or token, redirecting to login");
        router.push("/login");
      }
    }
  }, [session, status, router, searchParams]);

  const handleLegacyToken = async (token) => {
    try {
      localStorage.setItem("token", token);

      // Try to fetch user data with the token
      const response = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        await loginWithToken(token);
        setUserData(user);
        navigateBasedOnUserStatus(user);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Legacy token handling error:", error);
      router.push("/login");
    }
  };

  const navigateBasedOnUserStatus = (user) => {
    // Check if user needs to select account type (new OAuth users)
    if (user.needsAccountTypeSelection) {
      router.push("/account-type-selection");
    }
    // Check if user needs to complete profile (from OAuth with default values)
    else if (user.bloodGroup === "O+" && user.location === "Unknown") {
      router.push("/complete-profile");
    } else {
      router.push("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">
          Completing your sign-in...
        </h2>
        <p className="text-gray-600 mt-2">
          {status === "loading"
            ? "Verifying your authentication..."
            : "Redirecting you to the dashboard..."}
        </p>
      </div>
    </div>
  );
};

const OAuthSuccess = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthSuccessContent />
    </Suspense>
  );
};

export default OAuthSuccess;
