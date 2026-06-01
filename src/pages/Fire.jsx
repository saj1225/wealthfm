import Header from "../shared/Header.jsx";
import Footer from "../shared/Footer.jsx";
import ComingSoon from "../shared/ComingSoon.jsx";

export default function Fire() {
  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1 }}>
        <ComingSoon
          letter="F"
          name="FIRE Desk"
          region="UK · 🇬🇧"
          tagline="A serious financial-independence planner."
          desc="ISA & SIPP modelling, coasting phase, Coast / Lean / Fat FIRE mechanics, property and mortgage integration. Built carefully for UK tax wrappers."
        />
      </div>
      <Footer />
    </div>
  );
}
