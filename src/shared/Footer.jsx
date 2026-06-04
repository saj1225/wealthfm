import { Link } from "react-router-dom";
import { YT_URL } from "./Header.jsx";

const styles = {
  footer: {
    padding: "44px max(20px, 4vw) 32px",
    maxWidth: 1200,
    margin: "0 auto",
    borderTop: "1px solid #e7e7e3",
    position: "relative",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: 40,
    flexWrap: "wrap",
    paddingBottom: 28,
    marginBottom: 22,
    borderBottom: "1px solid #e7e7e3",
  },
  brand: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 17,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    letterSpacing: "-0.02em",
    color: "#0a0a09",
    textDecoration: "none",
  },
  brandMark: {
    width: 20,
    height: 20,
    background: "#0a0a09",
    color: "#fafaf9",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Instrument Serif', serif",
    fontStyle: "italic",
    fontSize: 14,
    lineHeight: 1,
  },
  tagline: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11,
    color: "#6e6e69",
    marginTop: 8,
    letterSpacing: "0.04em",
  },
  cols: {
    display: "flex",
    gap: 48,
    flexWrap: "wrap",
  },
  colTitle: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#6e6e69",
    marginBottom: 12,
  },
  colLink: {
    display: "block",
    fontSize: 13.5,
    color: "#2c2c2a",
    textDecoration: "none",
    padding: "4px 0",
    fontFamily: "'Geist', sans-serif",
  },
  disclaimer: {
    fontSize: 11.5,
    lineHeight: 1.65,
    color: "#6e6e69",
    maxWidth: 720,
    marginBottom: 16,
    fontFamily: "'Geist', sans-serif",
  },
  copy: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 10,
    color: "#9a9a93",
    letterSpacing: "0.08em",
  },
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.top}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={styles.brand}>
            <span style={styles.brandMark}>w</span>
            Wealth FM
          </div>
          <div style={styles.tagline}>// INDEPENDENT · FREE · NO DATA CAPTURED</div>
        </Link>
        <div style={styles.cols}>
          <div>
            <div style={styles.colTitle}>Tools</div>
            <Link to="/mortgage" style={styles.colLink}>Mortgage Calculator</Link>
            <Link to="/fire" style={styles.colLink}>FIRE Planner</Link>
            <Link to="/trade" style={styles.colLink}>Trade Workbench</Link>
          </div>
          {YT_URL && (
            <div>
              <div style={styles.colTitle}>Follow</div>
              <a href={YT_URL} target="_blank" rel="noopener noreferrer" style={styles.colLink}>
                YouTube
              </a>
            </div>
          )}
        </div>
      </div>
      <p style={styles.disclaimer}>
        WealthFM publishes editorial and educational content. Nothing on this site or its associated channels is financial, tax, investment or legal advice, a personal recommendation, or a solicitation to buy or sell any security or product. Any tools provided are for informational and calculation purposes only; figures are estimates not quotes. Markets carry risk; consult a qualified, regulated adviser before making decisions.
      </p>
      <div style={styles.copy}>© {new Date().getFullYear()} WEALTHFM · ALL RIGHTS RESERVED</div>
    </footer>
  );
}
