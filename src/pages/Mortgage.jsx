import { useState, useMemo, useEffect } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, dp = 0) =>
  n == null || isNaN(n) || n === "" ? "—" : `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const fmtPct = (n, dp = 2) =>
  n == null || isNaN(n) || n === "" ? "—" : `${Number(n).toFixed(dp)}%`;

const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

function calcMonthlyPayment(principal, annualRate, months, type) {
  if (principal <= 0 || months <= 0 || annualRate <= 0) return 0;
  if (type === "interest_only") return (principal * annualRate) / 100 / 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function buildAmortisation(principal, annualRate, months, repaymentType) {
  if (principal <= 0 || months <= 0) return { rows: [], totalInterest: 0, totalPrincipal: 0, totalCost: 0 };
  const rows = [];
  let balance = principal;
  const r = annualRate / 100 / 12;
  const monthly = calcMonthlyPayment(principal, annualRate, months, repaymentType);
  let totalInterest = 0, totalPrincipal = 0;
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPaid = repaymentType === "interest_only" ? 0 : Math.max(0, monthly - interest);
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPrincipal += principalPaid;
    rows.push({ month: i, payment: monthly, interest, principal: principalPaid, balance });
  }
  return { rows, totalInterest, totalPrincipal, totalCost: totalInterest + principal };
}

function btlStressTest(monthlyRent, loanAmount, stressRate) {
  const stressInterest = (loanAmount * stressRate) / 100 / 12;
  const icr = stressInterest > 0 ? monthlyRent / stressInterest : 0;
  return { stressInterest, icr, required125Rent: stressInterest * 1.25, required145Rent: stressInterest * 1.45, pass125: icr >= 1.25, pass145: icr >= 1.45 };
}

function calcSDLT(price, isBTL) {
  const bands = isBTL
    ? [[0, 125000, 0.03], [125000, 250000, 0.05], [250000, 925000, 0.10], [925000, 1500000, 0.15], [1500000, Infinity, 0.17]]
    : [[0, 250000, 0], [250000, 925000, 0.05], [925000, 1500000, 0.10], [1500000, Infinity, 0.12]];
  let tax = 0;
  for (const [low, high, pct] of bands) {
    if (price > low) tax += (Math.min(price, high) - low) * pct;
  }
  return tax;
}

// ── sub-components ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a9bb0", marginBottom: 6, fontWeight: 600 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6, color: "#5a6e88", fontSize: 11 }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", background: "#0d1a2b",
  border: "1px solid #1e3048", borderRadius: 6, color: "#e8f0fc",
  fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function NumInput({ prefix, suffix, value, onChange, placeholder, step, min, max }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && <span style={{ position: "absolute", left: 11, color: "#5a7a9a", fontSize: 14, pointerEvents: "none", zIndex: 1 }}>{prefix}</span>}
      <input
        type="number" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""}
        step={step} min={min} max={max}
        style={{ ...inputStyle, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 38 : 12 }}
      />
      {suffix && <span style={{ position: "absolute", right: 11, color: "#5a7a9a", fontSize: 13, pointerEvents: "none" }}>{suffix}</span>}
    </div>
  );
}

function Select({ options, value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235a7a9a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 3, background: "#0d1a2b", borderRadius: 6, padding: 3, border: "1px solid #1e3048" }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 4, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, transition: "all 0.2s",
            background: value === o.value ? "#1a8853" : "transparent",
            color: value === o.value ? "#fff" : "#5a7a9a", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#0d1a2b", border: `1px solid ${accent ? accent + "55" : "#1e3048"}`, borderRadius: 8, padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || "#e8f0fc", fontFamily: "Georgia,serif", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3aa873", fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #1e3048" }}>
      {children}
    </div>
  );
}

function InfoBox({ children, color = "#1a8853" }) {
  return (
    <div style={{ background: color + "11", border: `1px solid ${color}33`, borderRadius: 6, padding: "10px 13px", marginBottom: 14, fontSize: 11, color: "#8a9bb0", lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function Pill({ color, children }) {
  return <span style={{ background: color + "22", color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{children}</span>;
}

function Row({ label, val, color, note, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #121e2e", paddingBottom: 8, paddingTop: 5 }}>
      <div>
        <div style={{ fontSize: 12, color: bold ? "#e8f0fc" : "#8a9bb0", fontWeight: bold ? 700 : 400 }}>{label}</div>
        {note && <div style={{ fontSize: 10, color: "#5a7a9a" }}>{note}</div>}
      </div>
      <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 600, color: color || (bold ? "#e8f0fc" : "#c0d0e8") }}>{val}</span>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function MortgageCalc() {
  const [mode, setMode] = useState("residential");
  const [purpose, setPurpose] = useState("purchase");
  const [repaymentType, setRepaymentType] = useState("repayment");
  const [mortgageType, setMortgageType] = useState("fixed2");

  // All inputs start as empty strings — no default 0s
  const [propValue, setPropValue] = useState("");
  const [deposit, setDeposit] = useState("");
  const [outstandingLoan, setOutstandingLoan] = useState("");
  const [additionalBorrow, setAdditionalBorrow] = useState("");
  const [currentRate, setCurrentRate] = useState("");
  const [erc, setErc] = useState("");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("");
  const [arrangementFee, setArrangementFee] = useState("");
  const [addFeeToLoan, setAddFeeToLoan] = useState(false);
  const [valuationFee, setValuationFee] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [btlStressRate, setBtlStressRate] = useState("");
  const [taxRate, setTaxRate] = useState("20");
  const [income1, setIncome1] = useState("");
  const [income2, setIncome2] = useState("");
  const [stressRateRes, setStressRateRes] = useState("");

  const [tab, setTab] = useState("overview");
  // Snapshot of inputs at last Calculate press — all results derived from this
  const [calc, setCalc] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Track viewport width so the layout can collapse to a single column on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 860);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fingerprint of current inputs to detect changes after calculate
  const inputFingerprint = [
    mode, purpose, repaymentType, mortgageType,
    propValue, deposit, outstandingLoan, additionalBorrow, currentRate, erc,
    rate, term, arrangementFee, addFeeToLoan, valuationFee,
    monthlyRent, btlStressRate, taxRate, income1, income2, stressRateRes,
  ].join("|");

  const handleCalculate = () => {
    const nPropValue = toNum(propValue);
    const nDeposit = toNum(deposit);
    const nOutstanding = toNum(outstandingLoan);
    const nAdditional = toNum(additionalBorrow);
    const nCurrentRate = toNum(currentRate);
    const nErc = toNum(erc);
    const nRate = toNum(rate);
    const nTerm = toNum(term);
    const nArrangementFee = toNum(arrangementFee);
    const nValuationFee = toNum(valuationFee);
    const nMonthlyRent = toNum(monthlyRent);
    const nBtlStressRate = toNum(btlStressRate);
    const nTaxRate = toNum(taxRate);
    const nIncome1 = toNum(income1);
    const nIncome2 = toNum(income2);
    const nStressRateRes = toNum(stressRateRes);

    const loanBase = purpose === "purchase"
      ? Math.max(0, nPropValue - nDeposit)
      : nOutstanding + nAdditional;
    const loan = addFeeToLoan ? loanBase + nArrangementFee : loanBase;
    const ltv = nPropValue > 0 ? (loan / nPropValue) * 100 : 0;

    const currentMonthly = calcMonthlyPayment(loan, nCurrentRate, nTerm * 12, repaymentType);
    const monthly = calcMonthlyPayment(loan, nRate, nTerm * 12, repaymentType);
    const amort = buildAmortisation(loan, nRate, nTerm * 12, repaymentType);
    const stressMonthly = calcMonthlyPayment(loan, nStressRateRes, nTerm * 12, repaymentType);

    const affordabilityMax = (nIncome1 + nIncome2) * 4.5;
    const btl = btlStressTest(nMonthlyRent, loan, nBtlStressRate);
    const annualRent = nMonthlyRent * 12;
    const grossYield = nPropValue > 0 ? (annualRent / nPropValue) * 100 : 0;
    const annualMortgageInterest = (loan * nRate) / 100;
    const section24TaxCredit = mode === "btl" && nTaxRate > 20 ? annualMortgageInterest * 0.2 : 0;
    const taxableRental = mode === "btl" ? (nTaxRate <= 20 ? Math.max(0, annualRent - annualMortgageInterest) : annualRent) : 0;
    const annualTax = Math.max(0, (taxableRental * nTaxRate) / 100 - section24TaxCredit);
    const annualMortgageCost = monthly * 12;
    const annualNetProfit = annualRent - annualMortgageCost - annualTax;
    const netYield = nPropValue > 0 ? (annualNetProfit / nPropValue) * 100 : 0;
    const sdlt = purpose === "purchase" ? calcSDLT(nPropValue, mode === "btl") : 0;
    const switchingCosts = (addFeeToLoan ? 0 : nArrangementFee) + nValuationFee + nErc + 800;
    const totalUpfrontCost = purpose === "purchase"
      ? nDeposit + sdlt + (addFeeToLoan ? 0 : nArrangementFee) + nValuationFee + 1500
      : switchingCosts;
    const monthlySaving = currentMonthly - monthly;
    const annualSaving = monthlySaving * 12;
    const breakEven = monthlySaving > 0 ? switchingCosts / monthlySaving : null;

    const yearlyAmort = [];
    for (let y = 1; y <= nTerm; y++) {
      const rows = amort.rows.slice((y - 1) * 12, y * 12);
      if (!rows.length) continue;
      const interest = rows.reduce((s, r) => s + r.interest, 0);
      const principal = rows.reduce((s, r) => s + r.principal, 0);
      const balance = rows[rows.length - 1].balance;
      yearlyAmort.push({ year: y, interest, principal, balance, equity: nPropValue - balance });
    }

    setCalc({
      // inputs snapshot
      mode, purpose, repaymentType, mortgageType, addFeeToLoan,
      // numerics
      nPropValue, nDeposit, nOutstanding, nAdditional, nCurrentRate, nErc,
      nRate, nTerm, nArrangementFee, nValuationFee, nMonthlyRent,
      nBtlStressRate, nTaxRate, nIncome1, nIncome2, nStressRateRes,
      // derived
      loan, ltv, currentMonthly, monthly, amort, stressMonthly,
      affordabilityMax, btl, annualRent, grossYield, annualMortgageInterest,
      section24TaxCredit, annualTax, annualMortgageCost, annualNetProfit, netYield,
      sdlt, switchingCosts, totalUpfrontCost, monthlySaving, annualSaving, breakEven,
      yearlyAmort,
    });
    setIsDirty(false);
    if (isMobile) {
      // jump the user down to results after calculating on a phone
      setTimeout(() => {
        const el = document.getElementById("results-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  // Mark dirty whenever any input changes after a calculate
  useMemo(() => {
    if (calc !== null) setIsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputFingerprint]);

  // Convenience: use calc values if available, else zeros/empty
  const c = calc || {};
  const {
    loan = 0, ltv = 0, monthly = 0, currentMonthly = 0, amort = { rows: [], totalInterest: 0, totalPrincipal: 0, totalCost: 0 },
    stressMonthly = 0, affordabilityMax = 0, btl = { icr: 0, stressInterest: 0, required125Rent: 0, required145Rent: 0, pass125: false, pass145: false },
    annualRent = 0, grossYield = 0, annualMortgageInterest = 0, section24TaxCredit = 0,
    annualTax = 0, annualMortgageCost = 0, annualNetProfit = 0, netYield = 0,
    sdlt = 0, switchingCosts = 0, totalUpfrontCost = 0, monthlySaving = 0, annualSaving = 0, breakEven = null,
    yearlyAmort = [],
    nPropValue = 0, nDeposit = 0, nOutstanding = 0, nAdditional = 0, nCurrentRate = 0, nErc = 0,
    nRate = 0, nTerm = 0, nArrangementFee = 0, nValuationFee = 0, nMonthlyRent = 0,
    nBtlStressRate = 0, nTaxRate = 20, nIncome1 = 0, nIncome2 = 0, nStressRateRes = 0,
  } = c;

  // For the loan summary pill in the left panel, compute live (not from snapshot)
  const liveLoanBase = purpose === "purchase"
    ? Math.max(0, toNum(propValue) - toNum(deposit))
    : toNum(outstandingLoan) + toNum(additionalBorrow);
  const liveLoan = addFeeToLoan ? liveLoanBase + toNum(arrangementFee) : liveLoanBase;
  const liveLtv = toNum(propValue) > 0 ? (liveLoan / toNum(propValue)) * 100 : 0;

  const hasData = calc !== null && loan > 0;
  const canCalc = liveLoan > 0 && toNum(rate) > 0 && toNum(term) > 0;

  const tabBtnStyle = (t) => ({
    padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 5, transition: "all 0.2s",
    background: tab === t ? "#1a8853" : "transparent", color: tab === t ? "#fff" : "#5a7a9a",
    whiteSpace: "nowrap",
  });

  const handleModeChange = (v) => {
    setMode(v);
    setRepaymentType(v === "btl" ? "interest_only" : "repayment");
  };

  const kpiCols = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const splitCols = isMobile ? "1fr" : "1fr 1fr";
  const tripleCols = isMobile ? "1fr" : "repeat(3,1fr)";

  return (
    <div style={{ minHeight: "100vh", background: "#07111e", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e8f0fc", paddingBottom: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #1a8853 !important; box-shadow: 0 0 0 3px #1a885318; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.25; }
        input::placeholder { color: #2e4a64; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d1a2b; }
        ::-webkit-scrollbar-thumb { background: #1e3048; border-radius: 2px; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #5a7a9a; font-weight: 600; padding: 8px 10px; border-bottom: 1px solid #1e3048; white-space: nowrap; }
        td { font-size: 12px; padding: 7px 10px; border-bottom: 1px solid #121e2e; color: #c0d0e8; white-space: nowrap; }
        tr:hover td { background: #0d1a2b; }
        tfoot td { border-top: 1px solid #1e3048; border-bottom: none; font-weight: 700; color: #e8f0fc; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg,#0d1a2b 0%,#071422 100%)", borderBottom: "1px solid #1e3048", padding: isMobile ? "16px 18px" : "18px 28px", display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#1a8853", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>UK Mortgage Calculator</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia,serif", letterSpacing: "-0.02em" }}>MortgageDESK</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 5 }}>Mortgage Type</div>
            <Toggle options={[{ value: "residential", label: "Residential" }, { value: "btl", label: "Buy to Let" }]} value={mode} onChange={handleModeChange} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#5a7a9a", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 5 }}>Purpose</div>
            <Toggle options={[{ value: "purchase", label: "Purchase" }, { value: "remortgage", label: "Remortgage" }]} value={purpose} onChange={setPurpose} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "330px 1fr", alignItems: "start" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ background: "#09141f", borderRight: isMobile ? "none" : "1px solid #1e3048", borderBottom: isMobile ? "1px solid #1e3048" : "none", padding: "22px 18px", display: "flex", flexDirection: "column" }}>

          <div style={{ flex: 1 }}>
            <SectionHead>Property & Loan</SectionHead>

            <Field label="Property Value">
              <NumInput prefix="£" value={propValue} onChange={setPropValue} placeholder="e.g. 450,000" />
            </Field>

            {purpose === "purchase" ? (
              <Field label="Deposit">
                <NumInput prefix="£" value={deposit} onChange={setDeposit} placeholder="e.g. 90,000" />
              </Field>
            ) : (
              <>
                <Field label="Outstanding Mortgage Balance">
                  <NumInput prefix="£" value={outstandingLoan} onChange={setOutstandingLoan} placeholder="e.g. 280,000" />
                </Field>
                <Field label="Additional Borrowing" hint="optional">
                  <NumInput prefix="£" value={additionalBorrow} onChange={setAdditionalBorrow} placeholder="e.g. 0" />
                </Field>
                <Field label="Early Repayment Charge" hint="if applicable">
                  <NumInput prefix="£" value={erc} onChange={setErc} placeholder="e.g. 2,500" />
                </Field>
              </>
            )}

            {liveLoan > 0 && (
              <div style={{ background: "#0d1a2b", borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #1e3048" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Loan Amount</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#e8f0fc" }}>{fmt(liveLoan)}</div>
                </div>
                {toNum(propValue) > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>LTV</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: liveLtv > 85 ? "#f06060" : liveLtv > 75 ? "#f0a020" : "#3ad68a" }}>{fmtPct(liveLtv, 1)}</div>
                  </div>
                )}
              </div>
            )}

            <SectionHead>Mortgage Terms</SectionHead>

            <Field label="Mortgage Term" hint="years">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <NumInput value={term} onChange={setTerm} placeholder="e.g. 25" suffix="yrs" min={1} max={40} />
                {term !== "" && toNum(term) > 0 && (
                  <input type="range" min={1} max={40} value={toNum(term)} onChange={e => setTerm(e.target.value)}
                    style={{ flex: 1, accentColor: "#1a8853", cursor: "pointer" }} />
                )}
              </div>
            </Field>

            <Field label="Repayment Type">
              <Toggle options={[{ value: "repayment", label: "Capital & Interest" }, { value: "interest_only", label: "Interest Only" }]} value={repaymentType} onChange={setRepaymentType} />
            </Field>

            <Field label="Mortgage Product">
              <Select value={mortgageType} onChange={setMortgageType} options={[
                { value: "fixed2", label: "2-Year Fixed" },
                { value: "fixed5", label: "5-Year Fixed" },
                { value: "fixed10", label: "10-Year Fixed" },
                { value: "tracker", label: "Tracker (Base + Margin)" },
                { value: "variable", label: "Variable / SVR" },
                { value: "discount", label: "Discount Variable" },
              ]} />
            </Field>

            <Field label={purpose === "remortgage" ? "New Interest Rate" : "Interest Rate"} hint="annual %">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <NumInput value={rate} onChange={setRate} placeholder="e.g. 4.75" suffix="%" step="0.05" />
                {rate !== "" && toNum(rate) > 0 && (
                  <input type="range" min={0.5} max={12} step={0.05} value={toNum(rate)} onChange={e => setRate(e.target.value)}
                    style={{ flex: 1, accentColor: "#1a8853", cursor: "pointer" }} />
                )}
              </div>
            </Field>

            {purpose === "remortgage" && (
              <Field label="Current Rate" hint="for comparison">
                <NumInput value={currentRate} onChange={setCurrentRate} placeholder="e.g. 6.50" suffix="%" step="0.05" />
              </Field>
            )}

            <SectionHead>Fees & Costs</SectionHead>

            <Field label="Arrangement Fee">
              <NumInput prefix="£" value={arrangementFee} onChange={setArrangementFee} placeholder="e.g. 999" />
            </Field>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#8a9bb0" }}>
                <input type="checkbox" checked={addFeeToLoan} onChange={e => setAddFeeToLoan(e.target.checked)} style={{ accentColor: "#1a8853", width: 14, height: 14 }} />
                Add arrangement fee to loan
              </label>
            </div>
            <Field label="Valuation Fee">
              <NumInput prefix="£" value={valuationFee} onChange={setValuationFee} placeholder="e.g. 300" />
            </Field>

            {mode === "btl" && (
              <>
                <SectionHead>Buy to Let</SectionHead>
                <Field label="Monthly Rental Income">
                  <NumInput prefix="£" value={monthlyRent} onChange={setMonthlyRent} placeholder="e.g. 1,800" />
                </Field>
                <Field label="ICR Stress Test Rate">
                  <NumInput value={btlStressRate} onChange={setBtlStressRate} placeholder="e.g. 5.50" suffix="%" step="0.1" />
                </Field>
                <Field label="Tax Band">
                  <Select value={taxRate} onChange={setTaxRate} options={[
                    { value: "20", label: "Basic Rate (20%)" },
                    { value: "40", label: "Higher Rate (40%)" },
                    { value: "45", label: "Additional Rate (45%)" },
                  ]} />
                </Field>
              </>
            )}

            {mode === "residential" && (
              <>
                <SectionHead>Affordability</SectionHead>
                <Field label="Primary Income" hint="gross annual">
                  <NumInput prefix="£" value={income1} onChange={setIncome1} placeholder="e.g. 65,000" suffix="/yr" />
                </Field>
                <Field label="Secondary Income" hint="optional">
                  <NumInput prefix="£" value={income2} onChange={setIncome2} placeholder="e.g. 35,000" suffix="/yr" />
                </Field>
                <Field label="Stress Test Rate">
                  <NumInput value={stressRateRes} onChange={setStressRateRes} placeholder="e.g. 7.00" suffix="%" step="0.1" />
                </Field>
              </>
            )}
          </div>

          {/* ── CALCULATE BUTTON ── */}
          <div style={{ position: isMobile ? "static" : "sticky", bottom: 0, marginTop: 24, paddingTop: 16, background: "#09141f", borderTop: "1px solid #1e3048" }}>
            {isDirty && calc !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "7px 12px", background: "#f0a02011", border: "1px solid #f0a02033", borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: "#f0a020" }}>⚠ Inputs changed — recalculate to update results</span>
              </div>
            )}
            <button
              onClick={handleCalculate}
              disabled={!canCalc}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 8, border: "none",
                cursor: canCalc ? "pointer" : "not-allowed",
                background: canCalc
                  ? (isDirty && calc !== null ? "linear-gradient(135deg, #f0a020 0%, #e08010 100%)" : "linear-gradient(135deg, #1a8853 0%, #136a40 100%)")
                  : "#1e3048",
                color: canCalc ? "#fff" : "#3a5570",
                fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "all 0.2s", fontFamily: "inherit",
                boxShadow: canCalc ? "0 4px 20px #1a885333" : "none",
              }}
            >
              {calc === null ? "Calculate Mortgage" : isDirty ? "⟳ Recalculate" : "✓ Calculated"}
            </button>
            {liveLoan <= 0 && <div style={{ fontSize: 10, color: "#3a5570", textAlign: "center", marginTop: 6 }}>Enter property value & {purpose === "purchase" ? "deposit" : "outstanding balance"} to calculate</div>}
            {liveLoan > 0 && toNum(rate) <= 0 && <div style={{ fontSize: 10, color: "#3a5570", textAlign: "center", marginTop: 6 }}>Enter an interest rate to calculate</div>}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div id="results-panel" style={{ padding: isMobile ? "18px 16px" : "22px 22px" }}>

          {!hasData && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: isMobile ? "auto" : "65vh", padding: isMobile ? "30px 0" : 0, gap: 14, opacity: 0.55 }}>
              <div style={{ fontSize: 52 }}>🏠</div>
              <div style={{ fontSize: 16, color: "#5a7a9a", fontWeight: 600, textAlign: "center" }}>Enter your mortgage details to get started</div>
              <div style={{ fontSize: 12, color: "#3a5570", textAlign: "center", maxWidth: 320, lineHeight: 1.7 }}>
                Fill in the property value and {purpose === "purchase" ? "deposit" : "outstanding balance"} {isMobile ? "above" : "on the left panel"} to see your mortgage calculations.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["Purchase / Remortgage", "Residential / BTL", "SDLT & Costs", "ICR Stress Tests"].map(f => (
                  <div key={f} style={{ background: "#0d1a2b", border: "1px solid #1e3048", borderRadius: 6, padding: "8px 14px", fontSize: 11, color: "#5a7a9a" }}>✓ {f}</div>
                ))}
              </div>
            </div>
          )}

          {hasData && (
            <>
              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: kpiCols, gap: 10, marginBottom: 18 }}>
                <StatCard label="Monthly Payment" value={fmt(monthly)} sub={monthly > 0 ? `${fmt(amort.totalCost)} total cost` : "—"} accent="#1a8853" />
                <StatCard label="Total Interest" value={fmt(amort.totalInterest)} sub={amort.totalInterest > 0 && loan > 0 ? `${fmtPct((amort.totalInterest / loan) * 100, 1)} of loan` : "—"} />
                <StatCard label="LTV" value={nPropValue > 0 ? fmtPct(ltv, 1) : "—"}
                  sub={ltv > 85 ? "High — limited products" : ltv > 75 ? "Moderate" : ltv > 0 ? "Strong position" : "Enter property value"}
                  accent={ltv > 85 ? "#f06060" : ltv > 75 ? "#f0a020" : "#3ad68a"} />
                {purpose === "remortgage"
                  ? <StatCard label="Monthly Saving"
                      value={nCurrentRate > 0 ? (monthlySaving >= 0 ? fmt(monthlySaving) : `−${fmt(-monthlySaving)}`) : "—"}
                      sub={nCurrentRate > 0 ? (monthlySaving > 0 ? `${fmt(annualSaving)}/yr · Break-even ${breakEven ? Math.ceil(breakEven) + " mths" : "—"}` : "Higher cost than current") : "Enter current rate to compare"}
                      accent={nCurrentRate > 0 ? (monthlySaving > 0 ? "#3ad68a" : "#f06060") : undefined} />
                  : mode === "btl"
                    ? <StatCard label="Gross Yield" value={nPropValue > 0 && nMonthlyRent > 0 ? fmtPct(grossYield) : "—"} sub={nMonthlyRent > 0 ? `Net ~${fmtPct(netYield)}` : "Enter rental income"} accent={grossYield > 6 ? "#3ad68a" : grossYield > 4 ? "#f0a020" : grossYield > 0 ? "#f06060" : undefined} />
                    : <StatCard label="Max Affordability" value={nIncome1 > 0 ? fmt(affordabilityMax) : "—"} sub={nIncome1 > 0 ? `4.5× combined income · ${fmtPct((loan / affordabilityMax) * 100, 0)} used` : "Enter income"} accent={nIncome1 > 0 ? (loan <= affordabilityMax ? "#3ad68a" : "#f06060") : undefined} />
                }
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 3, marginBottom: 18, background: "#09141f", borderRadius: 8, padding: 4, border: "1px solid #1e3048", overflowX: "auto" }}>
                {["overview", "amortisation", "affordability", "costs"].map(t => (
                  <button key={t} style={tabBtnStyle(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: splitCols, gap: 16 }}>

                    {/* Monthly breakdown */}
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Monthly Breakdown</SectionHead>
                      {[
                        { label: "Capital Repayment", val: repaymentType === "repayment" ? Math.max(0, monthly - (loan * nRate / 100 / 12)) : 0, color: "#1a8853" },
                        { label: "Interest", val: loan * nRate / 100 / 12, color: "#3ad68a" },
                      ].map(r => (
                        <div key={r.label} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: "#8a9bb0" }}>{r.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#e8f0fc" }}>{fmt(r.val)}</span>
                          </div>
                          <div style={{ height: 4, background: "#1e3048", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: monthly > 0 ? `${(r.val / monthly) * 100}%` : "0%", background: r.color, borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid #1e3048", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#8a9bb0" }}>Total Monthly</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#1a8853" }}>{fmt(monthly)}</span>
                      </div>
                    </div>

                    {/* Loan structure */}
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Loan Structure</SectionHead>
                      {[
                        { label: "Property Value", val: nPropValue > 0 ? fmt(nPropValue) : "—" },
                        purpose === "purchase"
                          ? { label: "Deposit", val: nDeposit > 0 ? fmt(nDeposit) : "—" }
                          : { label: "Outstanding Balance", val: nOutstanding > 0 ? fmt(nOutstanding) : "—" },
                        purpose === "remortgage" && nAdditional > 0 ? { label: "Additional Borrowing", val: fmt(nAdditional) } : null,
                        { label: "Loan Amount", val: fmt(loan) },
                        nPropValue > 0 ? { label: "LTV Ratio", val: fmtPct(ltv, 2) } : null,
                        { label: "Mortgage Term", val: nTerm > 0 ? `${nTerm} years` : "—" },
                        { label: "Repayment Type", val: repaymentType === "repayment" ? "Capital & Interest" : "Interest Only" },
                        { label: "Rate Type", val: { fixed2: "2-Year Fixed", fixed5: "5-Year Fixed", fixed10: "10-Year Fixed", tracker: "Tracker", variable: "Variable SVR", discount: "Discount" }[mortgageType] },
                        { label: "Interest Rate", val: nRate > 0 ? fmtPct(nRate) : "—" },
                      ].filter(Boolean).map(r => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #121e2e", paddingBottom: 6, paddingTop: 4 }}>
                          <span style={{ fontSize: 11, color: "#5a7a9a" }}>{r.label}</span>
                          <span style={{ fontSize: 12, color: "#e8f0fc", fontWeight: 500 }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remortgage comparison panel */}
                  {purpose === "remortgage" && nCurrentRate > 0 && monthly > 0 && (
                    <div style={{ background: "#09141f", border: "1px solid #1a885333", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Remortgage Comparison</SectionHead>
                      <div style={{ display: "grid", gridTemplateColumns: tripleCols, gap: 16, marginBottom: 16 }}>
                        {[
                          { label: "Current Monthly", val: fmt(currentMonthly), sub: `@ ${fmtPct(nCurrentRate)}`, color: "#f06060" },
                          { label: "New Monthly", val: fmt(monthly), sub: `@ ${fmtPct(nRate)}`, color: "#3ad68a" },
                          { label: monthlySaving >= 0 ? "Monthly Saving" : "Monthly Increase", val: fmt(Math.abs(monthlySaving)), sub: `${fmt(Math.abs(annualSaving))}/yr`, color: monthlySaving >= 0 ? "#3ad68a" : "#f06060" },
                        ].map(r => (
                          <div key={r.label} style={{ background: "#0d1a2b", borderRadius: 8, padding: "14px 16px" }}>
                            <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{r.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: r.color, fontFamily: "Georgia,serif" }}>{r.val}</div>
                            <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4 }}>{r.sub}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: tripleCols, gap: 10 }}>
                        {[
                          { label: "Switching Costs", val: fmt(switchingCosts) },
                          { label: "Break-Even Period", val: breakEven ? Math.ceil(breakEven) + " months" : "—", color: breakEven && breakEven <= 24 ? "#3ad68a" : "#f0a020" },
                          { label: "5-Year Net Saving", val: fmt(Math.abs(annualSaving * 5 - switchingCosts)), color: annualSaving * 5 > switchingCosts ? "#3ad68a" : "#f06060" },
                        ].map(r => (
                          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", background: "#0d1a2b", borderRadius: 6, padding: "10px 14px" }}>
                            <span style={{ fontSize: 11, color: "#5a7a9a" }}>{r.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: r.color || "#e8f0fc" }}>{r.val}</span>
                          </div>
                        ))}
                      </div>
                      {nErc > 0 && (
                        <div style={{ marginTop: 12, padding: "10px 13px", background: "#f0a02011", border: "1px solid #f0a02033", borderRadius: 6, fontSize: 11, color: "#f0a020" }}>
                          ⚠ Early Repayment Charge of {fmt(nErc)} is included in the switching cost and break-even calculation above.
                        </div>
                      )}
                    </div>
                  )}

                  {/* BTL P&L */}
                  {mode === "btl" && nMonthlyRent > 0 && (
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Buy to Let Analysis</SectionHead>
                      <div style={{ display: "grid", gridTemplateColumns: tripleCols, gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>ICR @ {nBtlStressRate > 0 ? fmtPct(nBtlStressRate) : "—"}</div>
                          <div style={{ fontSize: 26, fontWeight: 700, color: btl.icr >= 1.45 ? "#3ad68a" : btl.icr >= 1.25 ? "#f0a020" : "#f06060", fontFamily: "Georgia,serif" }}>{nBtlStressRate > 0 ? btl.icr.toFixed(2) + "x" : "—"}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            <Pill color={btl.pass125 ? "#3ad68a" : "#f06060"}>125% {btl.pass125 ? "✓" : "✗"}</Pill>
                            <Pill color={btl.pass145 ? "#3ad68a" : "#f06060"}>145% {btl.pass145 ? "✓" : "✗"}</Pill>
                          </div>
                          <div style={{ fontSize: 10, color: "#5a7a9a", marginTop: 8 }}>Min rent (125%): {fmt(btl.required125Rent)}/mo</div>
                          <div style={{ fontSize: 10, color: "#5a7a9a" }}>Min rent (145%): {fmt(btl.required145Rent)}/mo</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>Annual P&L</div>
                          {[
                            { label: "Gross Rent", val: fmt(annualRent), color: "#3ad68a" },
                            { label: "Mortgage Cost", val: `−${fmt(annualMortgageCost)}`, color: "#f06060" },
                            { label: `Tax (${taxRate}%)`, val: `−${fmt(annualTax)}`, color: "#f06060" },
                            { label: "Net Profit", val: fmt(annualNetProfit), color: annualNetProfit >= 0 ? "#3ad68a" : "#f06060", bold: true },
                          ].map(r => (
                            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #121e2e", paddingBottom: 5, paddingTop: 3 }}>
                              <span style={{ fontSize: 11, color: "#8a9bb0" }}>{r.label}</span>
                              <span style={{ fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 600, color: r.color }}>{r.val}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>Yield Metrics</div>
                          {[
                            { label: "Gross Yield", val: fmtPct(grossYield) },
                            { label: "Net Yield", val: fmtPct(netYield) },
                            { label: "Annual Rent", val: fmt(annualRent) },
                            { label: "S24 Tax Credit", val: fmt(section24TaxCredit) },
                            { label: "Return on Deposit", val: nDeposit > 0 ? fmtPct((annualNetProfit / nDeposit) * 100) : "—" },
                          ].map(r => (
                            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #121e2e", paddingBottom: 5, paddingTop: 3 }}>
                              <span style={{ fontSize: 11, color: "#8a9bb0" }}>{r.label}</span>
                              <span style={{ fontSize: 12, color: "#e8f0fc", fontWeight: 500 }}>{r.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Balance chart */}
                  {yearlyAmort.length > 0 && (
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Balance vs Equity Over Term</SectionHead>
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 90, marginTop: 20, marginBottom: 8 }}>
                        {yearlyAmort.map((y, i) => (
                          <div key={i} title={`Year ${y.year} — Balance: ${fmt(y.balance)}, Equity: ${fmt(y.equity)}`}
                            style={{ flex: 1, height: 80, position: "relative", cursor: "default" }}>
                            <div style={{ position: "absolute", inset: 0, background: "#1e3048", borderRadius: "2px 2px 0 0" }} />
                            {nPropValue > 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#3ad68a22", height: `${Math.min(100, (y.equity / nPropValue) * 100)}%`, borderRadius: "2px 2px 0 0" }} />}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a8853", height: `${(y.balance / (loan || 1)) * 100}%`, borderRadius: "2px 2px 0 0", transition: "height 0.3s" }} />
                            {(i === 0 || (i + 1) % Math.max(1, Math.ceil(nTerm / 8)) === 0 || i === yearlyAmort.length - 1) && (
                              <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: "#5a7a9a", whiteSpace: "nowrap" }}>Y{y.year}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, background: "#1a8853", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#5a7a9a" }}>Outstanding Balance</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, background: "#3ad68a", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#5a7a9a" }}>Equity</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── AMORTISATION ── */}
              {tab === "amortisation" && (
                <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                  <SectionHead>Yearly Amortisation Schedule</SectionHead>
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr><th>Year</th><th>Annual Payment</th><th>Capital Paid</th><th>Interest Paid</th><th>Balance</th><th>Equity</th><th>LTV</th></tr>
                      </thead>
                      <tbody>
                        {yearlyAmort.map(y => (
                          <tr key={y.year}>
                            <td style={{ color: "#1a8853", fontWeight: 600 }}>Year {y.year}</td>
                            <td>{fmt(y.interest + y.principal)}</td>
                            <td style={{ color: "#3ad68a" }}>{fmt(y.principal)}</td>
                            <td style={{ color: "#f06060" }}>{fmt(y.interest)}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(y.balance)}</td>
                            <td style={{ color: "#3ad68a" }}>{nPropValue > 0 ? fmt(y.equity) : "—"}</td>
                            <td><span style={{ color: nPropValue > 0 ? (y.balance / nPropValue > 0.85 ? "#f06060" : y.balance / nPropValue > 0.75 ? "#f0a020" : "#3ad68a") : "#5a7a9a" }}>{nPropValue > 0 ? fmtPct((y.balance / nPropValue) * 100, 1) : "—"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td>{fmt(amort.totalInterest + amort.totalPrincipal)}</td>
                          <td style={{ color: "#3ad68a" }}>{fmt(amort.totalPrincipal)}</td>
                          <td style={{ color: "#f06060" }}>{fmt(amort.totalInterest)}</td>
                          <td>{fmt(amort.rows[amort.rows.length - 1]?.balance ?? 0)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ── AFFORDABILITY ── */}
              {tab === "affordability" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {mode === "residential" ? (
                    <>
                      <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                        <SectionHead>Income Multiple Analysis</SectionHead>
                        {nIncome1 === 0 && <InfoBox>Enter your income in the {isMobile ? "panel above" : "left panel"} to see affordability analysis.</InfoBox>}
                        <div style={{ display: "grid", gridTemplateColumns: splitCols, gap: 10 }}>
                          {[
                            { label: "Combined Income", val: nIncome1 > 0 ? fmt(nIncome1 + nIncome2) : "—", plain: true },
                            { label: "Loan Amount", val: fmt(loan), plain: true },
                            { label: "4.0× Max", val: nIncome1 > 0 ? fmt((nIncome1 + nIncome2) * 4) : "—", ok: nIncome1 > 0 ? loan <= (nIncome1 + nIncome2) * 4 : null },
                            { label: "4.5× Max (standard)", val: nIncome1 > 0 ? fmt((nIncome1 + nIncome2) * 4.5) : "—", ok: nIncome1 > 0 ? loan <= (nIncome1 + nIncome2) * 4.5 : null },
                            { label: "5.0× Max", val: nIncome1 > 0 ? fmt((nIncome1 + nIncome2) * 5) : "—", ok: nIncome1 > 0 ? loan <= (nIncome1 + nIncome2) * 5 : null },
                            { label: "5.5× Max (Help to Buy)", val: nIncome1 > 0 ? fmt((nIncome1 + nIncome2) * 5.5) : "—", ok: nIncome1 > 0 ? loan <= (nIncome1 + nIncome2) * 5.5 : null },
                          ].map(r => (
                            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #121e2e", paddingBottom: 8, paddingTop: 4 }}>
                              <span style={{ fontSize: 12, color: "#8a9bb0" }}>{r.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: r.plain ? "#e8f0fc" : r.ok === null ? "#5a7a9a" : r.ok ? "#3ad68a" : "#f06060" }}>{r.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                        <SectionHead>Rate Sensitivity & Stress Test</SectionHead>
                        <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead><tr><th>Rate</th><th>Monthly</th><th>Annual Cost</th><th>% of Income</th><th>Status</th></tr></thead>
                          <tbody>
                            {(nRate > 0 ? [nRate, nRate + 0.5, nRate + 1, nRate + 1.5, nRate + 2, nRate + 3] : [4.0, 4.5, 5.0, 5.5, 6.0, 7.0]).map((r, i) => {
                              const m = calcMonthlyPayment(loan, r, nTerm * 12, repaymentType);
                              const annPct = (nIncome1 + nIncome2) > 0 ? (m * 12 / (nIncome1 + nIncome2)) * 100 : null;
                              const isCurrent = nRate > 0 && i === 0;
                              return (
                                <tr key={r} style={{ background: isCurrent ? "#0d1a2b" : "transparent" }}>
                                  <td style={{ color: isCurrent ? "#1a8853" : "#c0d0e8", fontWeight: isCurrent ? 700 : 400 }}>{fmtPct(r)}{isCurrent ? " ← current" : ""}</td>
                                  <td>{fmt(m)}</td>
                                  <td>{fmt(m * 12)}</td>
                                  <td style={{ color: annPct == null ? "#5a7a9a" : annPct > 45 ? "#f06060" : annPct > 35 ? "#f0a020" : "#3ad68a" }}>{annPct != null ? annPct.toFixed(1) + "%" : "—"}</td>
                                  <td>{annPct != null ? <Pill color={annPct > 45 ? "#f06060" : annPct > 35 ? "#f0a020" : "#3ad68a"}>{annPct > 45 ? "Stretched" : annPct > 35 ? "Moderate" : "Comfortable"}</Pill> : <span style={{ color: "#5a7a9a", fontSize: 11 }}>Enter income</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                        {nStressRateRes > 0 && <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 10 }}>Stress test @ {fmtPct(nStressRateRes)}: {fmt(stressMonthly)}/mo · Guideline: &lt;35% of gross income is comfortable</div>}
                      </div>

                      {purpose === "remortgage" && (
                        <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                          <SectionHead>Remortgage — Lender Affordability Floors</SectionHead>
                          <InfoBox color="#3ad68a">At remortgage, lenders stress-test at their reversion rate or a minimum floor (commonly 7–8%), whichever is higher. Passing means the payment at the floor rate is affordable relative to your income.</InfoBox>
                          <div style={{ overflowX: "auto" }}>
                          <table>
                            <thead><tr><th>Lender Floor</th><th>Monthly at Floor</th><th>Annual Cost</th><th>% of Income</th><th>Result</th></tr></thead>
                            <tbody>
                              {[6.5, 7.0, 7.5, 8.0, 8.5].map(r => {
                                const m = calcMonthlyPayment(loan, r, nTerm * 12, repaymentType);
                                const annPct = (nIncome1 + nIncome2) > 0 ? (m * 12 / (nIncome1 + nIncome2)) * 100 : null;
                                return (
                                  <tr key={r}>
                                    <td>{fmtPct(r)}</td>
                                    <td>{fmt(m)}</td>
                                    <td>{fmt(m * 12)}</td>
                                    <td style={{ color: annPct == null ? "#5a7a9a" : annPct > 45 ? "#f06060" : annPct > 35 ? "#f0a020" : "#3ad68a" }}>{annPct != null ? annPct.toFixed(1) + "%" : "—"}</td>
                                    <td>{annPct != null ? <Pill color={annPct <= 45 ? "#3ad68a" : "#f06060"}>{annPct <= 45 ? "Pass ✓" : "Fail ✗"}</Pill> : "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                        <SectionHead>BTL Lender Stress Tests</SectionHead>
                        <InfoBox>Lenders require rental income to cover the stressed interest-only payment by a minimum ICR. Portfolio landlords (4+ properties) and higher-rate taxpayers typically face a 145% requirement.</InfoBox>
                        <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead><tr><th>Scenario</th><th>Stress Rate</th><th>ICR Required</th><th>Min. Rent</th><th>Your Rent</th><th>Result</th></tr></thead>
                          <tbody>
                            {[
                              { label: "Standard (basic rate)", sRate: nBtlStressRate || 5.5, icr: 1.25 },
                              { label: "Higher rate / portfolio", sRate: nBtlStressRate || 5.5, icr: 1.45 },
                              { label: "Conservative lender", sRate: (nBtlStressRate || 5.5) + 0.5, icr: 1.45 },
                              { label: "Ltd Co (typical)", sRate: nBtlStressRate || 5.5, icr: 1.25 },
                              ...(purpose === "remortgage" ? [{ label: "Remortgage stress", sRate: Math.max(nBtlStressRate || 5.5, nRate + 2), icr: 1.25 }] : []),
                            ].map(s => {
                              const si = (loan * s.sRate) / 100 / 12;
                              const minRent = si * s.icr;
                              const pass = nMonthlyRent >= minRent;
                              return (
                                <tr key={s.label}>
                                  <td>{s.label}</td><td>{fmtPct(s.sRate)}</td><td>{s.icr}x</td>
                                  <td style={{ color: "#f0a020" }}>{fmt(minRent)}/mo</td>
                                  <td>{nMonthlyRent > 0 ? fmt(nMonthlyRent) + "/mo" : "—"}</td>
                                  <td>{nMonthlyRent > 0 ? <Pill color={pass ? "#3ad68a" : "#f06060"}>{pass ? "Pass ✓" : "Fail ✗"}</Pill> : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </div>

                      <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                        <SectionHead>Rental Yield Sensitivity</SectionHead>
                        <div style={{ overflowX: "auto" }}>
                        <table>
                          <thead><tr><th>Monthly Rent</th><th>Annual Rent</th><th>Gross Yield</th><th>ICR</th><th>Net Profit/yr</th></tr></thead>
                          <tbody>
                            {[-300, -200, -100, 0, 100, 200, 300].map(delta => {
                              const r = nMonthlyRent + delta;
                              if (r <= 0) return null;
                              const annual = r * 12;
                              const gy = nPropValue > 0 ? (annual / nPropValue) * 100 : 0;
                              const si = btl.stressInterest;
                              const icr = si > 0 ? r / si : 0;
                              const taxable = nTaxRate <= 20 ? Math.max(0, annual - annualMortgageInterest) : annual;
                              const tax = Math.max(0, (taxable * nTaxRate) / 100 - section24TaxCredit);
                              const net = annual - annualMortgageCost - tax;
                              return (
                                <tr key={delta} style={{ background: delta === 0 ? "#0d1a2b" : "transparent" }}>
                                  <td style={{ fontWeight: delta === 0 ? 700 : 400, color: delta === 0 ? "#1a8853" : "#e8f0fc" }}>{fmt(r)}{delta === 0 ? " ← current" : ""}</td>
                                  <td>{fmt(annual)}</td>
                                  <td style={{ color: gy > 6 ? "#3ad68a" : gy > 4 ? "#f0a020" : "#f06060" }}>{fmtPct(gy)}</td>
                                  <td style={{ color: icr >= 1.45 ? "#3ad68a" : icr >= 1.25 ? "#f0a020" : "#f06060" }}>{icr.toFixed(2)}x</td>
                                  <td style={{ color: net > 0 ? "#3ad68a" : "#f06060" }}>{fmt(net)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </div>

                      {purpose === "remortgage" && nCurrentRate > 0 && monthly > 0 && (
                        <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                          <SectionHead>BTL Remortgage — Rental Cash Flow Impact</SectionHead>
                          <div style={{ display: "grid", gridTemplateColumns: tripleCols, gap: 14 }}>
                            {[
                              { label: "Current Mortgage Cost", val: fmt(currentMonthly) + "/mo", sub: `${fmt(currentMonthly * 12)}/yr @ ${fmtPct(nCurrentRate)}`, color: "#f06060" },
                              { label: "New Mortgage Cost", val: fmt(monthly) + "/mo", sub: `${fmt(monthly * 12)}/yr @ ${fmtPct(nRate)}`, color: "#3ad68a" },
                              { label: "Net Profit Change", val: `${monthlySaving >= 0 ? "+" : ""}${fmt(monthlySaving)}/mo`, sub: `${fmt(Math.abs(annualSaving))}/yr ${monthlySaving >= 0 ? "better" : "worse"}`, color: monthlySaving >= 0 ? "#3ad68a" : "#f06060" },
                            ].map(r => (
                              <div key={r.label} style={{ background: "#0d1a2b", borderRadius: 8, padding: "14px 16px" }}>
                                <div style={{ fontSize: 10, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{r.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: r.color, fontFamily: "Georgia,serif" }}>{r.val}</div>
                                <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4 }}>{r.sub}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── COSTS ── */}
              {tab === "costs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: splitCols, gap: 16 }}>
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Upfront Costs — {purpose === "purchase" ? "Purchase" : "Remortgage"}</SectionHead>
                      {purpose === "purchase" ? (
                        <>
                          <Row label="Deposit" val={nDeposit > 0 ? fmt(nDeposit) : "—"} note={nPropValue > 0 && nDeposit > 0 ? `${fmtPct((nDeposit / nPropValue) * 100, 1)} of property value` : ""} />
                          <Row label={`SDLT${mode === "btl" ? " (3% BTL surcharge)" : ""}`} val={fmt(sdlt)} note="Stamp Duty Land Tax" />
                          <Row label="Arrangement Fee" val={addFeeToLoan ? "Added to loan" : (nArrangementFee > 0 ? fmt(nArrangementFee) : "—")} note={addFeeToLoan ? "Rolled into mortgage" : "Paid upfront"} />
                          <Row label="Valuation Fee" val={nValuationFee > 0 ? fmt(nValuationFee) : "—"} note="Lender-dependent" />
                          <Row label="Legal / Conveyancing" val="~£1,500" note="Estimate — get solicitor quotes" />
                          <Row label="Survey (Homebuyer)" val="~£500" note="Recommended on older properties" />
                          <Row label="Total Upfront (approx)" val={fmt(totalUpfrontCost)} bold color="#f0a020" />
                        </>
                      ) : (
                        <>
                          <Row label="Arrangement Fee" val={addFeeToLoan ? "Added to loan" : (nArrangementFee > 0 ? fmt(nArrangementFee) : "—")} note={addFeeToLoan ? "Rolled into new mortgage" : "Paid on completion"} />
                          <Row label="Valuation Fee" val={nValuationFee > 0 ? fmt(nValuationFee) : "—"} note="Many lenders offer free valuations" />
                          <Row label="Early Repayment Charge" val={nErc > 0 ? fmt(nErc) : "None"} note={nErc > 0 ? "Confirm exact figure with lender" : "Check your current deal"} />
                          <Row label="Legal / Remortgage Solicitor" val="~£800" note="Some lenders provide free legal" />
                          <Row label="Total Switching Costs" val={fmt(totalUpfrontCost)} bold color="#f0a020" />
                        </>
                      )}
                    </div>

                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Total Cost of Borrowing</SectionHead>
                      <Row label="Loan Amount" val={fmt(loan)} />
                      <Row label="Total Interest Paid" val={fmt(amort.totalInterest)} color="#f06060" note={nTerm > 0 ? `Over ${nTerm}-year term` : ""} />
                      <Row label="Arrangement Fee" val={nArrangementFee > 0 ? fmt(nArrangementFee) : "—"} />
                      <Row label="Total Mortgage Cost" val={fmt(loan + amort.totalInterest + nArrangementFee)} color="#1a8853" bold />
                      {purpose === "purchase" && nDeposit > 0 && (
                        <Row label="Total inc. Deposit" val={fmt(nDeposit + loan + amort.totalInterest + nArrangementFee)} />
                      )}
                      {purpose === "remortgage" && nCurrentRate > 0 && (
                        <Row label="Interest Saving vs Current Rate"
                          val={fmt(Math.abs(calcMonthlyPayment(loan, nCurrentRate, nTerm * 12, repaymentType) * nTerm * 12 - amort.totalInterest))}
                          color={amort.totalInterest < calcMonthlyPayment(loan, nCurrentRate, nTerm * 12, repaymentType) * nTerm * 12 ? "#3ad68a" : "#f06060"}
                          note="Over full remaining term" />
                      )}
                    </div>
                  </div>

                  {purpose === "purchase" && nPropValue > 0 && (
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>SDLT Band Breakdown — {mode === "btl" ? "BTL (3% surcharge applied)" : "Residential"}</SectionHead>
                      <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr><th>Band</th><th>Rate</th><th>Amount in Band</th><th>Tax</th></tr></thead>
                        <tbody>
                          {(mode === "btl"
                            ? [[0, 125000, 0.03], [125000, 250000, 0.05], [250000, 925000, 0.10], [925000, 1500000, 0.15], [1500000, Infinity, 0.17]]
                            : [[0, 250000, 0], [250000, 925000, 0.05], [925000, 1500000, 0.10], [1500000, Infinity, 0.12]]
                          ).map(([low, high, pct]) => {
                            if (nPropValue <= low) return null;
                            const inBand = Math.min(nPropValue, high) - low;
                            const tax = inBand * pct;
                            return (
                              <tr key={low}>
                                <td>{fmt(low)} – {high === Infinity ? "above" : fmt(high)}</td>
                                <td>{fmtPct(pct * 100, 0)}</td>
                                <td>{fmt(inBand)}</td>
                                <td style={{ fontWeight: 600, color: tax > 0 ? "#f0a020" : "#5a7a9a" }}>{fmt(tax)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot><tr><td colSpan={3}>Total SDLT</td><td style={{ color: "#f0a020", fontSize: 14 }}>{fmt(sdlt)}</td></tr></tfoot>
                      </table>
                      </div>
                      <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 10 }}>Rates effective April 2025. First-time buyer relief may apply on properties up to £500,000. Confirm with your solicitor.</div>
                    </div>
                  )}

                  {purpose === "remortgage" && nCurrentRate > 0 && monthly > 0 && (
                    <div style={{ background: "#09141f", border: "1px solid #1e3048", borderRadius: 10, padding: 20 }}>
                      <SectionHead>Remortgage Cost–Benefit Summary</SectionHead>
                      <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr><th>Metric</th><th>Value</th><th>Verdict</th></tr></thead>
                        <tbody>
                          <tr>
                            <td>Monthly saving</td>
                            <td style={{ color: monthlySaving > 0 ? "#3ad68a" : "#f06060", fontWeight: 600 }}>{fmt(Math.abs(monthlySaving))}/mo {monthlySaving >= 0 ? "saved" : "extra"}</td>
                            <td style={{ color: "#5a7a9a" }}>vs current deal @ {fmtPct(nCurrentRate)}</td>
                          </tr>
                          <tr>
                            <td>Annual saving</td>
                            <td style={{ color: monthlySaving > 0 ? "#3ad68a" : "#f06060", fontWeight: 600 }}>{fmt(Math.abs(annualSaving))}/yr</td>
                            <td style={{ color: "#5a7a9a" }}></td>
                          </tr>
                          <tr>
                            <td>Total switching costs</td>
                            <td style={{ color: "#f0a020", fontWeight: 600 }}>{fmt(switchingCosts)}</td>
                            <td style={{ color: "#5a7a9a" }}>Fees + ERC + legal</td>
                          </tr>
                          <tr>
                            <td>Break-even period</td>
                            <td style={{ fontWeight: 600, color: breakEven && breakEven <= 24 ? "#3ad68a" : "#f0a020" }}>{breakEven ? Math.ceil(breakEven) + " months" : "—"}</td>
                            <td style={{ color: "#5a7a9a" }}>{breakEven ? (breakEven <= 12 ? "Excellent" : breakEven <= 24 ? "Good" : "Think carefully") : "No saving"}</td>
                          </tr>
                          <tr>
                            <td>2-year net saving</td>
                            <td style={{ fontWeight: 600, color: annualSaving * 2 - switchingCosts > 0 ? "#3ad68a" : "#f06060" }}>{fmt(Math.abs(annualSaving * 2 - switchingCosts))}</td>
                            <td style={{ color: "#5a7a9a" }}>{annualSaving * 2 - switchingCosts > 0 ? "Net gain" : "Net cost"}</td>
                          </tr>
                          <tr>
                            <td>5-year net saving</td>
                            <td style={{ fontWeight: 600, color: annualSaving * 5 - switchingCosts > 0 ? "#3ad68a" : "#f06060" }}>{fmt(Math.abs(annualSaving * 5 - switchingCosts))}</td>
                            <td style={{ color: "#5a7a9a" }}>{annualSaving * 5 - switchingCosts > 0 ? "Net gain" : "Net cost"}</td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── DISCLAIMER FOOTER ── */}
      <div style={{ borderTop: "1px solid #1e3048", background: "#09141f", padding: isMobile ? "20px 18px" : "22px 28px", marginTop: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5a7a9a", fontWeight: 700, marginBottom: 8 }}>Important — Please Read</div>
          <p style={{ fontSize: 11, color: "#5a7a9a", lineHeight: 1.7, margin: 0 }}>
            MortgageDESK is an information and calculation tool only. It does not provide financial, mortgage, tax or legal advice, and nothing it produces is a recommendation to take out, switch, or vary any mortgage or financial product. All figures are estimates based on the information you enter and standard assumptions; they are not quotes or offers, and actual lender criteria, rates, fees and tax treatment will differ. Stamp Duty, tax rules and lender stress tests change over time and vary by individual circumstances and UK nation. Before making any decision you should speak to an FCA-authorised mortgage adviser and, where relevant, a qualified tax professional. Your home may be repossessed if you do not keep up repayments on your mortgage.
          </p>
          <div style={{ fontSize: 10, color: "#3a5570", marginTop: 12 }}>© {new Date().getFullYear()} MortgageDESK · For informational use only · Not regulated financial advice</div>
        </div>
      </div>
    </div>
  );
}
