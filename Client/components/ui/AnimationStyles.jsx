import React from "react";

const AnimationStyles = () => {
  return (
    <style jsx>{`
      @keyframes contentGlassReflection {
        0%,
        100% {
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        50% {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }
      }
      @keyframes cardShine {
        0% {
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }
      }
      @keyframes glassParticle {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: scale(1.5) rotate(360deg);
          opacity: 0;
        }
      }
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      @keyframes pulseGradient {
        0% {
          background-position:
            0% 0%,
            100% 100%,
            50% 50%,
            0% 100%,
            100% 0%,
            50% 0%;
        }
        25% {
          background-position:
            25% 25%,
            75% 75%,
            100% 0%,
            25% 75%,
            75% 25%,
            0% 50%;
        }
        50% {
          background-position:
            50% 50%,
            50% 50%,
            0% 100%,
            50% 50%,
            50% 50%,
            100% 100%;
        }
        75% {
          background-position:
            0% 0%,
            75% 75%,
            25% 25%,
            50% 100%,
            100% 50%,
            0% 0%;
        }
      }
    `}</style>
  );
};

export default AnimationStyles;
