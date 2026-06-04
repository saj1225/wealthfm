import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../shared/Header.jsx";
import Footer from "../shared/Footer.jsx";

const styles = {
  wrap: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "clamp(80px, 12vw, 160px) max(20px, 4vw)",
    textAlign: "center",
    fontFamily: "'Geist', sans-serif",
  },
  code: {
    fontFamily: "'Instrument Serif', serif",
    fontStyle: "italic",
    fontSize: "clamp(80px, 14vw, 140px)",
    color: "#1a8853",
    letterSpacing: "-0.04em",
    lineHeight: 1,
    marginBottom: 24,
  },
  title: {
    fontWeight: 600,
    fontSize: "clamp(24px, 3.5vw, 32px)",
    letterSpacing: "-0.02em",
    marginBottom: 14,
    color: "#0a0a09",
  },
  desc: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "#2c2c2a",
    marginBottom: 36,
    maxWidth: "44ch",
    margin: "0 auto 36px",
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 500,
    background: "#0a0a09",
    color: "#fafaf9",
    borderRadius: 8,
    textDecoration: "none",
  },
};

export default function NotFound() {
  useEffect(() => {
    document.title = "Not Found | WealthFM";
  }, []);

  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1 }}>
        <div style={styles.wrap}>
          <div style={styles.code}>404</div>
          <h1 style={styles.title}>Page not found</h1>
          <p style={styles.desc}>
            The page you're looking for isn't here. It may have moved, been retired, or never existed.
          </p>
          <Link to="/" style={styles.back}>← Back to WealthFM</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
