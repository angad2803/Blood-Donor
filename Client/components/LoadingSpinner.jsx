import React from "react";

const LoadingSpinner = ({
  size = "md",
  color = "red",
  message = "Loading...",
}) => {
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
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
