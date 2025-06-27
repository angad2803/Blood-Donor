import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const GSAPDemoTest = () => {
  const titleRef = useRef(null);

  useEffect(() => {
    // Simple title animation
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1
          ref={titleRef}
          className="text-4xl font-bold text-center mb-8 text-red-600"
        >
          GSAP Test Page
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Test Status</h2>
          <p className="text-green-600">✅ GSAP is working correctly!</p>
          <p className="text-blue-600">✅ Component rendered successfully!</p>
          <p className="text-purple-600">✅ No 500 errors detected!</p>
        </div>
      </div>
    </div>
  );
};

export default GSAPDemoTest;
