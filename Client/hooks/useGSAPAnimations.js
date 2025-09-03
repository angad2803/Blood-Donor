import React from "react";
import { gsap } from "gsap";

export const useGSAPAnimations = () => {
  // GSAP Animation Functions
  const createFloatingParticles = () => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "floating-particle fixed pointer-events-none z-0";
      particle.style.cssText = `
        width: ${Math.random() * 12 + 6}px;
        height: ${Math.random() * 12 + 6}px;
        background: linear-gradient(45deg, 
          rgba(239, 68, 68, 0.4), 
          rgba(59, 130, 246, 0.4), 
          rgba(16, 185, 129, 0.4)
        );
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
      `;
      document.body.appendChild(particle);
      particles.push(particle);

      // Complex animation patterns
      gsap.to(particle, {
        y: Math.random() * 400 - 200,
        x: Math.random() * 400 - 200,
        rotation: 360,
        duration: Math.random() * 30 + 15,
        repeat: -1,
        ease: "none",
      });

      gsap.to(particle, {
        opacity: Math.random() * 0.6 + 0.3,
        scale: Math.random() * 0.8 + 0.4,
        duration: Math.random() * 4 + 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    return particles;
  };

  const createMorphingBlobs = () => {
    const blobs = [];
    for (let i = 0; i < 3; i++) {
      const blob = document.createElement("div");
      blob.className = "morphing-blob fixed pointer-events-none z-0";
      blob.style.cssText = `
        width: ${Math.random() * 200 + 100}px;
        height: ${Math.random() * 200 + 100}px;
        background: linear-gradient(45deg, 
          rgba(139, 92, 246, 0.1), 
          rgba(236, 72, 153, 0.1), 
          rgba(59, 130, 246, 0.1)
        );
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
        left: ${Math.random() * 80 + 10}%;
        top: ${Math.random() * 80 + 10}%;
        filter: blur(40px);
      `;
      document.body.appendChild(blob);
      blobs.push(blob);

      // Morphing animation
      gsap.to(blob, {
        borderRadius: "70% 30% 30% 70% / 70% 70% 30% 30%",
        duration: Math.random() * 8 + 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(blob, {
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: 360,
        duration: Math.random() * 20 + 15,
        repeat: -1,
        ease: "none",
      });
    }

    return blobs;
  };

  const createSparkleEffect = () => {
    const sparkles = [];
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle-effect fixed pointer-events-none z-10";
      sparkle.innerHTML = "✨";
      sparkle.style.cssText = `
        font-size: ${Math.random() * 8 + 12}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        color: rgba(255, 215, 0, 0.8);
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      `;
      document.body.appendChild(sparkle);
      sparkles.push(sparkle);

      // Sparkle animation
      gsap.fromTo(
        sparkle,
        { scale: 0, rotation: 0, opacity: 0 },
        {
          scale: 1,
          rotation: 360,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          delay: Math.random() * 2,
        }
      );

      gsap.to(sparkle, {
        y: -50,
        opacity: 0,
        duration: 2,
        delay: Math.random() * 2 + 0.6,
        onComplete: () => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        },
      });
    }
  };

  const animateTabTransition = (
    newTab,
    mainContentRef,
    setActiveTab,
    animateRibbonTabChange,
    cardsRef,
    animateCards,
    addCardHoverEffects
  ) => {
    // Remove GSAP animation: switch tab directly
    setActiveTab(newTab);
  };

  const animateRibbonTabChange = (newTab, tabsRef) => {
    if (tabsRef.current) {
      const tabButtons = tabsRef.current.querySelectorAll("button");
      const activeButton = Array.from(tabButtons).find(
        (btn) => btn.getAttribute("data-tab") === newTab
      );

      if (activeButton) {
        // Enhanced pulse effect with glass morphism
        gsap.fromTo(
          activeButton,
          { scale: 1 },
          {
            scale: 1.1,
            rotationY: 10,
            backdropFilter: "blur(25px) saturate(200%)",
            duration: 0.2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          }
        );

        // Glass ripple effect from the clicked tab
        const ripple = document.createElement("div");
        ripple.className = "absolute inset-0 rounded-2xl pointer-events-none";
        ripple.style.background =
          "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)";
        ripple.style.backdropFilter = "blur(10px)";
        activeButton.appendChild(ripple);

        gsap.fromTo(
          ripple,
          { scale: 0, opacity: 1 },
          {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
              if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
              }
            },
          }
        );
      }
    }
  };

  const animateCards = (cardsRef) => {
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 40,
            scale: 0.9,
            rotationY: -15,
            filter: "blur(8px)",
            transformPerspective: 1000,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            filter: "blur(0px)",
            duration: 0.7,
            delay: index * 0.15,
            ease: "power3.out",
          }
        );
      }
    });
  };

  const addCardHoverEffects = (cardsRef) => {
    cardsRef.current.forEach((card) => {
      if (card) {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            y: -8,
            scale: 1.02,
            rotationX: 5,
            rotationY: 5,
            transformPerspective: 1000,
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
            backdropFilter: "blur(15px) saturate(180%)",
            duration: 0.4,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            boxShadow:
              "0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
            backdropFilter: "blur(12px) saturate(150%)",
            duration: 0.4,
            ease: "power2.out",
          });
        });
      }
    });
  };

  const performEntranceAnimations = (
    headerRef,
    ribbonRef,
    quickStatsRef,
    mainContentRef,
    floatingElementsRef
  ) => {
    const tl = gsap.timeline();

    // Background particle animation
    const particles = createFloatingParticles();
    const blobs = createMorphingBlobs();
    floatingElementsRef.current = [...particles, ...blobs];

    // Header entrance with magnetic effect
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        {
          y: -80,
          opacity: 0,
          scale: 0.9,
          rotationX: -15,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationX: 0,
          duration: 1.2,
          ease: "power3.out",
        }
      );
    }

    // Ribbon with elegant slide-in and glass effect
    if (ribbonRef.current) {
      tl.fromTo(
        ribbonRef.current,
        {
          y: -40,
          opacity: 0,
          rotationX: -20,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      );
    }

    // Quick stats entrance with bounce
    if (quickStatsRef.current) {
      tl.fromTo(
        quickStatsRef.current,
        { y: 60, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)" },
        "-=0.4"
      );
    }

    // Main content with magical reveal
    if (mainContentRef.current) {
      tl.fromTo(
        mainContentRef.current,
        {
          y: 60,
          opacity: 0,
          scale: 0.95,
          filter: "blur(10px)",
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power2.out",
        },
        "-=0.6"
      );
    }

    // Add magical sparkle effects
    createSparkleEffect();
  };

  return {
    createFloatingParticles,
    createMorphingBlobs,
    createSparkleEffect,
    animateTabTransition,
    animateRibbonTabChange,
    animateCards,
    addCardHoverEffects,
    performEntranceAnimations,
  };
};
