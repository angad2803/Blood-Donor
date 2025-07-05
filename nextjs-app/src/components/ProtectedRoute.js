"use client";

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useContext(AuthContext);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check both AuthContext and NextAuth session
    const isAuthContextLoading = isLoading;
    const isNextAuthLoading = status === "loading";

    // If both systems are done loading and neither has a user, redirect to login
    if (!isAuthContextLoading && !isNextAuthLoading && !user && !session) {
      router.push("/login");
    }
  }, [user, isLoading, session, status, router]);

  // Show loading if either auth system is still loading
  if (isLoading || status === "loading") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Allow access if either auth system has a user
  if (!user && !session) {
    return null; // Will redirect via useEffect
  }

  return children;
}
