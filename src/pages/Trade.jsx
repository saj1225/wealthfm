import { useEffect } from "react";
import Header from "../shared/Header.jsx";
import Footer from "../shared/Footer.jsx";
import ComingSoon from "../shared/ComingSoon.jsx";

export default function Trade() {
  useEffect(() => {
    document.title = "Trade Workbench | WealthFM";
  }, []);

  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1 }}>
        <ComingSoon
          letter="T"
          name="Trade Workbench"
          region="Global · 🌐"
          tagline="A technical analysis and risk workbench."
          desc="Position sizing, R-multiple analytics and setup tracking — for traders who treat it as craft. No tips. No alerts. Just the mechanics."
          iconColor="warm"
        />
      </div>
      <Footer />
    </div>
  );
}
