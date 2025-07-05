"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const GSAPDemo = () => {
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const buttonRef = useRef(null);
  const emergencyRef = useRef(null);
  const counterRef = useRef(null);

  useEffect(() => {
    try {
      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: -50 },
          { opacity: 1, y: 0, duration: 1, ease: "bounce.out" }
        );
      }

      // Cards stagger animation
      if (cardsRef.current && cardsRef.current.length > 0) {
        gsap.fromTo(
          cardsRef.current.filter((el) => el), // Filter out null/undefined elements
          { opacity: 0, y: 50, scale: 0.8 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: "power2.out",
            delay: 0.5,
          }
        );
      }

      // Emergency pulse animation
      if (emergencyRef.current) {
        gsap.to(emergencyRef.current, {
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // Counter animation
      if (counterRef.current) {
        gsap.to(counterRef.current, {
          textContent: 1000,
          duration: 2,
          ease: "power2.out",
          snap: { textContent: 1 },
          delay: 1,
        });
      }

      // Button hover animation
      if (buttonRef.current) {
        const button = buttonRef.current;

        const handleMouseEnter = () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out",
          });
        };

        const handleMouseLeave = () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
          });
        };

        button.addEventListener("mouseenter", handleMouseEnter);
        button.addEventListener("mouseleave", handleMouseLeave);

        // Cleanup event listeners
        return () => {
          button.removeEventListener("mouseenter", handleMouseEnter);
          button.removeEventListener("mouseleave", handleMouseLeave);
        };
      }
    } catch (error) {
      console.error("GSAP animation error:", error);
    }
  }, []);

  const addToRefs = (el) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const handleButtonClick = () => {
    // Add a click animation
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }

    // Animate all cards
    gsap.to(
      cardsRef.current.filter((el) => el),
      {
        rotation: 360,
        duration: 0.8,
        ease: "power2.inOut",
        stagger: 0.1,
      }
    );
  };

  const resetAnimations = () => {
    // Reset all animations to initial state
    gsap.set(titleRef.current, { opacity: 1, y: 0 });
    gsap.set(
      cardsRef.current.filter((el) => el),
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
      }
    );
    gsap.set(counterRef.current, { textContent: 0 });

    // Re-run animations
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            ref={titleRef}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600 mb-4"
          >
            🩸 GSAP Animation Demo
          </h1>
          <p className="text-lg text-gray-600">
            Demonstrating smooth animations for Blood Donor Connect
          </p>
        </div>

        {/* Stats Counter */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 inline-block">
            <p className="text-gray-600 mb-2">Lives Saved</p>
            <div ref={counterRef} className="text-4xl font-bold text-green-600">
              0
            </div>
          </div>
        </div>

        {/* Blood Type Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { type: "A+", color: "red", count: 245 },
            { type: "B+", color: "blue", count: 189 },
            { type: "AB+", color: "purple", count: 67 },
            { type: "O+", color: "green", count: 421 },
            { type: "A-", color: "red", count: 78 },
            { type: "B-", color: "blue", count: 56 },
            { type: "AB-", color: "purple", count: 23 },
            { type: "O-", color: "green", count: 134 },
          ].map((blood, index) => (
            <div
              key={blood.type}
              ref={addToRefs}
              className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition-shadow blood-card blood-card-${blood.color}`}
            >
              <div
                className={`text-2xl font-bold text-${blood.color}-600 mb-2`}
              >
                {blood.type}
              </div>
              <div className="text-sm text-gray-600">{blood.count} donors</div>
              <div className="mt-2">
                <div
                  className={`w-full bg-${blood.color}-100 rounded-full h-2`}
                >
                  <div
                    className={`bg-${blood.color}-600 h-2 rounded-full`}
                    style={{ width: `${Math.min(blood.count / 5, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Section */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
          <div className="text-center">
            <div
              ref={emergencyRef}
              className="text-6xl mb-4 inline-block"
              role="img"
              aria-label="Emergency"
            >
              🚨
            </div>
            <h3 className="text-2xl font-bold text-red-700 mb-2">
              Emergency Blood Request
            </h3>
            <p className="text-red-600 mb-4">
              O- blood needed urgently at Apollo Hospital
            </p>
            <div className="flex justify-center gap-4">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg">
                📍 2.3km away
              </span>
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg">
                ⏰ Posted 5 min ago
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            ref={buttonRef}
            onClick={handleButtonClick}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            🎯 Animate Cards
          </button>

          <div>
            <button
              onClick={resetAnimations}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              🔄 Reset Animations
            </button>
          </div>
        </div>

        {/* Animation Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎨 Animation Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Implemented Animations:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Title bounce entrance</li>
                <li>✅ Staggered card animations</li>
                <li>✅ Pulsing emergency alert</li>
                <li>✅ Number counter animation</li>
                <li>✅ Hover effects on buttons</li>
                <li>✅ Click ripple effects</li>
                <li>✅ Card rotation on trigger</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                GSAP Techniques Used:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🔧 fromTo() for entrance animations</li>
                <li>🔧 Stagger for sequential animations</li>
                <li>🔧 Yoyo and repeat for loops</li>
                <li>🔧 Event-driven animations</li>
                <li>🔧 Scale and rotation transforms</li>
                <li>🔧 Easing functions</li>
                <li>🔧 Timeline management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🚀 Performance:</strong> GSAP provides hardware-accelerated
            animations with 60fps performance. All animations are optimized for
            smooth user experience across devices.
          </p>
        </div>
      </div>

      <style jsx>{`
        .blood-card {
          transition: transform 0.2s ease;
        }
        .blood-card:hover {
          transform: translateY(-4px);
        }
        .blood-card-red .text-red-600 {
          color: #dc2626;
        }
        .blood-card-blue .text-blue-600 {
          color: #2563eb;
        }
        .blood-card-purple .text-purple-600 {
          color: #9333ea;
        }
        .blood-card-green .text-green-600 {
          color: #16a34a;
        }
        .bg-red-100 {
          background-color: #fee2e2;
        }
        .bg-blue-100 {
          background-color: #dbeafe;
        }
        .bg-purple-100 {
          background-color: #f3e8ff;
        }
        .bg-green-100 {
          background-color: #dcfce7;
        }
        .bg-red-600 {
          background-color: #dc2626;
        }
        .bg-blue-600 {
          background-color: #2563eb;
        }
        .bg-purple-600 {
          background-color: #9333ea;
        }
        .bg-green-600 {
          background-color: #16a34a;
        }
      `}</style>
    </div>
  );
};

export default GSAPDemo;
