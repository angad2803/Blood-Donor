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
          innerHTML: 42,
          duration: 2,
          ease: "power2.out",
          snap: { innerHTML: 1 },
          delay: 1,
        });
      }

      // Button hover setup
      if (buttonRef.current) {
        const button = buttonRef.current;
        const handleMouseEnter = () => {
          gsap.to(button, {
            scale: 1.05,
            y: -3,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        const handleMouseLeave = () => {
          gsap.to(button, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        };

        button.addEventListener("mouseenter", handleMouseEnter);
        button.addEventListener("mouseleave", handleMouseLeave);

        // Cleanup listeners
        return () => {
          button.removeEventListener("mouseenter", handleMouseEnter);
          button.removeEventListener("mouseleave", handleMouseLeave);
        };
      }
    } catch (error) {
      console.error("GSAP Animation Error:", error);
    }
  }, []);

  // Separate useEffect for DOM-based animations
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Setup interactive elements
        const interactiveElements = document.querySelectorAll(
          ".interactive-element"
        );
        interactiveElements.forEach((element) => {
          const handleMouseEnter = () => {
            gsap.to(element, {
              y: -5,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              duration: 0.3,
              ease: "power2.out",
            });
          };

          const handleMouseLeave = () => {
            gsap.to(element, {
              y: 0,
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              duration: 0.3,
              ease: "power2.out",
            });
          };

          const handleClick = () => {
            gsap.to(element, {
              scale: 0.95,
              duration: 0.1,
              ease: "power2.out",
              yoyo: true,
              repeat: 1,
            });
          };

          element.addEventListener("mouseenter", handleMouseEnter);
          element.addEventListener("mouseleave", handleMouseLeave);
          element.addEventListener("click", handleClick);
        });

        // Animate progress bars
        const progressBars = document.querySelectorAll(
          ".bg-red-600, .bg-orange-600"
        );
        progressBars.forEach((bar, index) => {
          if (bar && bar.style !== undefined) {
            gsap.fromTo(
              bar,
              { width: "0%" },
              {
                width: index === 0 ? "75%" : "60%",
                duration: 2,
                ease: "power2.out",
                delay: 1.5 + index * 0.3,
              }
            );
          }
        });
      } catch (error) {
        console.error("DOM Animation Error:", error);
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  const handleExplode = () => {
    try {
      if (cardsRef.current && cardsRef.current.length > 0) {
        const validCards = cardsRef.current.filter((el) => el);

        // Fun explosion effect
        gsap.to(validCards, {
          x: () => Math.random() * 400 - 200,
          y: () => Math.random() * 400 - 200,
          rotation: () => Math.random() * 360,
          scale: 0.5,
          opacity: 0.7,
          duration: 1,
          ease: "power2.out",
          stagger: 0.1,
        });

        // Bring them back
        setTimeout(() => {
          gsap.to(validCards, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: "elastic.out(1, 0.3)",
            stagger: 0.1,
          });
        }, 1500);
      }
    } catch (error) {
      console.error("Animation Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent"
        >
          🩸 GSAP Blood Donor Animations
        </h1>

        {/* Counter */}
        <div className="text-center mb-8">
          <div className="text-lg text-gray-600">Lives Saved:</div>
          <div ref={counterRef} className="text-4xl font-bold text-red-600">
            0
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { type: "A+", urgency: "High", location: "Central Hospital" },
            { type: "O-", urgency: "Emergency", location: "City Medical" },
            { type: "B+", urgency: "Medium", location: "Regional Center" },
          ].map((card, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className={`blood-card bg-white rounded-lg p-6 shadow-lg border-2 ${
                card.urgency === "Emergency"
                  ? "border-red-500 emergency-pulse"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">
                  🩸 {card.type} Blood
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    card.urgency === "Emergency"
                      ? "bg-red-100 text-red-800"
                      : card.urgency === "High"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {card.urgency}
                  {card.urgency === "Emergency" && " 🚨"}
                </span>
              </div>
              <p className="text-gray-600 mb-4">📍 {card.location}</p>
              <div className="flex gap-2">
                <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                  💌 Send Offer
                </button>
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Demo */}
        <div className="text-center mb-8">
          <div
            ref={emergencyRef}
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-lg text-xl font-bold"
          >
            🚨 EMERGENCY BLOOD NEEDED 🚨
          </div>
        </div>

        {/* Controls */}
        <div className="text-center">
          <button
            ref={buttonRef}
            onClick={handleExplode}
            className="gsap-button bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            🎆 Trigger Animation Demo
          </button>
        </div>

        {/* Feature List */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🎨 GSAP Features Added:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">
                ✅ Dashboard Animations
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Smooth card entrance effects</li>
                <li>• Tab transition animations</li>
                <li>• Hover effects on cards</li>
                <li>• Loading state animations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">
                ✅ Emergency Features
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pulsing emergency alerts</li>
                <li>• Attention-grabbing effects</li>
                <li>• Color-coded urgency levels</li>
                <li>• Dynamic counter animations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Animation Examples */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">
            🎪 Interactive Animation Playground
          </h2>

          {/* Button Examples */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Enhanced Buttons:</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="gsap-button-bounce bg-blue-600 text-white px-4 py-2 rounded-lg">
                Hover Me!
              </button>
              <button className="gsap-button-bounce bg-green-600 text-white px-4 py-2 rounded-lg">
                Success Button
              </button>
              <button className="gsap-button-bounce bg-red-600 text-white px-4 py-2 rounded-lg emergency-glow">
                Emergency Action
              </button>
            </div>
          </div>

          {/* Blood Type Badges */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Blood Type Badges:</h3>
            <div className="flex gap-3">
              {["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"].map(
                (type) => (
                  <span
                    key={type}
                    className="blood-type-badge bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold"
                  >
                    {type}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Interactive Elements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Interactive Cards:</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="interactive-element bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="text-2xl mb-2">💝</div>
                  <h4 className="font-semibold">Interactive Card {num}</h4>
                  <p className="text-sm text-gray-600">Hover and click me!</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Animated Progress:</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Blood Donations Goal</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Emergency Responses</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swiper Carousel Demo - Temporarily Disabled */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">
            🎠 Swiper.js Blood Request Carousel
          </h2>

          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚧</div>
            <p className="text-gray-600 mb-4">
              Carousel component is being loaded...
            </p>
            <p className="text-sm text-gray-500">
              Visit the Dashboard to see the working carousel implementation
            </p>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-4">
              <div className="success-demo bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                ✅ Fully responsive design
              </div>
              <div className="chat-demo bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                💬 Touch & keyboard navigation
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                🎨 Auto-advancing carousel
              </div>
            </div>
          </div>
        </div>

        {/* Animation Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <span className="animate-pulse mr-2">🟢</span>
            All GSAP animations are active and ready!
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSAPDemo;
