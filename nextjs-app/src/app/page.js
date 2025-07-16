"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function HomePage() {
  const { token, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return null;
}
