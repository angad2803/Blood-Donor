import React from "react";
import { motion } from "framer-motion";
import { UserPlus, FilePlus, GitMerge, LayoutDashboard, Sparkles } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Register or Login",
    desc: "Create a free account in under a minute. Sign up as a donor, patient, or hospital with secure OAuth or email authentication.",
    color: "#e11d48",
    bg: "rgba(225,29,72,.1)",
  },
  {
    icon: FilePlus,
    title: "Create or Search Requests",
    desc: "Post an urgent blood request with your blood type and location, or browse available donors matching your requirements nearby.",
    color: "#f97316",
    bg: "rgba(249,115,22,.1)",
  },
  {
    icon: GitMerge,
    title: "Get Matched Instantly",
    desc: "Our smart matching engine pairs you with the closest compatible donor in real-time, notifying both parties immediately.",
    color: "#10b981",
    bg: "rgba(16,185,129,.1)",
  },
  {
    icon: LayoutDashboard,
    title: "Manage via Dashboard",
    desc: "Track every request, view match history, update your availability, and communicate — all from one powerful dashboard.",
    color: "#6366f1",
    bg: "rgba(99,102,241,.1)",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const stepVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="lp-section lp-section--alt">
      <div className="lp-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lp-section-label">
            <Sparkles size={13} />
            How It Works
          </div>
          <h2 className="lp-section-heading">
            Up and running in{" "}
            <span style={{ color: "var(--clr-primary)" }}>4 simple steps</span>
          </h2>
          <p className="lp-section-subheading">
            From registration to saving a life — BloodBridge guides you through every step
            with clarity and speed.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          className="lp-hiw__steps"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                className="lp-hiw__step"
                variants={stepVariants}
                whileHover={{ y: -5, boxShadow: "var(--shadow-lg)" }}
              >
                {/* Step Number Badge */}
                <div className="lp-hiw__step-num">{i + 1}</div>

                {/* Icon */}
                <div className="lp-hiw__step-icon" style={{ background: step.bg }}>
                  <Icon size={28} color={step.color} strokeWidth={1.75} />
                </div>

                <div className="lp-hiw__step-title">{step.title}</div>
                <div className="lp-hiw__step-desc">{step.desc}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Connector dots between steps (decorative, desktop only) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".5rem",
            marginTop: "2.5rem",
          }}
        >
          {steps.map((_, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === 0 ? "var(--clr-primary)" : "var(--clr-border)",
                  transition: "background 0.3s",
                }}
              />
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 48,
                    height: 2,
                    background: "linear-gradient(90deg, var(--clr-primary), var(--clr-border))",
                    borderRadius: 2,
                    opacity: 0.4,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
