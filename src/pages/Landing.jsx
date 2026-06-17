import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header, { YT_URL } from "../shared/Header.jsx";
import Footer from "../shared/Footer.jsx";

// Status pills on the tools section. When you're ready to launch a tool,
// change its status to "live" and the card will become a real link.
const TOOLS = [
  {
    id: "mortgage",
    name: "Mortgage Calculator",
    region: "UK",
    flag: "🇬🇧",
    iconAccent: "accent",
    desc: "Residential and buy-to-let calculator. Affordability, stamp duty, ICR stress tests, remortgage break-even.",
    features: ["Purchase & remortgage", "BTL with Section 24", "SDLT band breakdown"],
    status: "soon", // "soon" | "build" | "live"
  },
  {
    id: "fire",
    name: "FIRE Planner",
    region: "UK",
    flag: "🇬🇧",
    iconAccent: null,
    desc: "A financial-independence planner with ISA & SIPP modelling, coasting phase, and Coast FIRE mechanics.",
    features: ["ISA & SIPP modelling", "Coast / Lean / Fat FIRE", "Property & mortgage"],
    status: "live",
  },
  {
    id: "trade",
    name: "Trade Workbench",
    region: "Global",
    flag: "🌐",
    iconAccent: "warm",
    desc: "A technical analysis and risk workbench. Position sizing, R-multiples and setup tracking for serious traders.",
    features: ["Risk & position sizing", "Setup logging", "R-multiple analytics"],
    status: "build",
  },
];

export default function Landing() {
  const loc = useLocation();

  // Set the browser tab title for this route
  useEffect(() => {
    document.title = "WealthFM — Precise tools for personal finance";
  }, []);

  // Handle hash anchors (e.g. /#tools) so links from other pages scroll correctly
  useEffect(() => {
    if (loc.hash) {
      const el = document.querySelector(loc.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [loc]);

  return (
    <div style={{ background: "#fafaf9", color: "#0a0a09", fontFamily: "'Geist', sans-serif", overflowX: "hidden", position: "relative" }}>
      <PageStyles />

      <Header />

      {/* ── HERO ── */}
      <header className="hero">
        <h1 className="hero-title">
          Precise tools for <em>personal finance.</em>
        </h1>
        <p className="hero-sub">
          A small set of carefully built financial calculators with the maths done right — and an occasional channel that explains the macro picture beneath them.
        </p>
        <div className="hero-cta">
          <a href="#tools" className="btn btn-primary">
            See the tools <span className="arrow">→</span>
          </a>
          {YT_URL ? (
            <a href={YT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <YTIcon />
              Watch on YouTube
            </a>
          ) : null}
        </div>

        {/* Dashboard mockup */}
        <div className="dash">
          <div className="dash-bar">
            <div className="dash-dots">
              <span className="dash-dot r" />
              <span className="dash-dot y" />
              <span className="dash-dot g" />
            </div>
            <div className="dash-url">
              <span className="secure">●</span>wealthfm.co.uk/mortgage
            </div>
          </div>
          <div className="dash-content">
            <div className="dash-side">
              <div className="dash-side-title">Tools</div>
              <div className="dash-side-item active"><span className="ico" />Mortgage Calculator</div>
              <div className="dash-side-item"><span className="ico" />FIRE Planner</div>
              <div className="dash-side-item"><span className="ico" />Trade Workbench</div>
              <div className="dash-side-title" style={{ marginTop: 24 }}>Sections</div>
              <div className="dash-side-item"><span className="ico" />Affordability</div>
              <div className="dash-side-item"><span className="ico" />Costs &amp; SDLT</div>
              <div className="dash-side-item"><span className="ico" />Amortisation</div>
            </div>
            <div className="dash-main">
              <div className="dash-h">
                <div className="dash-h-title">Mortgage Calculator</div>
                <div className="dash-h-meta">UK · 5-YR FIX</div>
              </div>
              <div className="dash-stats">
                <StatBox label="Monthly payment" val="£2,003" sub="Capital & interest" accent />
                <StatBox label="Loan-to-value" val="72.0%" sub="Strong position" subPos />
                <StatBox label="5-yr saving vs SVR" val="£18,420" sub="+5.1% / yr" subPos />
              </div>
              <div className="dash-chart">
                <div className="chart-label">Outstanding balance · 25-yr term</div>
                <div className="chart-svg">
                  <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                    <path className="chart-fill" d="M0,72 Q60,62 110,52 T200,32 T320,12 T400,4 L400,80 L0,80 Z" />
                    <path className="chart-line" d="M0,72 Q60,62 110,52 T200,32 T320,12 T400,4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── PRINCIPLES ── */}
      <section className="principles">
        <div className="section-meta">
          <span className="num">01</span>
          <span>Principles</span>
        </div>
        <div className="section-h">
          Four <em>commitments</em>, kept by design.
        </div>
        <div className="principles-grid">
          <Principle mark="01 / Built carefully" title="Maths done right">
            Each tool answers one specific question well, with the workings shown — not a black box.
          </Principle>
          <Principle mark="02 / Free, forever" title="No paywalls">
            No subscriptions, no upsells, no lead capture. Use the tools as long as you need.
          </Principle>
          <Principle mark="03 / Private by default" title="Your data stays yours">
            Nothing leaves your browser. No accounts. No tracking pixels. No profiles built.
          </Principle>
          <Principle mark="04 / Not advice" title="Honest about limits">
            These are calculation tools, not recommendations. Speak to an adviser for that.
          </Principle>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="about" id="about">
        <div className="about-inner">
          <div>
            <div className="about-eyebrow">// About</div>
          </div>
          <div className="about-body">
            <h2>
              One operator. A <em>few good tools.</em> No noise.
            </h2>
            <p>
              WealthFM is run by one person who works in financial services and has been investing personally for over a decade. The aim is small and specific: build the kind of free financial tools that should already exist — clear, careful, no strings.
            </p>
            <p>
              Most online calculators either cost money, ask for your data, or quietly steer you toward a product. The ones here do none of those things. They run in your browser, work out the answer, and leave you to decide what to do with it.
            </p>
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className="tools" id="tools">
        <div className="section-meta">
          <span className="num">02</span>
          <span>The tools</span>
        </div>
        <div className="section-h">
          Three tools. Each a <em>different</em> decision.
        </div>
        <div className="tools-grid">
          {TOOLS.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta">
        <div className="cta-card">
          <div>
            <div className="cta-text">
              Occasional notes &amp; analysis go up on <em>YouTube.</em>
            </div>
            <div className="cta-meta">// New work, when it's ready — not on a schedule.</div>
          </div>
          {YT_URL ? (
            <a href={YT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <YTIcon />
              Subscribe <span className="arrow">→</span>
            </a>
          ) : (
            <div className="cta-placeholder">YouTube channel coming soon</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function StatBox({ label, val, sub, accent, subPos }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className={"stat-val" + (accent ? " accent" : "")}>{val}</div>
      <div className={"stat-sub" + (subPos ? " pos" : "")}>{sub}</div>
    </div>
  );
}

function Principle({ mark, title, children }) {
  return (
    <div className="principle">
      <div className="principle-mark">{mark}</div>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function ToolCard({ tool }) {
  const statusLabel = { soon: "Soon", build: "In build", live: "Live" }[tool.status];
  const statusClass = { soon: "stat-soon", build: "stat-build", live: "stat-live" }[tool.status];
  const isLive = tool.status === "live";

  const inner = (
    <>
      <div className="tool-head">
        <div className={"tool-icon" + (tool.iconAccent === "accent" ? " accent" : tool.iconAccent === "warm" ? " warm" : "")}>
          {tool.name.charAt(0)}
        </div>
        <span className={"tool-status " + statusClass}>{statusLabel}</span>
      </div>
      <div className="tool-name">{tool.name}</div>
      <div className="tool-region">
        {tool.region} · {tool.flag}
      </div>
      <div className="tool-desc">{tool.desc}</div>
      <ul className="tool-features">
        {tool.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </>
  );

  if (isLive) {
    return (
      <Link to={"/" + tool.id} className="tool-card tool-card-link">
        {inner}
      </Link>
    );
  }
  return <div className="tool-card">{inner}</div>;
}

function YTIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M21.582 7.171a2.504 2.504 0 0 0-1.768-1.768C18.254 5 12 5 12 5s-6.254 0-7.814.403A2.504 2.504 0 0 0 2.418 7.17C2 8.731 2 12 2 12s0 3.269.418 4.829a2.504 2.504 0 0 0 1.768 1.768C5.746 19 12 19 12 19s6.254 0 7.814-.403a2.504 2.504 0 0 0 1.768-1.768C22 15.269 22 12 22 12s0-3.269-.418-4.829zM10 15V9l5.196 3L10 15z" />
    </svg>
  );
}

/* ── All page styles isolated to this component ── */
function PageStyles() {
  return (
    <style>{`
      body { background: #fafaf9; }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(to right, rgba(0,0,0,0.018) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.018) 1px, transparent 1px);
        background-size: 56px 56px;
        pointer-events: none;
        z-index: 0;
      }

      .hero {
        position: relative;
        z-index: 1;
        padding: clamp(50px, 8vw, 90px) max(20px, 4vw) clamp(50px, 7vw, 80px);
        max-width: 1200px;
        margin: 0 auto;
      }
      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 5px 12px 5px 6px;
        background: #ffffff;
        border: 1px solid #e7e7e3;
        border-radius: 100px;
        font-size: 12px;
        color: #2c2c2a;
        font-weight: 500;
        margin-bottom: 32px;
      }
      .hero-badge .dot {
        width: 7px; height: 7px;
        background: #1a8853;
        border-radius: 50%;
        animation: pulse 2.4s infinite;
      }
      .hero-badge .tag {
        font-family: 'Geist Mono', monospace;
        background: #e3f1e9;
        color: #136a40;
        padding: 2px 8px;
        border-radius: 100px;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        font-weight: 600;
      }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

      .hero-title {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: clamp(40px, 6.5vw, 76px);
        line-height: 1.02;
        letter-spacing: -0.04em;
        color: #0a0a09;
        max-width: 16ch;
        margin-bottom: 22px;
      }
      .hero-title em {
        font-family: 'Instrument Serif', Georgia, serif;
        font-style: italic;
        font-weight: 400;
        color: #0a0a09;
        font-size: 1.05em;
        letter-spacing: -0.02em;
      }

      .hero-sub {
        font-size: clamp(16px, 1.25vw, 19px);
        line-height: 1.55;
        color: #2c2c2a;
        max-width: 56ch;
        margin-bottom: 36px;
      }

      .hero-cta {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        font-family: 'Geist', sans-serif;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.15s ease;
        cursor: pointer;
        border: 1px solid transparent;
        letter-spacing: -0.005em;
      }
      .btn-primary { background: #0a0a09; color: #fafaf9; }
      .btn-primary:hover { background: #1a8853; }
      .btn-secondary {
        background: #ffffff;
        color: #0a0a09;
        border-color: #d2d2cc;
      }
      .btn-secondary:hover {
        border-color: #0a0a09;
        background: #f3f3f1;
      }
      .btn .arrow { transition: transform 0.2s; display: inline-block; }
      .btn:hover .arrow { transform: translateX(2px); }

      .dash {
        margin-top: 64px;
        background: #ffffff;
        border: 1px solid #e7e7e3;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 50px 80px -40px rgba(10,10,9,0.18);
        position: relative;
      }
      .dash-bar {
        background: #f3f3f1;
        border-bottom: 1px solid #e7e7e3;
        padding: 11px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: #6e6e69;
      }
      .dash-dots { display: flex; gap: 5px; }
      .dash-dot { width: 9px; height: 9px; border-radius: 50%; }
      .dash-dot.r { background: #ff5f56; }
      .dash-dot.y { background: #ffbd2e; }
      .dash-dot.g { background: #27c93f; }
      .dash-url {
        background: #ffffff;
        border-radius: 6px;
        padding: 4px 10px;
        font-family: 'Geist Mono', monospace;
        font-size: 11.5px;
        color: #2c2c2a;
        flex: 1;
        max-width: 320px;
        margin: 0 auto;
        border: 1px solid #e7e7e3;
        text-align: center;
      }
      .dash-url .secure { color: #1a8853; margin-right: 4px; }

      .dash-content {
        display: grid;
        grid-template-columns: 240px 1fr;
        min-height: 380px;
      }
      .dash-side {
        background: #fafaf9;
        border-right: 1px solid #e7e7e3;
        padding: 20px 16px;
      }
      .dash-side-title {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #6e6e69;
        margin-bottom: 14px;
        padding: 0 8px;
      }
      .dash-side-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        font-size: 13.5px;
        color: #2c2c2a;
        border-radius: 6px;
        margin-bottom: 2px;
      }
      .dash-side-item.active {
        background: #0a0a09;
        color: #fafaf9;
      }
      .dash-side-item.active .ico { background: #1a8853; }
      .dash-side-item .ico {
        width: 14px; height: 14px;
        background: #d2d2cc;
        border-radius: 3px;
      }

      .dash-main { padding: 28px; }
      .dash-h {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 22px;
      }
      .dash-h-title {
        font-family: 'Instrument Serif', serif;
        font-size: 26px;
        letter-spacing: -0.02em;
        color: #0a0a09;
      }
      .dash-h-meta {
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #6e6e69;
      }
      .dash-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 22px;
      }
      .stat-box {
        background: #fafaf9;
        border: 1px solid #e7e7e3;
        border-radius: 10px;
        padding: 14px 16px;
      }
      .stat-label {
        font-size: 11px;
        color: #6e6e69;
        margin-bottom: 4px;
        font-weight: 500;
      }
      .stat-val {
        font-family: 'Instrument Serif', serif;
        font-size: 22px;
        color: #0a0a09;
        letter-spacing: -0.02em;
        margin-bottom: 4px;
      }
      .stat-val.accent { color: #1a8853; }
      .stat-sub {
        font-family: 'Geist Mono', monospace;
        font-size: 10.5px;
        color: #6e6e69;
      }
      .stat-sub.pos { color: #1a8853; }

      .dash-chart {
        background: #fafaf9;
        border: 1px solid #e7e7e3;
        border-radius: 10px;
        padding: 16px 18px;
        height: 130px;
        position: relative;
      }
      .chart-label {
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #6e6e69;
        margin-bottom: 6px;
      }
      .chart-svg {
        position: absolute;
        bottom: 12px;
        left: 18px;
        right: 18px;
        height: 80px;
      }
      .chart-line {
        stroke: #1a8853;
        stroke-width: 2;
        fill: none;
        stroke-dasharray: 800;
        stroke-dashoffset: 800;
        animation: drawLine 2.5s 0.6s ease-out forwards;
      }
      .chart-fill {
        fill: #1a8853;
        opacity: 0;
        animation: fadeIn 0.8s 2.2s ease-out forwards;
      }
      @keyframes drawLine { to { stroke-dashoffset: 0; } }
      @keyframes fadeIn { to { opacity: 0.08; } }

      .section-meta {
        display: flex;
        gap: 14px;
        align-items: center;
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #6e6e69;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 18px;
      }
      .section-meta .num {
        background: #0a0a09;
        color: #fafaf9;
        padding: 3px 9px;
        border-radius: 100px;
        font-weight: 600;
      }
      .section-h {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: clamp(28px, 4vw, 46px);
        line-height: 1.05;
        letter-spacing: -0.03em;
        max-width: 22ch;
        margin-bottom: 50px;
      }
      .section-h em {
        font-family: 'Instrument Serif', serif;
        font-style: italic;
        font-weight: 400;
      }

      .principles {
        position: relative;
        z-index: 1;
        padding: clamp(70px, 9vw, 110px) max(20px, 4vw);
        max-width: 1200px;
        margin: 0 auto;
        border-top: 1px solid #e7e7e3;
      }
      .principles-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background: #e7e7e3;
        border: 1px solid #e7e7e3;
        border-radius: 12px;
        overflow: hidden;
      }
      .principle {
        background: #fafaf9;
        padding: 26px 22px;
      }
      .principle-mark {
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #1a8853;
        font-weight: 600;
        margin-bottom: 14px;
      }
      .principle h4 {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: 17px;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        color: #0a0a09;
      }
      .principle p {
        font-size: 13.5px;
        line-height: 1.55;
        color: #2c2c2a;
      }

      .about {
        background: #0a0a09;
        color: #fafaf9;
        padding: clamp(70px, 9vw, 110px) max(20px, 4vw);
        position: relative;
        overflow: hidden;
      }
      .about::before {
        content: "";
        position: absolute;
        top: 0; right: 0;
        width: 60%; height: 100%;
        background: radial-gradient(ellipse 60% 80% at 100% 50%, rgba(26, 136, 83, 0.18), transparent 65%);
        pointer-events: none;
      }
      .about-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1.6fr;
        gap: clamp(40px, 6vw, 100px);
        align-items: start;
        position: relative;
      }
      .about-eyebrow {
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #5fb985;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .about-body h2 {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: clamp(30px, 4.5vw, 48px);
        line-height: 1.05;
        letter-spacing: -0.03em;
        margin-bottom: 26px;
        max-width: 22ch;
        color: #fafaf9;
      }
      .about-body h2 em {
        font-family: 'Instrument Serif', serif;
        font-style: italic;
        font-weight: 400;
        color: #8edab1;
      }
      .about-body p {
        font-size: 16px;
        line-height: 1.65;
        color: #cfceca;
        max-width: 60ch;
        margin-bottom: 18px;
      }

      .tools {
        position: relative;
        z-index: 1;
        padding: clamp(70px, 9vw, 110px) max(20px, 4vw);
        max-width: 1200px;
        margin: 0 auto;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .tool-card {
        background: #ffffff;
        border: 1px solid #e7e7e3;
        border-radius: 14px;
        padding: 26px 24px;
        transition: all 0.2s ease;
        position: relative;
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .tool-card:hover {
        border-color: #d2d2cc;
        transform: translateY(-2px);
        box-shadow: 0 12px 30px -16px rgba(0,0,0,0.1);
      }
      .tool-card-link { cursor: pointer; }
      .tool-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .tool-icon {
        width: 40px; height: 40px;
        background: #0a0a09;
        color: #fafaf9;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Instrument Serif', serif;
        font-style: italic;
        font-size: 22px;
        line-height: 1;
      }
      .tool-icon.accent { background: #1a8853; }
      .tool-icon.warm { background: #d97757; }
      .tool-status {
        font-family: 'Geist Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 4px 9px;
        border-radius: 100px;
      }
      .stat-soon { background: #e3f1e9; color: #136a40; }
      .stat-build { background: #f3f3f1; color: #6e6e69; }
      .stat-live { background: #fff5e6; color: #9c5a00; }
      .tool-name {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: 19px;
        letter-spacing: -0.02em;
        margin-bottom: 4px;
      }
      .tool-region {
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #6e6e69;
        margin-bottom: 14px;
      }
      .tool-desc {
        font-size: 14px;
        line-height: 1.55;
        color: #2c2c2a;
        margin-bottom: 18px;
      }
      .tool-features {
        list-style: none;
        font-size: 12.5px;
        color: #6e6e69;
        padding-top: 14px;
        border-top: 1px solid #e7e7e3;
      }
      .tool-features li {
        padding: 4px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tool-features li::before {
        content: "→";
        color: #1a8853;
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
      }

      .cta {
        position: relative;
        z-index: 1;
        padding: clamp(50px, 7vw, 90px) max(20px, 4vw);
        max-width: 1200px;
        margin: 0 auto;
      }
      .cta-card {
        background: #ffffff;
        border: 1px solid #e7e7e3;
        border-radius: 20px;
        padding: clamp(36px, 5vw, 60px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 36px;
        flex-wrap: wrap;
        position: relative;
        overflow: hidden;
      }
      .cta-card::before {
        content: "";
        position: absolute;
        top: -100px; right: -50px;
        width: 300px; height: 300px;
        background: radial-gradient(circle, #e3f1e9, transparent 60%);
        opacity: 0.8;
        pointer-events: none;
      }
      .cta-text {
        font-family: 'Geist', sans-serif;
        font-weight: 600;
        font-size: clamp(22px, 3.2vw, 36px);
        line-height: 1.05;
        letter-spacing: -0.03em;
        max-width: 22ch;
        position: relative;
      }
      .cta-text em {
        font-family: 'Instrument Serif', serif;
        font-style: italic;
        font-weight: 400;
        color: #1a8853;
      }
      .cta-meta {
        font-family: 'Geist Mono', monospace;
        font-size: 11px;
        color: #6e6e69;
        margin-top: 12px;
        letter-spacing: 0.04em;
      }
      .cta-placeholder {
        font-family: 'Geist Mono', monospace;
        font-size: 12px;
        color: #6e6e69;
        padding: 10px 18px;
        background: #f3f3f1;
        border-radius: 8px;
      }

      @media (max-width: 860px) {
        .dash-content { grid-template-columns: 1fr; }
        .dash-side { display: none; }
        .dash-stats { grid-template-columns: 1fr; }
        .principles-grid { grid-template-columns: 1fr; }
        .tools-grid { grid-template-columns: 1fr; }
        .about-inner { grid-template-columns: 1fr; gap: 18px; }
        .cta-card { flex-direction: column; align-items: flex-start; }
      }
    `}</style>
  );
}
