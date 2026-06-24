import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, ArrowRight, Heart } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

/* Inline SVG brand icons (lucide-react removed brand icons in v0.400+) */
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/angad2803",
    icon: GithubIcon,
  },
];

const quickLinks = [
  { label: "Home", id: "hero" },
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
];

const Footer = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDashboard = () => {
    navigate(token ? "/dashboard" : "/login");
  };

  return (
    <footer className="lp-footer">
      <div className="lp-footer__inner">
        {/* Top Row */}
        <div className="lp-footer__top">
          {/* Brand + Social */}
          <div className="lp-footer__brand-wrap">
            <Link to="/" className="lp-footer__brand">
              <div className="lp-footer__brand-logo">
                <Droplets size={22} color="#fff" strokeWidth={2} />
              </div>
              <span className="lp-footer__brand-name">BloodBridge</span>
            </Link>
            <p className="lp-footer__brand-desc">
              A next-generation blood donor network built to save lives faster.
              Connecting donors and patients through smart matching and real-time alerts.
            </p>

            {/* Social Icons */}
            <div className="lp-footer__social">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-footer__social-link"
                  aria-label={label}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="lp-footer__links-group">
            <div>
              <div className="lp-footer__col-title">Navigation</div>
              <ul className="lp-footer__col-links">
                {quickLinks.map(({ label, id }) => (
                  <li key={id}>
                    <button
                      className="lp-footer__col-link"
                      onClick={() => scrollTo(id)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="lp-footer__col-title">Platform</div>
              <ul className="lp-footer__col-links">
                <li>
                  <button className="lp-footer__col-link" onClick={handleDashboard}>
                    Dashboard
                  </button>
                </li>
                <li>
                  <Link to="/login" className="lp-footer__col-link">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="lp-footer__col-link">
                    Register
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="lp-footer__col-title">Get Started</div>
              <motion.button
                className="lp-hero__btn-primary"
                style={{ fontSize: ".85rem", padding: ".6rem 1.2rem", marginTop: ".25rem" }}
                onClick={handleDashboard}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Open Dashboard
                <ArrowRight size={15} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="lp-footer__bottom">
          <span className="lp-footer__copy">
            © {year} BloodBridge. All rights reserved.
          </span>

          <span className="lp-footer__made-by">
            Made with{" "}
            <Heart
              size={13}
              style={{ color: "var(--clr-primary)", fill: "var(--clr-primary)" }}
            />{" "}
            by{" "}
            <a
              href="https://github.com/angad2803"
              target="_blank"
              rel="noopener noreferrer"
            >
              Angad
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
