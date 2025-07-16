import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

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

  useEffect(() => {
    // Enhanced spinner animation
    gsap.to(spinnerRef.current, {
      rotation: 360,
      duration: 1,
      ease: "none",
      repeat: -1,
    });

    // Pulsing message animation
    if (messageRef.current) {
      gsap.to(messageRef.current, {
        opacity: 0.5,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

    // Scale pulse for larger spinners
    if (size === "lg" || size === "xl") {
      gsap.to(spinnerRef.current, {
        scale: 1.1,
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }, [size]);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        ref={spinnerRef}
        className={`rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        style={{ willChange: "transform" }}
      ></div>
      {message && (
        <p ref={messageRef} className="mt-4 text-gray-600 text-sm">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
