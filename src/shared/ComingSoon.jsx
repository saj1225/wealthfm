import { Link } from "react-router-dom";

const styles = {
  wrap: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "clamp(60px, 10vw, 120px) max(20px, 4vw)",
    textAlign: "center",
    fontFamily: "'Geist', sans-serif",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "5px 14px 5px 6px",
    background: "#ffffff",
    border: "1px solid #e7e7e3",
    borderRadius: 100,
    fontSize: 12,
    color: "#2c2c2a",
    fontWeight: 500,
    marginBottom: 36,
  },
  dot: {
    width: 7,
    height: 7,
    background: "#1a8853",
    borderRadius: "50%",
    display: "inline-block",
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    background: "#0a0a09",
    color: "#fafaf9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Instrument Serif', serif",
    fontStyle: "italic",
    fontSize: 44,
    lineHeight: 1,
    margin: "0 auto 32px",
  },
  iconWarm: { background: "#d97757" },
  name: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    fontSize: "clamp(34px, 5vw, 52px)",
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    marginBottom: 10,
    color: "#0a0a09",
  },
  region: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 12,
    color: "#6e6e69",
    letterSpacing: "0.04em",
    marginBottom: 28,
  },
  tagline: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: "clamp(20px, 2.4vw, 28px)",
    fontStyle: "italic",
    color: "#1a8853",
    marginBottom: 18,
    letterSpacing: "-0.01em",
    lineHeight: 1.25,
  },
  desc: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "#2c2c2a",
    marginBottom: 40,
    maxWidth: "52ch",
    margin: "0 auto 40px",
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    fontFamily: "'Geist', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    background: "#0a0a09",
    color: "#fafaf9",
    borderRadius: 8,
    textDecoration: "none",
    transition: "background 0.15s",
  },
};

export default function ComingSoon({ letter, name, region, tagline, desc, iconColor }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>
        <span style={styles.dot} />
        In build · arriving later
      </div>
      <div style={{ ...styles.icon, ...(iconColor === "warm" ? styles.iconWarm : {}) }}>
        {letter}
      </div>
      <h1 style={styles.name}>{name}</h1>
      <div style={styles.region}>{region}</div>
      <p style={styles.tagline}>{tagline}</p>
      <p style={styles.desc}>{desc}</p>
      <Link
        to="/"
        style={styles.back}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1a8853")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a09")}
      >
        ← Back to WealthFM
      </Link>
    </div>
  );
}
