import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const GSAPDemoSimple = () => {
  const titleRef = useRef(null);

  useEffect(() => {
    // Simple title animation
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: "bounce.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1
          ref={titleRef}
          className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent"
        >
          🩸 GSAP Animations Working!
        </h1>

        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            This is a simplified demo to test GSAP functionality.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">✅ Status: Working</h2>
            <p className="text-gray-600">
              GSAP animations are loading successfully!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSAPDemoSimple;
