import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { gsap } from "gsap";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const fieldsRef = useRef([]);

  useEffect(() => {
    if (containerRef.current && cardRef.current) {
      // Enhanced entrance animation
      const tl = gsap.timeline();

      tl.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.8, rotationY: -20 },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 1,
          ease: "back.out(1.7)",
        }
      ).fromTo(
        fieldsRef.current,
        { opacity: 0, x: -20, y: 10 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.6"
      );

      // Add floating particles
      const particles =
        containerRef.current.querySelectorAll(".profile-particle");
      particles.forEach((particle) => {
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });

        gsap.to(particle, {
          y: `+=${(Math.random() - 0.5) * 200}`,
          x: `+=${(Math.random() - 0.5) * 100}`,
          rotation: 360,
          duration: Math.random() * 20 + 25,
          repeat: -1,
          ease: "none",
        });
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-white/80 text-lg">Not logged in.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#5b21b6] relative overflow-hidden flex items-center justify-center"
      ref={containerRef}
    >
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 200 + 50 + "px",
              height: Math.random() * 200 + 50 + "px",
              background: `radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)`,
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 25 + 30}s infinite linear`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="glass-card p-8 glass-interactive" ref={cardRef}>
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 glass-interactive">
              <span className="text-3xl">{user.isDonor ? "🩸" : "🏥"}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 neon-glow">
              {user.name}
            </h2>
            <div className="glass-card-primary px-4 py-2 rounded-full inline-block">
              <span className="text-white/90 font-medium">
                {user.isDonor
                  ? "Blood Donor"
                  : user.isHospital
                    ? "Hospital"
                    : "User"}
              </span>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div
              className="glass-card p-4 glass-interactive"
              ref={(el) => (fieldsRef.current[0] = el)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-white/60 text-sm">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {user.bloodGroup && (
              <div
                className="glass-card-danger p-4 glass-interactive"
                ref={(el) => (fieldsRef.current[1] = el)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl neon-glow">🩸</span>
                  <div>
                    <p className="text-red-300 text-sm">Blood Group</p>
                    <p className="text-red-200 font-bold text-lg">
                      {user.bloodGroup}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className="glass-card p-4 glass-interactive"
              ref={(el) => (fieldsRef.current[2] = el)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-white/60 text-sm">Location</p>
                  <p className="text-white font-medium">{user.location}</p>
                </div>
              </div>
            </div>

            <div
              className="glass-card p-4 glass-interactive"
              ref={(el) => (fieldsRef.current[3] = el)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{user.isDonor ? "💖" : "🏥"}</span>
                <div>
                  <p className="text-white/60 text-sm">Account Type</p>
                  <p className="text-white font-medium">
                    {user.isDonor
                      ? "Active Donor"
                      : user.isHospital
                        ? "Medical Institution"
                        : "Standard User"}
                  </p>
                </div>
              </div>
            </div>

            {user.isHospital && (
              <div
                className="glass-card-primary p-4 glass-interactive"
                ref={(el) => (fieldsRef.current[4] = el)}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏥</span>
                    <div>
                      <p className="text-blue-300 text-sm">Hospital Name</p>
                      <p className="text-blue-200 font-medium">
                        {user.hospitalName}
                      </p>
                    </div>
                  </div>
                  {user.hospitalAddress && (
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-2xl">🏢</span>
                      <div>
                        <p className="text-blue-300 text-sm">
                          Hospital Address
                        </p>
                        <p className="text-blue-200 font-medium">
                          {user.hospitalAddress}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => window.history.back()}
                className="flex-1 glass-button py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 glass-interactive"
              >
                <span className="mr-2">←</span>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
