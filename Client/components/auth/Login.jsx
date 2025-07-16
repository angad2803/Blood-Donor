import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // GSAP refs
  const titleRef = useRef(null);
  const bloodEmojiRef = useRef(null);
  const cardRef = useRef(null);
  const formRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();

    // Animate blood emoji with pulse effect
    tl.fromTo(
      bloodEmojiRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.2,
        ease: "elastic.out(1, 0.8)",
      }
    )
      // Animate title with typewriter effect
      .fromTo(
        titleRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.6"
      )
      // Animate card entrance
      .fromTo(
        cardRef.current,
        { opacity: 0, y: 100, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" },
        "-=0.4"
      )
      // Animate form elements
      .fromTo(
        formRef.current.querySelectorAll("input, button"),
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );

    // Continuous pulse animation for blood emoji
    gsap.to(bloodEmojiRef.current, {
      scale: 1.1,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });

    // Floating animation for the card
    gsap.to(cardRef.current, {
      y: -10,
      duration: 3,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    });

    // Animate particles
    if (particlesRef.current) {
      const particles =
        particlesRef.current.querySelectorAll(".plasma-particle");
      particles.forEach((particle, index) => {
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          scale: Math.random() * 0.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
        });

        gsap.to(particle, {
          x: `+=${Math.random() * 200 - 100}`,
          y: `+=${Math.random() * 200 - 100}`,
          rotation: 360,
          duration: Math.random() * 20 + 15,
          ease: "none",
          repeat: -1,
          yoyo: true,
          delay: index * 0.2,
        });
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Loading animation
    gsap.to(formRef.current, {
      scale: 0.95,
      opacity: 0.7,
      duration: 0.3,
      ease: "power2.out",
    });

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Success animation
      gsap.to(cardRef.current, {
        scale: 1.05,
        rotation: 2,
        duration: 0.3,
        ease: "back.out(1.7)",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to([cardRef.current, titleRef.current, bloodEmojiRef.current], {
            x: window.innerWidth,
            opacity: 0,
            duration: 0.8,
            ease: "power2.in",
          });
        },
      });
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      setError(result.message || "Login failed");

      // Error shake animation
      gsap.to(cardRef.current, {
        x: -10,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 5,
        onComplete: () => gsap.set(cardRef.current, { x: 0 }),
      });
    }

    // Reset form animation
    gsap.to(formRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] font-[Inter,sans-serif] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div
        ref={particlesRef}
        className="absolute inset-0 pointer-events-none opacity-30"
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={`plasma-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 150 + 50 + "px",
              height: Math.random() * 150 + 50 + "px",
              background: `radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)`,
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 25 + 30}s infinite linear`,
            }}
          />
        ))}

        {/* Subtle floating blood cells */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`blood-cell-${i}`}
            className="absolute opacity-10 text-xl"
            style={{
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 20 + 25}s infinite linear`,
              animationDelay: Math.random() * 10 + "s",
            }}
          >
            🩸
          </div>
        ))}
      </div>

      {/* Title and Blood Emoji Outside Card */}
      <div className="text-center mb-8 z-10">
        <div
          ref={bloodEmojiRef}
          className="text-7xl mb-4 filter drop-shadow-2xl"
          style={{
            filter:
              "drop-shadow(0 0 20px rgba(220, 38, 127, 0.8)) drop-shadow(0 0 40px rgba(220, 38, 127, 0.4))",
          }}
        >
          🩸
        </div>
        <h1
          ref={titleRef}
          className="text-5xl font-bold text-white mb-2"
          style={{
            textShadow:
              "0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(220, 38, 127, 0.3)",
          }}
        >
          Blood Donor
        </h1>
        <p className="text-xl text-gray-200 font-medium">
          Save lives, donate blood
        </p>
      </div>

      {/* Glassmorphic Login Card */}
      <div
        ref={cardRef}
        className="backdrop-blur-xl bg-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl px-10 py-8 w-full max-w-md border border-white/20 z-10"
        style={{
          boxShadow:
            "0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        }}
      >
        <h2 className="text-2xl font-semibold text-white text-center mb-6">
          Login
        </h2>

        <form
          ref={formRef}
          className="w-full flex flex-col gap-5"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{
              fontFamily: "inherit",
              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
            }}
          />
          <input
            type="password"
            className="w-full px-4 py-4 bg-[#2A2E40]/90 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              fontFamily: "inherit",
              boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)",
            }}
          />
          <button
            type="submit"
            className="w-full py-4 text-lg font-semibold rounded-lg bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white shadow-lg transition-all duration-300 hover:brightness-110 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00E4FF]/60 active:scale-95"
            disabled={loading}
            style={{
              fontFamily: "inherit",
              boxShadow: "0 10px 30px rgba(0, 198, 255, 0.3)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {error && (
          <div className="w-full mt-4 text-center text-red-300 bg-red-500/20 rounded-lg py-3 px-4 text-sm font-medium border border-red-400/30 backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="text-center mt-6 text-white/90 text-sm">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-[#00E4FF] font-semibold hover:underline transition-colors"
          >
            Register
          </a>
        </div>

        <div className="flex items-center my-6 w-full">
          <div className="flex-grow h-px bg-white/30" />
          <span className="mx-4 text-white/60 text-sm">or</span>
          <div className="flex-grow h-px bg-white/30" />
        </div>

        <a
          href="http://localhost:5000/api/auth/google"
          className="w-full block"
        >
          <button
            type="button"
            className="w-full py-4 flex items-center justify-center gap-3 text-lg font-semibold rounded-lg bg-[#DB4437] text-white shadow-lg hover:brightness-110 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#DB4437]/60 active:scale-95"
            style={{
              fontFamily: "inherit",
              boxShadow: "0 10px 30px rgba(219, 68, 55, 0.3)",
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <g>
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.13 13.13 17.57 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.99 37.13 46.1 31.3 46.1 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.67 28.29a14.5 14.5 0 0 1 0-8.58l-7.98-6.2A23.97 23.97 0 0 0 0 24c0 3.82.92 7.44 2.69 10.49l7.98-6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 48c6.18 0 11.36-2.05 15.15-5.57l-7.19-5.6c-2 1.34-4.56 2.14-7.96 2.14-6.43 0-11.87-3.63-14.33-8.79l-7.98 6.2C6.71 42.18 14.82 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
            Login with Google
          </button>
        </a>
      </div>
    </div>
  );
}
