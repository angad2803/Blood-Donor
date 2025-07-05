"use client";

import React, { useEffect, useRef } from "react";

const LoadingSpinner = ({
  size = "md",
  color = "red",
  message = "Loading...",
}) => {
  const spinnerRef = useRef(null);
  const messageRef = useRef(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colorClasses = {
    red: "border-red-600",
    blue: "border-blue-600",
    green: "border-green-600",
    gray: "border-gray-600",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        ref={spinnerRef}
        className={`animate-spin rounded-full border-4 border-gray-200 ${colorClasses[color]} ${sizeClasses[size]}`}
        style={{ borderTopColor: "transparent" }}
      ></div>
      {message && (
        <p
          ref={messageRef}
          className="mt-3 text-gray-600 text-sm font-medium animate-pulse"
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
