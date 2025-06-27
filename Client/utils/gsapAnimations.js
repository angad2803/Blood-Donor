import { gsap } from "gsap";

/**
 * GSAP Animation Utilities for Blood Donor App
 * Reusable animation functions for consistent effects
 */

export const gsapAnimations = {
  // Page entrance animations
  pageEntrance: (element, delay = 0) => {
    return gsap.fromTo(
      element,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay }
    );
  },

  // Card stagger animations
  cardStagger: (elements, delay = 0) => {
    return gsap.fromTo(
      elements,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay,
      }
    );
  },

  // Modal animations
  modalEnter: (backdrop, content) => {
    const tl = gsap.timeline();
    tl.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    ).fromTo(
      content,
      { opacity: 0, scale: 0.9, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" },
      "-=0.1"
    );
    return tl;
  },

  modalExit: (backdrop, content, onComplete) => {
    const tl = gsap.timeline({ onComplete });
    tl.to(content, {
      opacity: 0,
      scale: 0.9,
      y: -30,
      duration: 0.3,
      ease: "power2.in",
    }).to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.out" }, "-=0.1");
    return tl;
  },

  // Button hover effects
  buttonHover: (element) => {
    element.addEventListener("mouseenter", () => {
      gsap.to(element, {
        scale: 1.05,
        y: -2,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    element.addEventListener("mouseleave", () => {
      gsap.to(element, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  },

  // Card hover effects
  cardHover: (elements) => {
    elements.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          y: -8,
          boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
          duration: 0.3,
          ease: "power2.out",
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          y: 0,
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
  },

  // Emergency pulse animation
  emergencyPulse: (elements) => {
    return gsap.to(elements, {
      scale: 1.05,
      duration: 0.8,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });
  },

  // Number counter animation
  numberCounter: (element, targetValue, duration = 1.5, delay = 0) => {
    return gsap.fromTo(
      element,
      { innerHTML: 0 },
      {
        innerHTML: targetValue,
        duration,
        ease: "power2.out",
        snap: { innerHTML: 1 },
        delay,
      }
    );
  },

  // Form field focus animations
  formFieldFocus: (element) => {
    element.addEventListener("focus", () => {
      gsap.to(element, {
        scale: 1.02,
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
        duration: 0.2,
        ease: "power2.out",
      });
    });

    element.addEventListener("blur", () => {
      gsap.to(element, {
        scale: 1,
        boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)",
        duration: 0.2,
        ease: "power2.out",
      });
    });
  },

  // Success animation
  successBounce: (element) => {
    return gsap.to(element, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
  },

  // Error shake animation
  errorShake: (element) => {
    return gsap.to(element, {
      x: -10,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        gsap.set(element, { x: 0 });
      },
    });
  },

  // Tab transition
  tabTransition: (oldContent, newContent, onSwitch) => {
    const tl = gsap.timeline();
    tl.to(oldContent, {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.out",
      onComplete: onSwitch,
    }).to(newContent, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    });
    return tl;
  },

  // Loading animation
  loadingPulse: (element) => {
    return gsap.to(element, {
      opacity: 0.5,
      scale: 0.98,
      duration: 0.8,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });
  },

  // Chat message entrance
  messageEnter: (element, fromRight = true) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        x: fromRight ? 30 : -30,
        scale: 0.9,
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      }
    );
  },

  // Blood drop animation
  bloodDrop: (element) => {
    return gsap.to(element, {
      y: 10,
      duration: 1,
      ease: "bounce.out",
      yoyo: true,
      repeat: -1,
    });
  },

  // Progress bar animation
  progressBar: (element, percentage, duration = 1) => {
    return gsap.to(element, {
      width: `${percentage}%`,
      duration,
      ease: "power2.out",
    });
  },
};

// Timeline creators for complex animations
export const gsapTimelines = {
  // Login page sequence
  loginSequence: (title, card, form) => {
    const tl = gsap.timeline();
    tl.fromTo(
      title,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    )
      .fromTo(
        card,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        form,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        "-=0.2"
      );
    return tl;
  },

  // Dashboard load sequence
  dashboardSequence: (header, stats, cards) => {
    const tl = gsap.timeline();
    tl.fromTo(
      header,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    )
      .fromTo(
        stats,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        },
        "-=0.2"
      );
    return tl;
  },
};

export default gsapAnimations;
