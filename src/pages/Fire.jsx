import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import Header from "../shared/Header.jsx";
import Footer from "../shared/Footer.jsx";

/* ─── Global styles (injected once) ──────────────────────────────────── */
if (!window.__wfmFireStyles) {
  window.__wfmFireStyles = true;
  const _sty = document.createElement("style");
  _sty.textContent = `
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:#07111e}
    ::-webkit-scrollbar-thumb{background:#1e3350;border-radius:2px}
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=number]{-moz-appearance:textfield}
    @keyframes fireUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes firePulse{0%,100%{opacity:.4}50%{opacity:1}}
    @keyframes fireBlink{0%,100%{opacity:1}50%{opacity:.3}}
    .fire-kc{transition:transform .18s,box-shadow .18s}
    .fire-kc:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,0,0,.55)!important}
    .fire-tbtn{transition:color .15s,border-color .15s}
    .fire-srow{transition:background .12s}
    .fire-srow:hover{background:#0c1f35!important}
  `;
  document.head.appendChild(_sty);
}

/* ─── WealthFM Palette ────────────────────────────────────────────────── */
const C = {
  bg:    "#07111e",
  surf:  "#0d1a2b",
  card:  "#0c1828",
  bdr:   "#152538",
  bdr2:  "#1e3350",
  gold:  "#1a8853",   // WealthFM green — primary accent
  gold2: "#22a867",   // lighter green
  teal:  "#2db89e",   // coasting phase
  blue:  "#3d8bcd",   // pension
  red:   "#c94a3a",
  green: "#38b87a",   // FIRE achieved / success
  amber: "#d4893a",   // property / warnings
  violet:"#8b6fcb",   // accumulation phase
  mut:   "#3a5060",
  dim:   "#243c50",
  txt:   "#ccdbe8",
  sub:   "#5a7485",
  wht:   "#e8f2fa",
};

/* ─── Finance helpers ─────────────────────────────────────────────────── */
const fGBP = v => {
  if (v == null || isNaN(v)) return "£0";
  const a = Math.abs(v);
  if (a >= 1e6) return `£${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `£${(v / 1e3).toFixed(1)}K`;
  return `£${Math.round(v).toLocaleString()}`;
};
const fPct = v => `${(v ?? 0).toFixed(1)}%`;
const calcTax = s => {
  if (s <= 12570) return 0;
  let t = Math.min(s - 12570, 37700) * .2;
  if (s > 50270)  t += Math.min(s - 50270, 74870) * .4;
  if (s > 125140) t += (s - 125140) * .45;
  return t;
};
const calcNI = s => {
  if (s <= 12570) return 0;
  let n = Math.min(s - 12570, 37700) * .08;
  if (s > 50270)  n += (s - 50270) * .02;
  return n;
};
const mtgPmt = (p, r, yrs) => {
  if (!p || !r || !yrs) return 0;
  const rm = r / 12, n = yrs * 12;
  return rm === 0 ? p / n : p * rm * Math.pow(1 + rm, n) / (Math.pow(1 + rm, n) - 1);
};

/* ─── Core projection engine ──────────────────────────────────────────── */
function project(inp) {
  const {
    lumpSum, monthlyPension, years, occasionalContrib,
    propertyValue, mortgageRemaining, mortgageRate, mortgageYears,
    isaBalance, isaMonthly, etfAllocation, salary, workingYears,
  } = inp;
  const wYrs   = workingYears ?? years;
  const annPen = monthlyPension * 12;
  const annISA = Math.min(isaMonthly * 12, 20000);
  const mMtg   = mtgPmt(mortgageRemaining, mortgageRate / 100, mortgageYears || 25);
  const fireTarget = (salary || 40000) * .7 / .04;
  let pen = lumpSum, prop = propertyValue, mtg = mortgageRemaining,
      isa = isaBalance, etf = etfAllocation;
  const data = [];
  for (let y = 0; y <= years; y++) {
    const working = y < wYrs;
    const equity  = Math.max(0, prop - mtg);
    const nw      = pen + equity + isa + etf;
    data.push({
      year: y,
      pension:      Math.round(pen),
      property:     Math.round(prop),
      mortgage:     Math.round(mtg),
      equity:       Math.round(equity),
      isa:          Math.round(isa),
      etf:          Math.round(etf),
      netWorth:     Math.round(nw),
      fireTarget:   Math.round(fireTarget),
      fireProgress: Math.round(Math.min(nw / fireTarget * 100, 100) * 10) / 10,
      passiveIncome:Math.round(nw * .04),
      phase:        working ? "ACCUMULATION" : "COASTING",
      annualContrib: working ? (annPen + annISA + (y > 0 ? occasionalContrib : 0)) : 0,
    });
    const contribPen = working ? annPen + (y > 0 ? occasionalContrib : 0) : 0;
    const contribISA = working ? annISA : 0;
    pen  = (pen  + contribPen) * 1.07;
    prop = prop  * 1.045;
    mtg  = Math.max(0, mtg - (mMtg * 12 - mtg * (mortgageRate / 100)));
    isa  = (isa  + contribISA) * 1.08;
    etf  = etf   * 1.10;
  }
  return { data, fireTarget, mMtg };
}

/* ─── Recommendations ─────────────────────────────────────────────────── */
function buildRecs(inp, data, mMtg) {
  const recs = [];
  const tYrs = inp.years;
  const wYrs = inp.workingYears ?? tYrs;
  const fireYr = data.find(d => d.fireProgress >= 100);
  const fin    = data[data.length - 1];
  const tr     = inp.salary > 50270 ? .4 : .2;
  const penAnn = inp.monthlyPension * 12;
  const isaGap = 20000 - inp.isaMonthly * 12;
  const earlyRetire = wYrs < tYrs;
  if (fireYr) recs.push({ p:"INSIGHT", col:C.green, icon:"◈",
    title:`FIRE Achievable — Year ${fireYr.year}`,
    body:`You reach financial independence at Year ${fireYr.year} (${new Date().getFullYear()+fireYr.year}) with ${fGBP(fireYr.netWorth)} net worth. 4% SWR yields ${fGBP(fireYr.passiveIncome)}/yr — ${fPct(fireYr.passiveIncome/(inp.salary||1)*100)} of current gross.`,
    impact:`${fGBP(fireYr.passiveIncome)}/yr passive income` });
  else recs.push({ p:"ACTION", col:C.amber, icon:"◈",
    title:"FIRE Target Not Met Within Horizon",
    body:`Trajectory reaches ${fPct(fin.fireProgress)} in ${tYrs} years. ${earlyRetire?`You stop contributing at Year ${wYrs} — extending by even 1–2 years significantly accelerates the coasting phase via compounding.`:"Adding £200/mo pension or extending by 3 years closes the gap materially."}`,
    impact:"Increase contributions or extend working years" });
  if (earlyRetire) recs.push({ p:"PLANNING", col:C.violet, icon:"◆",
    title:`Coast FIRE — Stopping at Year ${wYrs}`,
    body:`After Year ${wYrs} your pot of ${fGBP((data[Math.min(wYrs, data.length-1)]||{}).netWorth||0)} coasts via compounding alone. No further contributions needed. Ensure you have a drawdown bridge between Year ${wYrs} and pension access age (57 from 2028).`,
    impact:`${fGBP((data[Math.min(wYrs, data.length-1)]||{}).netWorth||0)} coasting pot at retirement` });
  if (penAnn < 30000) recs.push({ p:"CRITICAL", col:C.red, icon:"◆",
    title:"Pension Allowance Underutilised",
    body:`Using ${fPct(penAnn/60000*100)} of £60K allowance. At ${tr===.4?"40%":"20%"} relief, each £1 contributed costs ${tr===.4?"60p":"80p"}. ${earlyRetire?`With only ${wYrs} working years, maximising now is even more critical.`:"The single highest-yield tax lever in the UK wealth stack."}`,
    impact:`Save up to ${fGBP((60000-penAnn)*tr)}/yr in tax` });
  if (isaGap > 2500) recs.push({ p:"HIGH", col:C.gold, icon:"◇",
    title:"ISA Allowance Gap",
    body:`${fGBP(isaGap)}/yr unused. All growth and withdrawals are tax-free. At 8% p.a. over ${wYrs} working years, full utilisation adds ${fGBP(isaGap*Math.pow(1.08,wYrs))} with zero CGT.`,
    impact:`+${fGBP(isaGap*Math.pow(1.08,tYrs))} tax-free` });
  if (inp.mortgageRate > 4.5) recs.push({ p:"HIGH", col:C.amber, icon:"◇",
    title:"Elevated Mortgage Rate",
    body:`At ${inp.mortgageRate}%, monthly cost is ${fGBP(mMtg)}. ${earlyRetire?`Clearing the mortgage before Year ${wYrs} removes a fixed obligation from your coasting phase.`:"Overpayments (up to 10%/yr penalty-free) deliver a risk-free return equal to your rate."}`,
    impact:`${fGBP(inp.mortgageRemaining*inp.mortgageRate/100)}/yr interest cost` });
  if (inp.salary > 50270) recs.push({ p:"MEDIUM", col:C.teal, icon:"◻",
    title:"Salary Sacrifice — Maximise While Working",
    body:`As a higher-rate taxpayer, salary sacrifice saves 40% IT + 2% NI. ${earlyRetire?`With ${wYrs} years of earnings remaining, front-loading creates a larger compounding base for the coasting phase.`:"Every £1,000 sacrificed costs ~£580 net."}`,
    impact:`~${fGBP((inp.salary-50270)*.42*.2)} NI saved/yr` });
  recs.push({ p:"NOTE", col:C.mut, icon:"○",
    title:"Property Equity Strategy",
    body:`Projected equity of ${fGBP(fin.equity)} by Year ${tYrs}. ${earlyRetire?"Consider using equity release or downsizing to bridge income in the early coasting phase.":"Options: offset mortgage, equity release in drawdown, or BTL conversion for rental yield."}`,
    impact:`${fGBP((fin.property||0)-(inp.propertyValue||0))} projected appreciation` });
  return recs;
}

/* ─── Smart number field ──────────────────────────────────────────────── */
function Field({ label, value, onChange, pre = "£", suf, hint, decimals = 0, highlight }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));
  const ref = useRef();
  useEffect(() => { if (!focused) setRaw(value === 0 ? "" : String(value)); }, [value, focused]);
  const onCh = e => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      setRaw(v);
      const p = parseFloat(v);
      onChange(isNaN(p) ? 0 : p);
    }
  };
  const onFoc = () => { setFocused(true); if (raw === "0") setRaw(""); };
  const onBlur = () => {
    setFocused(false);
    const p = parseFloat(raw);
    if (isNaN(p) || raw === "") { setRaw(""); onChange(0); }
    else { const r = decimals > 0 ? parseFloat(p.toFixed(decimals)) : Math.round(p); setRaw(String(r)); onChange(r); }
  };
  return (
    <div className="fire-srow" onClick={() => ref.current?.focus()} style={{
      padding: "8px 10px", borderRadius: 5, cursor: "text", marginBottom: 2,
      border: `1px solid ${focused ? C.bdr2 : highlight ? highlight + "44" : "transparent"}`,
      background: focused ? "#0c1f35" : highlight ? highlight + "08" : "transparent",
    }}>
      <label style={{ display: "block", fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: highlight || C.mut, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {pre && <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, color: focused ? C.gold : highlight || C.mut, flexShrink: 0 }}>{pre}</span>}
        <input ref={ref} type="text" inputMode="decimal" value={raw} placeholder="0"
          onChange={onCh} onFocus={onFoc} onBlur={onBlur}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: focused ? C.wht : C.txt, padding: 0 }} />
        {suf && <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 11, color: highlight || C.mut, flexShrink: 0 }}>{suf}</span>}
      </div>
      {hint && <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim, marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

/* ─── Year Stepper ────────────────────────────────────────────────────── */
function YearStepper({ label, value, onChange, color, hint, min = 1, max = 99 }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const ref = useRef();
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  const clamp = v => Math.max(min, Math.min(max, v));
  const step = delta => onChange(clamp(value + delta));
  const onCh = e => {
    const v = e.target.value;
    if (v === "" || /^\d*$/.test(v)) { setRaw(v); if (v !== "") onChange(clamp(parseInt(v, 10))); }
  };
  const onBlur = () => {
    setFocused(false);
    const p = parseInt(raw, 10);
    if (isNaN(p)) { setRaw(String(value)); } else { const c = clamp(p); setRaw(String(c)); onChange(c); }
  };
  return (
    <div style={{ background: `${color}0d`, border: `1px solid ${color}3a`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10.5, color, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim }}>{hint}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        <button onClick={() => step(-1)} style={{ width: 36, flexShrink: 0, border: `1px solid ${color}44`, background: `${color}14`, color, borderRadius: 6, fontSize: 18, fontFamily: "'Geist', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, userSelect: "none" }}>−</button>
        <div onClick={() => ref.current?.focus()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: focused ? "#0d1f35" : "transparent", border: `1px solid ${focused ? color + "88" : "transparent"}`, borderRadius: 6, cursor: "text", minWidth: 0 }}>
          <input ref={ref} type="text" inputMode="numeric" value={raw} onFocus={() => setFocused(true)} onChange={onCh} onBlur={onBlur}
            style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", outline: "none", fontFamily: "'Geist Mono', monospace", fontSize: 24, fontWeight: 400, color: C.wht, padding: "4px 0" }} />
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 11, color: C.sub, flexShrink: 0 }}>yrs</span>
        </div>
        <button onClick={() => step(1)} style={{ width: 36, flexShrink: 0, border: `1px solid ${color}44`, background: `${color}14`, color, borderRadius: 6, fontSize: 18, fontFamily: "'Geist', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, userSelect: "none" }}>+</button>
      </div>
    </div>
  );
}

/* ─── Dual-thumb Phase Toggle ─────────────────────────────────────────── */
function PhaseToggle({ workingYears, coastingYears, onChangeWorking, onChangeCoasting }) {
  const totalYears  = Math.max(workingYears + coastingYears, 1);
  const pctA        = (workingYears / totalYears) * 100;
  const activeThumb = useRef(null);
  const barRef      = useRef();
  const calcYearsFromX = clientX => {
    const rect  = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.max(1, Math.round(ratio * totalYears));
  };
  useEffect(() => {
    const onMove = e => {
      if (!activeThumb.current || !barRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const yrs = calcYearsFromX(clientX);
      if (activeThumb.current === "A") onChangeWorking(Math.max(1, Math.min(yrs, workingYears + coastingYears - 1)));
      else onChangeCoasting(Math.max(1, Math.max(yrs, workingYears + 1) - workingYears));
    };
    const onUp = () => { activeThumb.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [workingYears, coastingYears, onChangeWorking, onChangeCoasting]);
  const onTrackDown = e => {
    if (!barRef.current) return;
    e.preventDefault();
    const clientX  = e.touches ? e.touches[0].clientX : e.clientX;
    const rect     = barRef.current.getBoundingClientRect();
    const clickPct = (clientX - rect.left) / rect.width * 100;
    activeThumb.current = Math.abs(clickPct - pctA) <= Math.abs(clickPct - 100) ? "A" : "B";
    const yrs = calcYearsFromX(clientX);
    if (activeThumb.current === "A") onChangeWorking(Math.max(1, Math.min(yrs, workingYears + coastingYears - 1)));
    else onChangeCoasting(Math.max(1, yrs - workingYears));
  };
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.bdr2}`, borderRadius: 6, padding: "12px 12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.mut, textTransform: "uppercase", letterSpacing: "0.12em" }}>Timeline</span>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: C.sub }}>
          <span style={{ color: C.violet }}>Yr 0–{workingYears}</span>
          <span style={{ color: C.dim }}> · </span>
          <span style={{ color: C.teal }}>Yr {workingYears}–{totalYears}</span>
        </span>
      </div>
      <div ref={barRef} onMouseDown={onTrackDown} onTouchStart={onTrackDown}
        style={{ position: "relative", height: 36, cursor: "ew-resize", userSelect: "none", touchAction: "none" }}>
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, right: 0, height: 5, background: C.dim, borderRadius: 3 }} />
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, width: `${pctA}%`, height: 5, background: `linear-gradient(90deg,${C.violet}66,${C.violet})`, borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${pctA}%`, right: 0, height: 5, background: `linear-gradient(90deg,${C.teal}55,${C.teal}88)`, borderRadius: "0 3px 3px 0" }} />
        <div onMouseDown={e => { e.stopPropagation(); activeThumb.current = "A"; }} onTouchStart={e => { e.stopPropagation(); activeThumb.current = "A"; }}
          style={{ position: "absolute", top: "50%", left: `${pctA}%`, transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: C.violet, border: `2px solid ${C.wht}44`, boxShadow: `0 0 10px ${C.violet}99`, cursor: "grab", zIndex: 3 }} />
        <div onMouseDown={e => { e.stopPropagation(); activeThumb.current = "B"; }} onTouchStart={e => { e.stopPropagation(); activeThumb.current = "B"; }}
          style={{ position: "absolute", top: "50%", right: 0, transform: "translate(50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: C.teal, border: `2px solid ${C.wht}44`, boxShadow: `0 0 10px ${C.teal}99`, cursor: "ew-resize", zIndex: 3 }} />
        <span style={{ position: "absolute", left: 0, top: "100%", fontFamily: "'Geist', sans-serif", fontSize: 8, color: C.dim, marginTop: 5 }}>Yr 0</span>
        <span style={{ position: "absolute", left: `${pctA}%`, top: "100%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: "'Geist', sans-serif", fontSize: 8, color: C.violet, marginTop: 5, pointerEvents: "none" }}>▲{workingYears}yr</span>
        <span style={{ position: "absolute", right: 0, top: "100%", fontFamily: "'Geist', sans-serif", fontSize: 8, color: C.teal, marginTop: 5, transform: "translateX(50%)", whiteSpace: "nowrap" }}>▲{totalYears}yr</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
        <div style={{ flex: 1, background: `${C.violet}10`, border: `1px solid ${C.violet}33`, borderRadius: 4, padding: "7px 10px" }}>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 8, color: C.violet, marginBottom: 3, letterSpacing: "0.1em" }}>◆ ACCUMULATION</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.wht }}>{workingYears} <span style={{ fontSize: 11, color: C.sub, fontFamily: "'Geist', sans-serif" }}>yrs</span></p>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.sub, marginTop: 2 }}>Yr 0 → {workingYears} · contributions on</p>
        </div>
        <div style={{ flex: 1, background: `${C.teal}0c`, border: `1px solid ${C.teal}33`, borderRadius: 4, padding: "7px 10px" }}>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 8, color: C.teal, marginBottom: 3, letterSpacing: "0.1em" }}>◆ COASTING</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.wht }}>{coastingYears} <span style={{ fontSize: 11, color: C.sub, fontFamily: "'Geist', sans-serif" }}>yrs</span></p>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.sub, marginTop: 2 }}>Yr {workingYears} → {totalYears} · compound only</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared UI atoms ─────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const phase = payload[0]?.payload?.phase;
  return (
    <div style={{ background: "#07111e", border: `1px solid ${C.bdr2}`, borderRadius: 4, padding: "10px 14px", fontFamily: "'Geist', sans-serif", fontSize: 11, boxShadow: "0 8px 32px rgba(0,0,0,.7)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 9.5, color: C.mut, letterSpacing: "0.1em" }}>YR {label}</span>
        {phase && <span style={{ fontSize: 8.5, color: phase === "ACCUMULATION" ? C.violet : C.teal, background: phase === "ACCUMULATION" ? `${C.violet}18` : `${C.teal}18`, padding: "1px 6px", borderRadius: 2 }}>{phase}</span>}
      </div>
      {payload.map((p, i) => p.value > 0 && (
        <p key={i} style={{ color: p.color, margin: "3px 0" }}><span style={{ color: C.sub }}>{p.name}: </span>{fGBP(p.value)}</p>
      ))}
    </div>
  );
};

const KPI = ({ label, value, sub, col = C.gold, glow }) => (
  <div className="fire-kc" style={{ flex: "1 1 148px", minWidth: 138, background: `linear-gradient(150deg,${C.card} 0%,#091522 100%)`, border: `1px solid ${C.bdr2}`, borderTop: `2px solid ${col}`, borderRadius: 4, padding: "16px 18px", boxShadow: glow ? `0 0 28px ${col}1a` : "0 2px 10px rgba(0,0,0,.4)" }}>
  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: C.mut, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>{label}</p>
  <p style={{ fontFamily: "Georgia, serif", fontSize: 25, color: col, lineHeight: 1 }}>{value}</p>
  {sub && <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: C.sub, marginTop: 6 }}>{sub}</p>}
</div>
);

const SH = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
    <div style={{ width: 3, height: 13, background: C.gold, borderRadius: 1, marginRight: 10 }} />
    <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: C.mut, textTransform: "uppercase", letterSpacing: "0.14em" }}>{children}</p>
  </div>
);

const Meter = ({ pct }) => {
  const col = pct >= 100 ? C.green : pct >= 60 ? C.gold : C.red;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 4, padding: "15px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9.5, color: C.mut, textTransform: "uppercase", letterSpacing: "0.14em" }}>FIRE Progress Index</span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: col }}>{fPct(pct)}</span>
      </div>
      <div style={{ position: "relative", height: 2, background: C.dim, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg,${col}88,${col})`, borderRadius: 2, transition: "width 1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 6px ${col}66` }} />
        {[25, 50, 75].map(m => <div key={m} style={{ position: "absolute", left: `${m}%`, top: -4, width: 1, height: 10, background: C.dim }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim }}>0%</span>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim }}>FIRE 100%</span>
      </div>
    </div>
  );
};

const HR = () => <div style={{ height: 1, background: C.bdr, margin: "12px 0" }} />;
const SB = ({ label }) => (
  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.gold, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8, paddingLeft: 6, display: "flex", alignItems: "center", gap: 5 }}>
    <span style={{ opacity: .5 }}>◆</span> {label}
  </p>
);
const xT = { fontFamily: "'Geist', sans-serif", fontSize: 9, fill: C.dim };
const yT = { fontFamily: "'Geist', sans-serif", fontSize: 9, fill: C.dim };
const PhaseLegend = ({ workingYears }) => (
  <div style={{ display: "flex", gap: 14, marginBottom: 12, alignItems: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 10, height: 3, background: C.violet, borderRadius: 2 }} />
      <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.violet }}>Accumulation (Yr 0–{workingYears})</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 10, height: 3, background: C.teal, borderRadius: 2 }} />
      <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.teal }}>Coasting (Yr {workingYears}+)</span>
    </div>
  </div>
);

/* ─── Main component ──────────────────────────────────────────────────── */
export default function Fire() {
  useEffect(() => { document.title = "FIRE Planner | WealthFM"; }, []);

  const [inp, setInp] = useState({
    lumpSum: 0, monthlyPension: 0, occasionalContrib: 0,
    propertyValue: 0, mortgageRemaining: 0, mortgageRate: 0, mortgageYears: 0,
    isaBalance: 0, isaMonthly: 0, etfAllocation: 0, salary: 0,
    workingYears: 10, coastingYears: 10,
  });
  const totalYears = inp.workingYears + inp.coastingYears;
  const [tab, setTab]   = useState("overview");
  const [res, setRes]   = useState({ data: [], fireTarget: 0, mMtg: 0 });
  const [recs, setRecs] = useState([]);
  const [tick, setTick] = useState(0);
  const set = k => v => setInp(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const r = project({ ...inp, years: totalYears });
    setRes(r);
    setRecs(buildRecs({ ...inp, years: totalYears }, r.data, r.mMtg));
    setTick(t => t + 1);
  }, [inp, totalYears]);

  const { data, fireTarget, mMtg } = res;
  const d0   = data[0] || {};
  const dn   = data[data.length - 1] || {};
  const dStop = data.find(d => d.year === inp.workingYears) || data[data.length - 1] || {};
  const fireYr = data.find(d => d.fireProgress >= 100);
  const tax = calcTax(inp.salary), ni = calcNI(inp.salary), th = inp.salary - tax - ni;
  const yr  = new Date().getFullYear();
  const earlyRetire = inp.workingYears < totalYears;
  const A = { animation: "fireUp .4s ease forwards" };
  const TABS = [
    { id: "overview",   l: "Overview" },
    { id: "trajectory", l: "Trajectory" },
    { id: "phases",     l: "Phase Analysis" },
    { id: "mortgage",   l: "Mortgage" },
    { id: "tax",        l: "Tax Efficiency" },
    { id: "recs",       l: "Recommendations" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, fontFamily: "'Geist', sans-serif" }}>
      {/* WealthFM shared nav */}
      <Header />

      {/* Status strip */}
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.bdr}`, padding: "0 28px", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.mut, letterSpacing: "0.12em", textTransform: "uppercase" }}>FIRE Planner</span>
          <div style={{ width: 1, height: 14, background: C.bdr2 }} />
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim, letterSpacing: "0.08em" }}>UK Wealth Planning Engine · {yr}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {earlyRetire && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.violet}10`, border: `1px solid ${C.violet}44`, borderRadius: 3, padding: "4px 12px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.violet, animation: "fireBlink 2s infinite" }} />
              <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: C.violet }}>COAST FIRE · Stop Yr {inp.workingYears}</span>
            </div>
          )}
          {fireYr
            ? <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#081910", border: `1px solid ${C.green}44`, borderRadius: 3, padding: "4px 12px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "firePulse 2s infinite" }} />
                <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: C.green }}>FIRE · Yr {fireYr.year} · {yr + fireYr.year}</span>
              </div>
            : <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#191000", border: `1px solid ${C.amber}44`, borderRadius: 3, padding: "4px 12px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.amber }} />
                <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: C.amber }}>EXTENDING HORIZON</span>
              </div>
          }
          <div style={{ background: C.card, border: `1px solid ${C.bdr2}`, borderRadius: 3, padding: "4px 12px" }}>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: C.sub }}>NW · <span style={{ color: C.gold }}>{fGBP(dn.netWorth)}</span></span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
        {/* Sidebar */}
        <aside style={{ width: 254, background: C.surf, borderRight: `1px solid ${C.bdr}`, padding: "14px 10px", flexShrink: 0, position: "sticky", top: 100, height: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={{ marginBottom: 12 }}>
            <SB label="Retirement Timeline" />
            <PhaseToggle
              workingYears={inp.workingYears}
              coastingYears={inp.coastingYears}
              onChangeWorking={v  => setInp(p => ({ ...p, workingYears: Math.max(1, v) }))}
              onChangeCoasting={v => setInp(p => ({ ...p, coastingYears: Math.max(1, v) }))}
            />
            <div style={{ marginTop: 10 }}>
              <YearStepper label="Working Years"  value={inp.workingYears}  onChange={v => setInp(p => ({ ...p, workingYears: Math.max(1, v) }))}  color={C.violet} hint="Contribute until" />
              <YearStepper label="Coasting Years" value={inp.coastingYears} onChange={v => setInp(p => ({ ...p, coastingYears: Math.max(1, v) }))} color={C.teal}   hint="Coast after work" />
            </div>
            <div style={{ marginTop: 6, padding: "5px 10px", background: `${C.gold}08`, border: `1px solid ${C.gold}22`, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.mut }}>TOTAL HORIZON</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.gold }}>{totalYears} yrs <span style={{ fontSize: 11, color: C.sub, fontFamily: "'Geist', sans-serif" }}>· {yr + totalYears}</span></span>
            </div>
          </div>
          <HR />
          <SB label="Income & Pension" />
          <Field label="Gross Annual Salary"          value={inp.salary}            onChange={set("salary")}            hint="Before tax" />
          <Field label="Lump Sum / Existing Pot"      value={inp.lumpSum}           onChange={set("lumpSum")}           hint="Current pension / savings" />
          <Field label="Monthly Pension Contribution" value={inp.monthlyPension}    onChange={set("monthlyPension")}    hint="Incl. employer (while working)" />
          <Field label="Occasional Contribution /yr"  value={inp.occasionalContrib} onChange={set("occasionalContrib")} hint="Bonus / windfall (while working)" />
          <HR />
          <SB label="Property & Mortgage" />
          <Field label="Property Value"     value={inp.propertyValue}     onChange={set("propertyValue")}     hint="Current market value" />
          <Field label="Mortgage Remaining" value={inp.mortgageRemaining} onChange={set("mortgageRemaining")} hint="Outstanding balance" />
          <Field label="Mortgage Rate"      value={inp.mortgageRate}      onChange={set("mortgageRate")} pre="" suf="%" decimals={2} hint="Annual interest rate" />
          <Field label="Remaining Term"     value={inp.mortgageYears}     onChange={set("mortgageYears")} pre="" suf="yrs" hint="Years left on mortgage" />
          <HR />
          <SB label="Investments" />
          <Field label="ISA Balance"                      value={inp.isaBalance}    onChange={set("isaBalance")}    hint="Stocks & Shares ISA" />
          <Field label="ISA Monthly"                      value={inp.isaMonthly}    onChange={set("isaMonthly")}    hint="Max £1,666/mo (while working)" />
          <Field label="GIA (General Investment Account)" value={inp.etfAllocation} onChange={set("etfAllocation")} hint="ETFs / shares outside ISA wrapper" />
          <HR />
          <div style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 4, padding: "10px 12px" }}>
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.mut, marginBottom: 8, letterSpacing: "0.08em" }}>MODEL ASSUMPTIONS</p>
            {[["Pension","7.0% p.a."],["Property","4.5% p.a."],["ISA","8.0% p.a."],["GIA","10.0% p.a."],["Inflation","2.5% p.a."],["SWR","4.0%"]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.dim }}>{k}</span>
                <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: C.sub }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "18px 22px", minWidth: 0 }}>
          {/* KPIs */}
          <div key={`k${tick}`} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, ...A }}>
            <KPI label="Net Worth Today"              value={fGBP(d0.netWorth)}      sub={`Target ${fGBP(fireTarget)}`} col={C.gold}   glow />
            <KPI label={`Net Worth Yr ${totalYears}`} value={fGBP(dn.netWorth)}      sub="End of horizon"              col={C.blue} />
            <KPI label="FIRE Number"                  value={fGBP(fireTarget)}        sub="70% salary ÷ 4% SWR"         col={C.gold2} />
            <KPI label="Pot at Stop Work"             value={fGBP(dStop.netWorth)}    sub={`Pension ${fGBP(dStop.pension)} + Eq ${fGBP(dStop.equity)} + ISA ${fGBP(dStop.isa)} + GIA ${fGBP(dStop.etf)}`} col={C.violet} />
            <KPI label="Annual Passive"               value={fGBP(dn.passiveIncome)}  sub={`Yr ${totalYears} drawdown`}  col={C.green} />
            <KPI label="Property Equity"              value={fGBP(dn.equity)}         sub={`Yr ${totalYears} projected`} col={C.amber} />
          </div>
          <Meter pct={dn.fireProgress || 0} />

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.bdr}`, marginBottom: 18, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} className="fire-tbtn" onClick={() => setTab(t.id)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "8px 15px",
                fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: "0.05em",
                color: tab === t.id ? C.gold : C.mut,
                borderBottom: `1px solid ${tab === t.id ? C.gold : "transparent"}`, marginBottom: -1,
              }}>{t.l}</button>
            ))}
          </div>

          {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div key={`ov${tick}`} style={A}>
              <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 4, padding: "18px", marginBottom: 14 }}>
                <SH>Portfolio Growth — All Asset Classes</SH>
                <PhaseLegend workingYears={inp.workingYears} />
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data} margin={{ top: 4, right: 6, left: 6, bottom: 4 }}>
                    <defs>
                      {[[C.blue,"pen"],[C.amber,"prop"],[C.green,"isa"],[C.teal,"etf"]].map(([c,k]) => (
                        <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor={c} stopOpacity={.22}/><stop offset="90%" stopColor={c} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke={C.bdr} />
                    <XAxis dataKey="year" tick={xT} tickFormatter={y => `YR${y}`} />
                    <YAxis tickFormatter={v => fGBP(v)} tick={yT} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: C.sub }} />
                    {earlyRetire && <ReferenceArea x1={0} x2={inp.workingYears} fill={C.violet} fillOpacity={0.04} />}
                    <ReferenceLine x={inp.workingYears} stroke={C.violet} strokeDasharray="3 3" label={{ value: "Stop Work", fill: C.violet, fontSize: 9, fontFamily: "'Geist', sans-serif", position: "insideTopRight" }} />
                    {fireYr && <ReferenceLine x={fireYr.year} stroke={C.green} strokeDasharray="3 3" label={{ value: "FIRE", fill: C.green, fontSize: 9, fontFamily: "'Geist', sans-serif" }} />}
                    <Area type="monotone" dataKey="pension" name="Pension" stroke={C.blue}  fill="url(#gpen)"  strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="equity"  name="Equity"  stroke={C.amber} fill="url(#gprop)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="isa"     name="ISA"     stroke={C.green} fill="url(#gisa)"  strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="etf"     name="GIA"     stroke={C.teal}  fill="url(#getf)"  strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { l:"Pension", v:dn.pension, s:inp.lumpSum,      col:C.blue  },
                  { l:"Equity",  v:dn.equity,  s:d0.equity,         col:C.amber },
                  { l:"ISA",     v:dn.isa,     s:inp.isaBalance,    col:C.green },
                  { l:"GIA",     v:dn.etf,     s:inp.etfAllocation, col:C.teal  },
                ].map(a => (
                  <div key={a.l} className="fire-kc" style={{ flex:"1 1 120px", background:C.card, border:`1px solid ${C.bdr}`, borderBottom:`2px solid ${a.col}`, borderRadius:4, padding:"14px 16px" }}>
                    <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.mut, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>{a.l}</p>
                    <p style={{ fontFamily:"Georgia, serif", fontSize:22, color:a.col }}>{fGBP(a.v)}</p>
                    <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9.5, color:C.dim, marginTop:4 }}>
                      {fPct((a.v/(dn.netWorth||1))*100)} of portfolio
                      {a.s > 0 && <span style={{color:C.sub}}> · +{Math.max(0,Math.round((a.v/a.s-1)*100))}%</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TRAJECTORY ════════════════════════════════════════════ */}
          {tab === "trajectory" && (
            <div key={`tr${tick}`} style={A}>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px", marginBottom:14 }}>
                <SH>Net Worth vs FIRE Target</SH>
                <PhaseLegend workingYears={inp.workingYears} />
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={data} margin={{ top:4, right:6, left:6, bottom:4 }}>
                    <defs>
                      <linearGradient id="gnw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor={C.gold} stopOpacity={.28}/><stop offset="90%" stopColor={C.gold} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke={C.bdr} />
                    <XAxis dataKey="year" tick={xT} tickFormatter={y=>`YR${y}`} />
                    <YAxis yAxisId="l" tickFormatter={v=>fGBP(v)} tick={yT} />
                    <YAxis yAxisId="r" orientation="right" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={yT} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontFamily:"'Geist', sans-serif", fontSize:10, color:C.sub }} />
                    {earlyRetire && <ReferenceArea yAxisId="l" x1={0} x2={inp.workingYears} fill={C.violet} fillOpacity={0.04} />}
                    <ReferenceLine yAxisId="l" x={inp.workingYears} stroke={C.violet} strokeDasharray="3 3" label={{ value:"Stop Work", fill:C.violet, fontSize:9, fontFamily:"'Geist', sans-serif", position:"insideTopRight" }} />
                    {fireYr && <ReferenceLine yAxisId="l" x={fireYr.year} stroke={C.green} strokeDasharray="3 3" />}
                    <Area yAxisId="l" type="monotone" dataKey="netWorth"    name="Net Worth"   stroke={C.gold} fill="url(#gnw)" strokeWidth={2} dot={false} />
                    <Line yAxisId="l" type="monotone" dataKey="fireTarget"  name="FIRE Target" stroke={C.red}  strokeDasharray="4 4" strokeWidth={1.2} dot={false} />
                    <Bar  yAxisId="r"                 dataKey="fireProgress" name="FIRE %"     fill={`${C.gold}14`} stroke={`${C.gold}33`} strokeWidth={.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px", overflowX:"auto" }}>
                <SH>Milestone Table</SH>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>
                    {["Yr","Cal Yr","Phase","Pension","Equity","ISA","GIA","Net Worth","FIRE %","Passive/yr"].map(h=>(
                      <th key={h} style={{ padding:"6px 8px", textAlign:"right", fontFamily:"'Geist', sans-serif", fontSize:9, color:C.mut, letterSpacing:"0.1em", borderBottom:`1px solid ${C.bdr}`, fontWeight:400 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.filter((_,i)=>i%Math.max(1,Math.floor(totalYears/12))===0||i===data.length-1||i===inp.workingYears).slice(0,14).map(d=>(
                      <tr key={d.year} style={{ borderBottom:`1px solid ${C.bdr}`, background:d.year===inp.workingYears?`${C.violet}08`:"transparent" }}>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.mut,   textAlign:"right" }}>{d.year}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.dim,   textAlign:"right" }}>{yr+d.year}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right" }}>
                          <span style={{ fontFamily:"'Geist', sans-serif", fontSize:8.5, color:d.phase==="ACCUMULATION"?C.violet:C.teal, background:d.phase==="ACCUMULATION"?`${C.violet}18`:`${C.teal}18`, padding:"1px 5px", borderRadius:2 }}>{d.phase==="ACCUMULATION"?"ACC":"COAST"}</span>
                        </td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.blue,  textAlign:"right" }}>{fGBP(d.pension)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.amber, textAlign:"right" }}>{fGBP(d.equity)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.green, textAlign:"right" }}>{fGBP(d.isa)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.teal,  textAlign:"right" }}>{fGBP(d.etf)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.wht,   textAlign:"right", fontWeight:500 }}>{fGBP(d.netWorth)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, textAlign:"right", color:d.fireProgress>=100?C.green:d.fireProgress>=60?C.gold:C.red }}>{fPct(d.fireProgress)}</td>
                        <td style={{ padding:"6px 8px", fontFamily:"'Geist', sans-serif", fontSize:10, color:C.gold,  textAlign:"right" }}>{fGBP(d.passiveIncome)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ PHASE ANALYSIS ════════════════════════════════════════ */}
          {tab === "phases" && (
            <div key={`ph${tick}`} style={A}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div style={{ background:C.card, border:`1px solid ${C.violet}33`, borderTop:`2px solid ${C.violet}`, borderRadius:4, padding:"18px" }}>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.violet, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>◆ Accumulation Phase — Yr 0 to {inp.workingYears}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      { l:"Duration",       v:`${inp.workingYears} years`, col:C.violet },
                      { l:"Starting NW",    v:fGBP(d0.netWorth),          col:C.txt },
                      { l:"End Pot",        v:fGBP(dStop.netWorth),       col:C.violet },
                      { l:"Annual Contrib", v:fGBP(inp.monthlyPension*12+Math.min(inp.isaMonthly*12,20000)), col:C.gold },
                      { l:"Total Invested", v:fGBP((inp.monthlyPension*12+Math.min(inp.isaMonthly*12,20000))*inp.workingYears+inp.lumpSum+inp.isaBalance+inp.etfAllocation), col:C.gold },
                      { l:"Take-Home",      v:fGBP(th), col:C.green },
                    ].map(i=>(
                      <div key={i.l} style={{ background:C.surf, borderRadius:3, padding:"10px 12px" }}>
                        <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.mut, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>{i.l}</p>
                        <p style={{ fontFamily:"Georgia, serif", fontSize:18, color:i.col }}>{i.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background:C.card, border:`1px solid ${C.teal}33`, borderTop:`2px solid ${C.teal}`, borderRadius:4, padding:"18px" }}>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.teal, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>◆ Coasting Phase — Yr {inp.workingYears} to {totalYears}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      { l:"Coast Duration", v:`${totalYears-inp.workingYears} years`, col:C.teal },
                      { l:"Coast Start NW", v:fGBP(dStop.netWorth),                  col:C.txt },
                      { l:"End NW",         v:fGBP(dn.netWorth),                     col:C.teal },
                      { l:"NW Growth",      v:fGBP(dn.netWorth-dStop.netWorth),      col:C.green },
                      { l:"FIRE Progress",  v:fPct(dn.fireProgress),                 col:dn.fireProgress>=100?C.green:C.amber },
                      { l:"Annual Passive", v:fGBP(dn.passiveIncome),                col:C.gold },
                    ].map(i=>(
                      <div key={i.l} style={{ background:C.surf, borderRadius:3, padding:"10px 12px" }}>
                        <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.mut, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>{i.l}</p>
                        <p style={{ fontFamily:"Georgia, serif", fontSize:18, color:i.col }}>{i.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px", marginBottom:14 }}>
                <SH>Annual Contribution Cashflow by Phase</SH>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={data} margin={{ top:4, right:6, left:6, bottom:4 }}>
                    <CartesianGrid strokeDasharray="2 5" stroke={C.bdr} />
                    <XAxis dataKey="year" tick={xT} tickFormatter={y=>`YR${y}`} />
                    <YAxis tickFormatter={v=>fGBP(v)} tick={yT} />
                    <Tooltip content={<Tip />} />
                    {earlyRetire && <ReferenceArea x1={0} x2={inp.workingYears} fill={C.violet} fillOpacity={0.05} />}
                    <ReferenceLine x={inp.workingYears} stroke={C.violet} strokeDasharray="3 3" label={{ value:"Stop", fill:C.violet, fontSize:9, fontFamily:"'Geist', sans-serif" }} />
                    <Bar dataKey="annualContrib" name="Annual Contributions" fill={C.violet} fillOpacity={0.7} radius={[2,2,0,0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px" }}>
                <SH>Coast FIRE Strategy Commentary</SH>
                <div style={{ background:C.bg, borderLeft:`2px solid ${C.violet}`, padding:"12px 16px", borderRadius:"0 4px 4px 0", marginBottom:12 }}>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.violet, marginBottom:6, letterSpacing:"0.08em" }}>COAST FIRE MECHANICS</p>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:12, color:C.sub, lineHeight:1.65 }}>
                    Coast FIRE is achieved when your invested assets, compounding at the assumed growth rate with <em>zero further contributions</em>, will reach your FIRE number by your target date.
                    Your coasting pot of <strong style={{color:C.wht}}>{fGBP(dStop.netWorth)}</strong> at Year {inp.workingYears} compounds silently for {totalYears-inp.workingYears} years.
                    {dStop.netWorth>0&&` At 7% blended growth, this becomes ${fGBP(dStop.netWorth*Math.pow(1.07,totalYears-inp.workingYears))} — ${fPct(dStop.netWorth*Math.pow(1.07,totalYears-inp.workingYears)/fireTarget*100)} of your FIRE target.`}
                  </p>
                </div>
                <div style={{ background:C.bg, borderLeft:`2px solid ${C.gold}`, padding:"12px 16px", borderRadius:"0 4px 4px 0" }}>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.gold, marginBottom:6, letterSpacing:"0.08em" }}>PENSION ACCESS BRIDGE</p>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:12, color:C.sub, lineHeight:1.65 }}>
                    UK minimum pension access age rises to <strong style={{color:C.wht}}>57 in 2028</strong>. If you stop work at Year {inp.workingYears} ({yr+inp.workingYears}) and are below 57, plan a bridge strategy using ISA drawdown, dividend income, or property equity.
                    Your ISA at Year {inp.workingYears}: <strong style={{color:C.wht}}>{fGBP(dStop.isa)}</strong> — fully accessible at any age, tax-free.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ MORTGAGE ══════════════════════════════════════════════ */}
          {tab === "mortgage" && (
            <div key={`mg${tick}`} style={A}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
                <KPI label="Monthly Payment"           value={fGBP(mMtg)}                                         sub="Capital + interest"       col={C.amber} />
                <KPI label="Annual Cost"               value={fGBP(mMtg*12)}                                      sub="Total repayment/yr"        col={C.red} />
                <KPI label="Annual Interest"           value={fGBP(inp.mortgageRemaining*inp.mortgageRate/100)}   sub={`At ${inp.mortgageRate}%`} col={C.red} />
                <KPI label="Current LTV"               value={fPct(inp.mortgageRemaining/inp.propertyValue*100)}  sub="Loan-to-value"             col={C.blue} />
                <KPI label="Current Equity"            value={fGBP(d0.equity)}                                    sub="Property minus mortgage"   col={C.green} />
                <KPI label={`Equity Yr ${totalYears}`} value={fGBP(dn.equity)}                                    sub="Projected"                 col={C.gold} glow />
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px", marginBottom:14 }}>
                <SH>Property Value · Mortgage Balance · Net Equity</SH>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data} margin={{ top:4, right:6, left:6, bottom:4 }}>
                    <defs>
                      <linearGradient id="gpv" x1="0" y1="0" x2="0" y2="1"><stop offset="10%" stopColor={C.gold}  stopOpacity={.2}/><stop offset="90%" stopColor={C.gold}  stopOpacity={0}/></linearGradient>
                      <linearGradient id="geq" x1="0" y1="0" x2="0" y2="1"><stop offset="10%" stopColor={C.green} stopOpacity={.28}/><stop offset="90%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke={C.bdr} />
                    <XAxis dataKey="year" tick={xT} tickFormatter={y=>`YR${y}`} />
                    <YAxis tickFormatter={v=>fGBP(v)} tick={yT} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontFamily:"'Geist', sans-serif", fontSize:10, color:C.sub }} />
                    <ReferenceLine x={inp.workingYears} stroke={C.violet} strokeDasharray="3 3" label={{ value:"Stop Work", fill:C.violet, fontSize:9, fontFamily:"'Geist', sans-serif", position:"insideTopRight" }} />
                    <Area type="monotone" dataKey="property" name="Property Value" stroke={C.gold}  fill="url(#gpv)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="equity"   name="Net Equity"     stroke={C.green} fill="url(#geq)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="mortgage" name="Mortgage Bal."  stroke={C.red}   strokeDasharray="3 3" strokeWidth={1.2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px" }}>
                <SH>Strategy Analysis</SH>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                  {[
                    { l:"Total Interest (full term)",     v:fGBP(Math.max(0,mMtg*inp.mortgageYears*12-inp.mortgageRemaining)), col:C.red },
                    { l:"LTV < 60% threshold",            v:fGBP(inp.propertyValue*.6),     col:C.teal },
                    { l:"10% Overpayment Limit/yr",       v:fGBP(inp.mortgageRemaining*.1), col:C.amber },
                    { l:"Est. interest saving (+£500/mo)",v:fGBP(inp.mortgageRemaining*inp.mortgageRate/100*.15), col:C.green },
                  ].map(r=>(
                    <div key={r.l} style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"12px 14px" }}>
                      <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9.5, color:C.mut, marginBottom:6 }}>{r.l}</p>
                      <p style={{ fontFamily:"Georgia, serif", fontSize:20, color:r.col }}>{r.v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background:C.bg, borderLeft:`2px solid ${C.gold}`, padding:"10px 14px", borderRadius:"0 4px 4px 0" }}>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.gold, marginBottom:5, letterSpacing:"0.08em" }}>FUND MANAGER COMMENTARY</p>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:11.5, color:C.sub, lineHeight:1.65 }}>
                    At {inp.mortgageRate}% your mortgage is a risk-free hurdle rate.
                    {inp.mortgageRate < 6 ? " ISA (8%) and GIA (10%) allocations projected to outperform — prioritise investment over overpayment unless LTV reduction unlocks a better rate tier." : " Overpayments may outperform on a risk-adjusted basis — consider a 50/50 hybrid strategy."}
                    {earlyRetire && ` Clearing the mortgage before Year ${inp.workingYears} removes a fixed obligation from your coasting phase and improves post-work cashflow materially.`}
                    {" "}LTV of {fPct(inp.mortgageRemaining/inp.propertyValue*100)}: {inp.mortgageRemaining/inp.propertyValue<0.6?"below 60% — best-in-market rates available":inp.mortgageRemaining/inp.propertyValue<0.75?"60–75% band — competitive rates available":inp.mortgageRemaining/inp.propertyValue<0.9?"75–90% — reducing below 75% unlocks better tiers":"above 90% — focus on LTV reduction before remortgaging"}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAX ═══════════════════════════════════════════════════ */}
          {tab === "tax" && (
            <div key={`tx${tick}`} style={A}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
                <KPI label="Gross Salary"  value={fGBP(inp.salary)} sub="Before deductions"                       col={C.wht} />
                <KPI label="Income Tax"    value={fGBP(tax)}         sub={`Effective ${fPct(tax/inp.salary*100)}`} col={C.red} />
                <KPI label="National Ins." value={fGBP(ni)}          sub={`Effective ${fPct(ni/inp.salary*100)}`}  col={C.amber} />
                <KPI label="Net Take-Home" value={fGBP(th)}          sub={`${fPct(th/inp.salary*100)} retention`}  col={C.green} glow />
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px", marginBottom:14 }}>
                <SH>UK Income Tax Bands 2024/25</SH>
                {[
                  { band:"Personal Allowance", range:"£0 – £12,570",       rate:"0%",  amt:Math.min(inp.salary,12570),                              col:C.green },
                  { band:"Basic Rate",         range:"£12,571 – £50,270",  rate:"20%", amt:Math.max(0,Math.min(inp.salary,50270)-12570)*.2,          col:C.gold },
                  { band:"Higher Rate",        range:"£50,271 – £125,140", rate:"40%", amt:Math.max(0,Math.min(inp.salary,125140)-50270)*.4,         col:C.amber },
                  { band:"Additional Rate",    range:"£125,140+",          rate:"45%", amt:Math.max(0,inp.salary-125140)*.45,                        col:C.red },
                ].map(b => {
                  const active = b.amt > 0;
                  return (
                    <div key={b.band} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", marginBottom:4, background:active?`${b.col}07`:C.surf, border:`1px solid ${active?b.col+"2a":C.bdr}`, borderRadius:3, opacity:active?1:.35 }}>
                      <div>
                        <p style={{ fontFamily:"'Geist', sans-serif", fontSize:12, color:active?b.col:C.dim }}>{b.band}</p>
                        <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9.5, color:C.dim, marginTop:2 }}>{b.range} @ {b.rate}</p>
                      </div>
                      <p style={{ fontFamily:"Georgia, serif", fontSize:22, color:active?b.col:C.dim }}>{fGBP(b.amt)}</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"18px" }}>
                <SH>Pension & ISA Allowance Utilisation</SH>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[
                    { l:"Tax Relief Rate",    v:inp.salary>50270?"40%":"20%",                         col:C.gold },
                    { l:"Net Cost per £1,000",v:fGBP(inp.salary>50270?600:800),                       col:C.green },
                    { l:"Pension Allowance",  v:fGBP(60000),                                          col:C.blue },
                    { l:"Pension Used",       v:fGBP(inp.monthlyPension*12),                          col:C.teal },
                    { l:"Pension Remaining",  v:fGBP(Math.max(0,60000-inp.monthlyPension*12)),        col:C.gold },
                    { l:"ISA Allowance Left", v:fGBP(Math.max(0,20000-inp.isaMonthly*12)),            col:C.amber },
                  ].map(i=>(
                    <div key={i.l} style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:4, padding:"10px 12px" }}>
                      <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.mut, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.1em" }}>{i.l}</p>
                      <p style={{ fontFamily:"Georgia, serif", fontSize:20, color:i.col }}>{i.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ RECOMMENDATIONS ═══════════════════════════════════════ */}
          {tab === "recs" && (
            <div key={`rc${tick}`} style={A}>
              {recs.map((r,i)=>(
                <div key={i} style={{ background:C.card, border:`1px solid ${C.bdr}`, borderLeft:`3px solid ${r.col}`, borderRadius:4, padding:"18px 20px", marginBottom:10, animation:`fireUp .35s ease ${i*.07}s both` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"'Geist', sans-serif", fontSize:13, color:r.col }}>{r.icon}</span>
                      <span style={{ fontFamily:"Georgia, serif", fontSize:17, color:C.wht }}>{r.title}</span>
                    </div>
                    <span style={{ fontFamily:"'Geist', sans-serif", fontSize:8.5, color:r.col, letterSpacing:"0.12em", background:`${r.col}12`, border:`1px solid ${r.col}3a`, padding:"3px 8px", borderRadius:2 }}>{r.p}</span>
                  </div>
                  <p style={{ fontFamily:"'Geist', sans-serif", fontSize:12, color:C.sub, lineHeight:1.65, marginBottom:12 }}>{r.body}</p>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:`${r.col}0c`, border:`1px solid ${r.col}22`, borderRadius:3, padding:"5px 12px" }}>
                    <span style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:r.col, letterSpacing:"0.1em" }}>IMPACT</span>
                    <div style={{ width:1, height:9, background:`${r.col}44` }} />
                    <span style={{ fontFamily:"'Geist', sans-serif", fontSize:10, color:r.col }}>{r.impact}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:10, padding:"12px 16px", background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:4 }}>
                <p style={{ fontFamily:"'Geist', sans-serif", fontSize:9, color:C.dim, lineHeight:1.7 }}>
                  REGULATORY NOTICE — This dashboard is for illustrative and planning purposes only and does not constitute regulated financial advice under the Financial Services and Markets Act 2000. All projections use assumed growth rates and are not guaranteed. Past performance is not indicative of future results. Consult an FCA-authorised Independent Financial Adviser before making investment or pension decisions.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
