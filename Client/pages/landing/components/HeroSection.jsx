import React from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, ArrowRight, ChevronDown, Users, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const HeroSection = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate(token ? "/dashboard" : "/login");
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="lp-hero">
      {/* Decorative backgrounds */}
      <div className="lp-hero__bg-gradient" aria-hidden="true" />
      <div className="lp-hero__bg-grid" aria-hidden="true" />

      {/* Floating decorative blobs */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(225,29,72,.12) 0%, transparent 70%)",
          top: "15%",
          right: "5%",
          pointerEvents: "none",
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,.1) 0%, transparent 70%)",
          bottom: "15%",
          left: "5%",
          pointerEvents: "none",
        }}
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="lp-hero__content">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="lp-hero__badge"
        >
          <Droplets size={13} />
          Life-Saving Donor Network
        </motion.div>

        {/* Logo */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="lp-hero__logo-wrap"
          whileHover={{ scale: 1.06, rotate: 3 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Droplets size={46} color="#fff" strokeWidth={2} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="lp-hero__heading"
        >
          Connect Donors.{" "}
          <span className="lp-hero__heading-gradient">Save Lives.</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="lp-hero__tagline"
        >
          BloodBridge intelligently matches blood donors with patients in urgent need —
          making every second count when lives hang in the balance.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="lp-hero__actions"
        >
          <motion.button
            className="lp-hero__btn-primary"
            onClick={handleDashboard}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Go to Dashboard
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
          <motion.button
            className="lp-hero__btn-secondary"
            onClick={scrollToFeatures}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Learn More
            <ChevronDown size={18} />
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="lp-hero__stats"
        >
          <div className="lp-hero__stat">
            <div className="lp-hero__stat-value">10K+</div>
            <div className="lp-hero__stat-label">Active Donors</div>
          </div>
          <div className="lp-hero__stat-divider" />
          <div className="lp-hero__stat">
            <div className="lp-hero__stat-value" style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <Heart size={20} style={{ color: "var(--clr-primary)" }} />
              5K+
            </div>
            <div className="lp-hero__stat-label">Lives Saved</div>
          </div>
          <div className="lp-hero__stat-divider" />
          <div className="lp-hero__stat">
            <div className="lp-hero__stat-value" style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <Clock size={20} style={{ color: "var(--clr-primary)" }} />
              &lt;2 min
            </div>
            <div className="lp-hero__stat-label">Match Time</div>
          </div>
          <div className="lp-hero__stat-divider" />
          <div className="lp-hero__stat">
            <div className="lp-hero__stat-value" style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
              <Users size={20} style={{ color: "var(--clr-primary)" }} />
              200+
            </div>
            <div className="lp-hero__stat-label">Hospitals</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
