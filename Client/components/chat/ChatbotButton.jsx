import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

const ChatbotButton = ({ onClick, hasNotification = false }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      buttonRef.current,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)", delay: 1 }
    );

    // Floating animation
    gsap.to(buttonRef.current, {
      y: -5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Pulse notification
    if (hasNotification) {
      gsap.to(buttonRef.current, {
        scale: 1.1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    }
  }, [hasNotification]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-40 flex items-center justify-center group"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(239, 68, 68, 1) 0%, 
            rgba(236, 72, 153, 1) 100%
          )
        `,
        boxShadow: `
          0 10px 25px rgba(239, 68, 68, 0.4),
          0 20px 40px rgba(236, 72, 153, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `,
      }}
    >
      <div className="relative">
        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
          🤖
        </span>

        {/* Notification badge */}
        {hasNotification && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-red-600">!</span>
          </div>
        )}
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
    </button>
  );
};

export default ChatbotButton;
