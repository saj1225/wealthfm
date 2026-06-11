import { Link, useLocation } from "react-router-dom";

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(250, 250, 249, 0.85)",
    backdropFilter: "blur(14px) saturate(180%)",
    WebkitBackdropFilter: "blur(14px) saturate(180%)",
    borderBottom: "1px solid #e7e7e3",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "14px max(20px, 4vw)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: "-0.02em",
    color: "#0a0a09",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  logoMark: {
    width: 22,
    height: 22,
    background: "#0a0a09",
    color: "#fafaf9",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Instrument Serif', serif",
    fontStyle: "italic",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1,
  },
  links: {
    display: "flex",
    gap: 28,
    alignItems: "center",
  },
  link: {
    fontSize: 13.5,
    color: "#2c2c2a",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.15s",
  },
  yt: {
    padding: "7px 13px",
    background: "#0a0a09",
    color: "#fafaf9",
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
    fontSize: 13,
    textDecoration: "none",
    transition: "all 0.15s",
  },
};

// Until you set your real channel URL, the YouTube button stays disabled-looking
// rather than linking to a placeholder. Replace YT_URL with your channel URL
// when ready and the buttons across the site will all light up.
export const YT_URL = "https://youtube.com/@wealthfm?si=vYFOQ1fWS3lI1o69";

export default function Header() {
  const loc = useLocation();
  const onLanding = loc.pathname === "/";

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoMark}>w</span>
          Wealth FM
        </Link>
        <div style={styles.links}>
          {!onLanding && (
            <Link to="/" style={styles.link} className="hide-mobile">
              Home
            </Link>
          )}
          <Link to="/#tools" style={styles.link} className="hide-mobile">
            Tools
          </Link>
          {onLanding && (
            <Link to="/#about" style={styles.link} className="hide-mobile">
              About
            </Link>
          )}
          {YT_URL ? (
            <a
              href={YT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.yt}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a8853")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a09")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                <path d="M21.582 7.171a2.504 2.504 0 0 0-1.768-1.768C18.254 5 12 5 12 5s-6.254 0-7.814.403A2.504 2.504 0 0 0 2.418 7.17C2 8.731 2 12 2 12s0 3.269.418 4.829a2.504 2.504 0 0 0 1.768 1.768C5.746 19 12 19 12 19s6.254 0 7.814-.403a2.504 2.504 0 0 0 1.768-1.768C22 15.269 22 12 22 12s0-3.269-.418-4.829zM10 15V9l5.196 3L10 15z" />
              </svg>
              YouTube
            </a>
          ) : null}
        </div>
      </div>
      <style>{`
        @media (max-width: 700px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
