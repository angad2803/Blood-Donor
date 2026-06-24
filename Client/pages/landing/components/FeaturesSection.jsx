import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Bell,
  ShieldCheck,
  Search,
  Users,
  ClipboardList,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Smart Matching",
    desc: "Our algorithm instantly pairs blood requests with the nearest compatible donors, cutting response times dramatically.",
    color: "#e11d48",
    bg: "rgba(225,29,72,.1)",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    desc: "Donors receive push alerts the moment a compatible request is posted nearby — no delays, no missed opportunities.",
    color: "#f97316",
    bg: "rgba(249,115,22,.1)",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    desc: "End-to-end encrypted data, OAuth2 authentication, and HIPAA-aligned practices keep every user's information safe.",
    color: "#10b981",
    bg: "rgba(16,185,129,.1)",
  },
  {
    icon: Search,
    title: "Fast Search",
    desc: "Filter donors by blood type, location radius, and availability in seconds — find who you need before it's too late.",
    color: "#6366f1",
    bg: "rgba(99,102,241,.1)",
  },
  {
    icon: Users,
    title: "Community Support",
    desc: "Join thousands of altruistic donors building a safety net of blood supply for hospitals and individuals nationwide.",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,.1)",
  },
  {
    icon: ClipboardList,
    title: "Easy Request Management",
    desc: "Track active, fulfilled, and historical requests from one unified dashboard with clear status indicators.",
    color: "#a855f7",
    bg: "rgba(168,85,247,.1)",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="lp-section">
      <div className="lp-container">
        {/* Section Header */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="lp-section-label">
            <Zap size={13} />
            Features
          </div>
          <h2 className="lp-section-heading">
            Everything you need to{" "}
            <span style={{ color: "var(--clr-primary)" }}>save a life</span>
          </h2>
          <p className="lp-section-subheading">
            BloodBridge brings donors and recipients together through smart technology,
            real-time data, and a compassionate community — all in one place.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="lp-features__grid">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="lp-feature-card"
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                whileHover={{ y: -6 }}
              >
                <div
                  className="lp-feature-card__icon"
                  style={{ background: feat.bg }}
                >
                  <Icon size={26} color={feat.color} strokeWidth={1.75} />
                </div>
                <div className="lp-feature-card__title">{feat.title}</div>
                <div className="lp-feature-card__desc">{feat.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
