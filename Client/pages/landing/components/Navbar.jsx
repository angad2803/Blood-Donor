import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets, LayoutDashboard, Home, Menu, X, ArrowRight } from "lucide-react";
import ThemeToggle from "../../../components/ui/ThemeToggle";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const handleDashboard = () => {
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
      <div className="lp-nav__inner">
        {/* Brand */}
        <Link to="/" className="lp-nav__brand">
          <div className="lp-nav__logo-circle">
            <Droplets size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="lp-nav__brand-name">BloodBridge</div>
            <div className="lp-nav__brand-sub">Donor Network</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="lp-nav__links">
          <button className="lp-nav__link lp-nav__link--active" onClick={() => scrollTo("hero")}>
            <Home size={15} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Home
          </button>
          <button className="lp-nav__link" onClick={() => scrollTo("features")}>
            Features
          </button>
          <button className="lp-nav__link" onClick={() => scrollTo("how-it-works")}>
            How It Works
          </button>
          <button className="lp-nav__link" onClick={handleDashboard}>
            <LayoutDashboard size={15} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Dashboard
          </button>
          <button className="lp-nav__cta" onClick={handleDashboard}>
            Open Dashboard
            <ArrowRight size={15} />
          </button>
          <div className="lp-nav__theme-toggle">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: theme toggle always visible, hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginLeft: "auto" }} className="lp-mobile-controls">
          <div style={{ display: "block" }}>
            <ThemeToggle />
          </div>
          <button
            className="lp-nav__hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lp-nav__mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <button className="lp-nav__mobile-link" onClick={() => scrollTo("hero")}>Home</button>
            <button className="lp-nav__mobile-link" onClick={() => scrollTo("features")}>Features</button>
            <button className="lp-nav__mobile-link" onClick={() => scrollTo("how-it-works")}>How It Works</button>
            <button className="lp-nav__mobile-link" onClick={() => { setMobileOpen(false); handleDashboard(); }}>Dashboard</button>
            <button className="lp-nav__mobile-cta" onClick={() => { setMobileOpen(false); handleDashboard(); }}>
              Open Dashboard →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
