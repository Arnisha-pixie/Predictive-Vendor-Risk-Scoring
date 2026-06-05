import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Building2, FileText, Settings, Bell,
  AlertTriangle, CheckCircle, Search, Download, Shield,
  BarChart2, Zap, TrendingDown, Award, Clock, RefreshCw, Trash2
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from "recharts";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "http://127.0.0.1:5000";

const C = {
  primary: "#2563EB",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  bg: "#F1F5F9",
  navy: "#0D1421",
};

const RISK_HEX = { High: "#DC2626", Medium: "#D97706", Low: "#16A34A" };
const RISK_BG = { High: "#FEF2F2", Medium: "#FFFBEB", Low: "#F0FDF4" };
const RISK_BD = { High: "#FECACA", Medium: "#FDE68A", Low: "#BBF7D0" };

const card = {
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)",
};

const lbl = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const fallbackVendors = [
  { id: 1, vendor_name: "Apex Manufacturing", risk_score: 92, risk_category: "High Risk", category: "Manufacturing", compliance_status: "Non-Compliant", contract_status: "Active" },
  { id: 2, vendor_name: "Vertex Supplies Co.", risk_score: 88, risk_category: "High Risk", category: "Logistics", compliance_status: "Non-Compliant", contract_status: "Active" },
  { id: 3, vendor_name: "Orion Tech Parts", risk_score: 81, risk_category: "High Risk", category: "Technology", compliance_status: "At Risk", contract_status: "Active" },
  { id: 4, vendor_name: "Global Steel Corp", risk_score: 78, risk_category: "High Risk", category: "Materials", compliance_status: "At Risk", contract_status: "Under Review" },
  { id: 5, vendor_name: "Pacific Logistics", risk_score: 67, risk_category: "Medium Risk", category: "Logistics", compliance_status: "At Risk", contract_status: "Active" },
  { id: 6, vendor_name: "Northern Fab Ltd.", risk_score: 61, risk_category: "Medium Risk", category: "Manufacturing", compliance_status: "Compliant", contract_status: "Active" },
  { id: 7, vendor_name: "TechCore Systems", risk_score: 55, risk_category: "Medium Risk", category: "Technology", compliance_status: "Compliant", contract_status: "Active" },
  { id: 8, vendor_name: "SwiftShip Co.", risk_score: 48, risk_category: "Medium Risk", category: "Logistics", compliance_status: "Compliant", contract_status: "Active" },
  { id: 9, vendor_name: "Reliable Parts Inc.", risk_score: 24, risk_category: "Low Risk", category: "Manufacturing", compliance_status: "Compliant", contract_status: "Active" },
  { id: 10, vendor_name: "SwiftShip Logistics", risk_score: 18, risk_category: "Low Risk", category: "Logistics", compliance_status: "Compliant", contract_status: "Active" },
  { id: 11, vendor_name: "Precision Metals", risk_score: 12, risk_category: "Low Risk", category: "Materials", compliance_status: "Compliant", contract_status: "Active" },
  { id: 12, vendor_name: "EcoSupply Solutions", risk_score: 9, risk_category: "Low Risk", category: "Services", compliance_status: "Compliant", contract_status: "Active" },
];

const featureImp = [
  { feature: "Defect Rate", imp: 34 },
  { feature: "Delay Rate", imp: 28 },
  { feature: "Compliance Issues", imp: 19 },
  { feature: "Financial Score", imp: 12 },
  { feature: "Response Time", imp: 7 },
];

const catBreak = [
  { cat: "Manufact.", low: 40, med: 35, high: 25 },
  { cat: "Logistics", low: 50, med: 30, high: 20 },
  { cat: "Technology", low: 60, med: 25, high: 15 },
  { cat: "Materials", low: 45, med: 30, high: 25 },
  { cat: "Services", low: 70, med: 20, high: 10 },
];

const trendData = [
  { month: "Jan", high: 85, med: 155, low: 260 },
  { month: "Feb", high: 80, med: 158, low: 262 },
  { month: "Mar", high: 78, med: 152, low: 270 },
  { month: "Apr", high: 73, med: 148, low: 279 },
  { month: "May", high: 70, med: 150, low: 280 },
  { month: "Jun", high: 68, med: 149, low: 283 },
];

function riskLevelFromCategory(category) {
  if (!category) return "Low";
  const c = String(category).toLowerCase();
  if (c.includes("high")) return "High";
  if (c.includes("medium")) return "Medium";
  return "Low";
}

function normalizeVendor(v) {
  const risk = riskLevelFromCategory(v.risk_category || v.risk);
  const score = Number(v.risk_score ?? v.score ?? 0);
  return {
    id: v.id,
    vendor_name: v.vendor_name || v.name || "Unknown Vendor",
    risk_score: score,
    risk_category: v.risk_category || `${risk} Risk`,
    category: v.category || v.cat || "Uncategorized",
    compliance_status: v.compliance_status || v.comp || "Unknown",
    contract_status: v.contract_status || v.ctrt || "Unknown",
    trend: v.trend || "",
    raw: v,
  };
}

function RiskBadge({ level, large }) {
  return (
    <span
      style={{
        background: RISK_BG[level],
        color: RISK_HEX[level],
        border: `1px solid ${RISK_BD[level]}`,
        fontSize: large ? "15px" : "10px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: large ? "9px 22px" : "3px 9px",
        borderRadius: large ? "10px" : "5px",
        fontFamily: "'IBM Plex Mono',monospace",
        display: "inline-block",
      }}
    >
      {level.toUpperCase()} RISK
    </span>
  );
}

function AnimatedCount({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 55));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

function KPICard({ title, value, Icon, color, note }) {
  return (
    <div style={{ ...card, flex: 1, padding: "20px 22px", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ ...lbl, marginBottom: "12px" }}>{title}</p>
          <p style={{ fontSize: "30px", fontWeight: 800, color: "#111827", fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>
            <AnimatedCount target={value} />
          </p>
          {note && <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "7px" }}>{note}</p>}
        </div>
        <div style={{ background: `${color}18`, borderRadius: "10px", padding: "10px" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

function getRiskSummary(vendors) {
  const summary = { total: vendors.length, low: 0, medium: 0, high: 0 };
  for (const v of vendors) {
    const level = riskLevelFromCategory(v.risk_category);
    if (level === "High") summary.high += 1;
    else if (level === "Medium") summary.medium += 1;
    else summary.low += 1;
  }
  return summary;
}

function DashboardPage({ vendors, loading, refreshVendors }) {
  const summary = useMemo(() => getRiskSummary(vendors), [vendors]);
  const topRisk = useMemo(
    () =>
      [...vendors]
        .sort((a, b) => Number(b.risk_score) - Number(a.risk_score))
        .slice(0, 5)
        .map((v, idx) => ({
          id: v.id ?? idx,
          name: v.vendor_name,
          risk: riskLevelFromCategory(v.risk_category),
          score: Math.round(Number(v.risk_score || 0)),
          cat: v.category,
          trend: v.trend || (idx % 2 === 0 ? `+${idx + 1}` : `-${idx + 1}`),
        })),
    [vendors]
  );

  const alerts = useMemo(() => {
    const high = vendors.filter((v) => riskLevelFromCategory(v.risk_category) === "High").slice(0, 2);
    const medium = vendors.filter((v) => riskLevelFromCategory(v.risk_category) === "Medium").slice(0, 2);
    const out = [];
    high.forEach((v, i) =>
      out.push({
        id: `h-${i}`,
        vendor: v.vendor_name,
        msg: `Risk score is ${Math.round(Number(v.risk_score || 0))}`,
        type: "danger",
        time: "recent",
      })
    );
    medium.forEach((v, i) =>
      out.push({
        id: `m-${i}`,
        vendor: v.vendor_name,
        msg: `Risk category is ${v.risk_category}`,
        type: "warning",
        time: "recent",
      })
    );
    return out.length
      ? out
      : [
          { id: 1, vendor: "No active alerts", msg: "All vendors are below the alert threshold", type: "warning", time: "now" },
        ];
  }, [vendors]);

  const riskDist = useMemo(() => ([
    { name: "Low Risk", value: summary.low, color: "#16A34A" },
    { name: "Medium Risk", value: summary.medium, color: "#F59E0B" },
    { name: "High Risk", value: summary.high, color: "#DC2626" },
  ]), [summary]);

  const CustomTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "9px 14px", fontSize: "12px", fontWeight: 600, color: "#374151", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        {payload[0].name}: {payload[0].value?.toLocaleString()}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <KPICard title="Total Vendors" value={summary.total} Icon={Building2} color="#2563EB" note="Across all categories" />
        <KPICard title="Low Risk" value={summary.low} Icon={CheckCircle} color="#16A34A" note="Supplier base is healthy" />
        <KPICard title="Medium Risk" value={summary.medium} Icon={AlertTriangle} color="#D97706" note="Monitor for drift" />
        <KPICard title="High Risk" value={summary.high} Icon={Shield} color="#DC2626" note="Requires immediate action" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px" }}>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>Risk Distribution</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "4px" }}>How risky is our supplier ecosystem?</p>
          <div style={{ height: "230px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={68} outerRadius={95} paddingAngle={3} dataKey="value">
                  {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ ...card, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>Top Risk Vendors</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Immediate action required</p>
            </div>
            <button
              onClick={refreshVendors}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #E5E7EB",
                background: "#fff",
                borderRadius: "10px",
                padding: "7px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "28px 0", color: "#6B7280", fontSize: "13px" }}>Loading vendors…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["VENDOR", "CATEGORY", "RISK LEVEL", "SCORE", "TREND"].map((h) => (
                    <th key={h} style={{ ...lbl, padding: "0 0 10px", textAlign: "left", borderBottom: "2px solid #F3F4F6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRisk.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: "11px 0", fontSize: "13px", fontWeight: 600, color: "#111827", borderBottom: "1px solid #F9FAFB" }}>{v.name}</td>
                    <td style={{ padding: "11px 0", fontSize: "12px", color: "#6B7280", borderBottom: "1px solid #F9FAFB" }}>{v.cat}</td>
                    <td style={{ padding: "11px 0", borderBottom: "1px solid #F9FAFB" }}><RiskBadge level={v.risk} /></td>
                    <td style={{ padding: "11px 0", fontSize: "16px", fontWeight: 800, color: RISK_HEX[v.risk], fontFamily: "'IBM Plex Mono',monospace", borderBottom: "1px solid #F9FAFB" }}>{v.score}</td>
                    <td style={{ padding: "11px 0", fontSize: "12px", fontWeight: 700, color: String(v.trend).startsWith("+") ? "#DC2626" : "#16A34A", fontFamily: "'IBM Plex Mono',monospace", borderBottom: "1px solid #F9FAFB" }}>{v.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px" }}>
        <div style={{ ...card, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Recent Alerts</p>
            <span style={{ background: "#FEF2F2", color: "#DC2626", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "12px" }}>
              {alerts.filter((a) => a.type === "danger").length} CRITICAL
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: "10px", padding: "11px 12px", borderRadius: "8px", background: a.type === "danger" ? "#FFF5F5" : "#FFFBEB", borderLeft: `3px solid ${a.type === "danger" ? "#DC2626" : "#F59E0B"}` }}>
                <AlertTriangle size={13} color={a.type === "danger" ? "#DC2626" : "#D97706"} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{a.vendor}</p>
                  <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{a.msg}</p>
                </div>
                <span style={{ fontSize: "10px", color: "#9CA3AF", flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>6-Month Risk Trend</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>Supplier risk evolution over time</p>
          <div style={{ height: "210px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#16A34A" fill="#DCFCE7" strokeWidth={2} name="Low Risk" />
                <Area type="monotone" dataKey="med" stackId="1" stroke="#F59E0B" fill="#FEF3C7" strokeWidth={2} name="Medium Risk" />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#DC2626" fill="#FEE2E2" strokeWidth={2} name="High Risk" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorsPage({ vendors, loading, onRefresh, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const shown = useMemo(() => {
    return vendors.filter((v) => {
      const level = riskLevelFromCategory(v.risk_category);
      const matchesRisk = filter === "All" || level === filter;
      const matchesSearch = String(v.vendor_name || "").toLowerCase().includes(search.toLowerCase());
      return matchesRisk && matchesSearch;
    });
  }, [vendors, search, filter]);

  const compColor = (c) => c === "Compliant" ? "#16A34A" : c === "At Risk" ? "#D97706" : "#DC2626";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Vendor Explorer</p>
          <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Search and analyze your supplier network</p>
        </div>
        <button
          onClick={onRefresh}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid #E5E7EB",
            background: "#fff",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh from API
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", borderRadius: "10px", padding: "10px 16px", flex: 1, minWidth: "200px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors by name..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", color: "#111827", flex: 1, fontFamily: "inherit" }}
          />
        </div>
        {["All", "High", "Medium", "Low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: `2px solid ${filter === f ? (f === "All" ? "#2563EB" : RISK_HEX[f]) : "#E5E7EB"}`,
              background: filter === f ? (f === "All" ? "#EFF6FF" : RISK_BG[f]) : "#fff",
              color: filter === f ? (f === "All" ? "#2563EB" : RISK_HEX[f]) : "#6B7280",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...card, padding: "80px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#6B7280" }}>Loading vendors…</p>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ ...card, padding: "80px", textAlign: "center" }}>
          <Search size={40} color="#E5E7EB" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#6B7280" }}>No vendors found</p>
          <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "6px" }}>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {shown.map((v) => {
            const risk = riskLevelFromCategory(v.risk_category);
            return (
              <div
                key={v.id}
                style={{ ...card, padding: "20px", borderLeft: `4px solid ${RISK_HEX[risk]}`, transition: "transform 0.15s,box-shadow 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.07)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${RISK_HEX[risk]}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={18} color={RISK_HEX[risk]} />
                  </div>
                  <RiskBadge level={risk} />
                </div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>{v.vendor_name}</p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>{v.category}</p>
                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <p style={{ ...lbl, marginBottom: "4px" }}>SCORE</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: RISK_HEX[risk], fontFamily: "'IBM Plex Mono',monospace" }}>{Math.round(Number(v.risk_score || 0))}</p>
                  </div>
                  <div>
                    <p style={{ ...lbl, marginBottom: "4px" }}>COMPLIANCE</p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: compColor(v.compliance_status) }}>{v.compliance_status}</p>
                  </div>
                  <div>
                    <p style={{ ...lbl, marginBottom: "4px" }}>CONTRACT</p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{v.contract_status}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button
                    onClick={async () => onDelete(v.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "1px solid #FECACA",
                      background: "#FFF5F5",
                      color: "#DC2626",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PredictPage() {
  const [vendorName, setVendorName] = useState("New Vendor");
  const [form, setForm] = useState({ defectRate: 5, delayRate: 10, compIssues: 1, finScore: 75, respTime: 2, contractValue: 500000 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predict = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError("");

      const payload = {
        vendor_name: vendorName.trim() || "New Vendor",
        defect_rate: Number(form.defectRate),
        delay_rate: Number(form.delayRate),
        complaints: Number(form.compIssues),
        contract_value: Number(form.contractValue),
        performance_score: Number(form.finScore),
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      const level = riskLevelFromCategory(data.risk_category) || "Medium";
      const score = Math.round(Number(data.risk_score ?? 0));

      const drivers = [];
      if (form.defectRate > 10) drivers.push(`High defect rate (${form.defectRate}%)`);
      if (form.delayRate > 20) drivers.push(`Frequent delivery delays (${form.delayRate}%)`);
      if (form.compIssues >= 3) drivers.push(`Multiple complaints (${form.compIssues})`);
      if (form.finScore < 50) drivers.push(`Low performance score (${form.finScore})`);
      if (form.respTime > 4) drivers.push(`Slow response time (${form.respTime} days avg.)`);
      if (!drivers.length) drivers.push("No major risk drivers identified");

      const recs = level === "High"
        ? [
            "Conduct supplier audit",
            "Increase monitoring",
            "Review SLA terms",
            "Prepare backup supplier",
          ]
        : level === "Medium"
          ? [
              "Quarterly review",
              "Monitor KPI trends",
              "Verify compliance status",
            ]
          : [
              "Maintain normal monitoring",
              "Consider preferred supplier status",
            ];

      setResult({
        level,
        score,
        conf: data.confidence ?? 95,
        drivers,
        recs,
        saved: true,
      });
    } catch (err) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  function Slider({ label, field, min, max, unit, desc }) {
    return (
      <div style={{ marginBottom: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <label style={{ ...lbl }}>{label}</label>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#2563EB", fontFamily: "'IBM Plex Mono',monospace" }}>
            {form[field]}{unit}
          </span>
        </div>
        {desc && <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "7px" }}>{desc}</p>}
        <input
          type="range"
          min={min}
          max={max}
          value={form[field]}
          onChange={(e) => setForm((p) => ({ ...p, [field]: Number(e.target.value) }))}
          style={{ width: "100%", accentColor: "#2563EB" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", color: "#D1D5DB" }}>{min}{unit}</span>
          <span style={{ fontSize: "10px", color: "#D1D5DB" }}>{max}{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Risk Prediction Engine</p>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Predict vendor risk using the Flask model API</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        <div style={{ ...card, padding: "28px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Vendor Metrics</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "24px" }}>Adjust sliders to match vendor performance data</p>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ ...lbl, display: "block", marginBottom: "6px" }}>Vendor Name</label>
            <input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Vendor name"
              style={{
                width: "100%",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                color: "#111827",
              }}
            />
          </div>

          <Slider label="Defect Rate" field="defectRate" min={0} max={25} unit="%" desc="% of products failing quality checks" />
          <Slider label="Delivery Delay Rate" field="delayRate" min={0} max={50} unit="%" desc="% of shipments arriving late" />
          <Slider label="Compliance Issues" field="compIssues" min={0} max={10} unit="" desc="Violations in the last 12 months" />
          <Slider label="Financial Health" field="finScore" min={0} max={100} unit="" desc="Composite score (100 = excellent)" />
          <Slider label="Avg. Response Time" field="respTime" min={1} max={10} unit=" days" desc="Days to respond to critical inquiries" />
          <Slider label="Contract Value" field="contractValue" min={10000} max={2000000} unit="" desc="Approximate contract value in dollars" />

          <button
            onClick={predict}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#93C5FD" : "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            <Zap size={16} />
            {loading ? "Analyzing vendor data..." : "Predict Risk"}
          </button>

          {error && (
            <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "10px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "13px" }}>
              {error}
            </div>
          )}
        </div>

        <div>
          {!result && !loading && (
            <div style={{ ...card, padding: "80px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Zap size={44} color="#E5E7EB" style={{ marginBottom: "16px" }} />
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#6B7280" }}>No Prediction Generated</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "8px", maxWidth: "220px", lineHeight: 1.6 }}>
                Configure vendor metrics and click Predict Risk to call the backend model
              </p>
            </div>
          )}

          {loading && (
            <div style={{ ...card, padding: "80px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", animation: "spin 0.8s linear infinite", marginBottom: "16px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>Running predictive model…</p>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ ...card, padding: "28px", background: RISK_BG[result.level], border: `2px solid ${RISK_BD[result.level]}`, textAlign: "center" }}>
                <p style={{ ...lbl, marginBottom: "14px" }}>PREDICTION RESULT</p>
                <RiskBadge level={result.level} large />
                <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "22px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ ...lbl, marginBottom: "6px" }}>RISK SCORE</p>
                    <p style={{ fontSize: "34px", fontWeight: 800, color: RISK_HEX[result.level], fontFamily: "'IBM Plex Mono',monospace" }}>{result.score}</p>
                  </div>
                  <div>
                    <p style={{ ...lbl, marginBottom: "6px" }}>CONFIDENCE</p>
                    <p style={{ fontSize: "34px", fontWeight: 800, color: "#2563EB", fontFamily: "'IBM Plex Mono',monospace" }}>{result.conf}%</p>
                  </div>
                </div>
                {result.saved && (
                  <p style={{ marginTop: "12px", fontSize: "12px", color: "#6B7280" }}>
                    Saved to the backend database
                  </p>
                )}
              </div>

              <div style={{ ...card, padding: "20px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>Main Risk Drivers</p>
                {result.drivers.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: RISK_HEX[result.level], marginTop: "5px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#374151" }}>{d}</p>
                  </div>
                ))}
              </div>

              <div style={{ ...card, padding: "20px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>Recommended Actions</p>
                {result.recs.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <CheckCircle size={14} color="#16A34A" style={{ marginTop: "1px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#374151" }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage({ vendors }) {
  const fColors = ["#DC2626", "#F59E0B", "#7C3AED", "#2563EB", "#16A34A"];
  const byLevel = useMemo(() => getRiskSummary(vendors), [vendors]);

  const best = useMemo(
    () =>
      [...vendors]
        .sort((a, b) => Number(a.risk_score) - Number(b.risk_score))
        .slice(0, 5)
        .map((v, idx) => ({
          rank: idx + 1,
          name: v.vendor_name,
          score: Math.round(Number(v.risk_score || 0)),
          cat: v.category,
          medal: idx === 0 ? "#F59E0B" : idx === 1 ? "#94A3B8" : idx === 2 ? "#CD7C2F" : null,
        })),
    [vendors]
  );

  const catData = useMemo(() => {
    const map = new Map();
    vendors.forEach((v) => {
      const cat = v.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, { cat, low: 0, med: 0, high: 0 });
      const item = map.get(cat);
      const level = riskLevelFromCategory(v.risk_category);
      if (level === "High") item.high += 1;
      else if (level === "Medium") item.med += 1;
      else item.low += 1;
    });
    const arr = Array.from(map.values()).slice(0, 5);
    return arr.length ? arr : catBreak;
  }, [vendors]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ marginBottom: "4px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Analytics</p>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Strategic supplier risk intelligence</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px" }}>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>What Drives Risk?</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>Feature importance from predictive model</p>
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureImp} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="feature" type="category" width={130} tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB" horizontal={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Importance"]} />
                <Bar dataKey="imp" radius={[0, 6, 6, 0]}>
                  {featureImp.map((_, i) => <Cell key={i} fill={fColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>Best Performers</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>Lowest risk vendors in network</p>
          {best.map((v) => (
            <div key={v.rank} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 14px", borderRadius: "10px", marginBottom: "8px", background: v.rank <= 3 ? "#F8FAFC" : "transparent", border: `1px solid ${v.rank <= 3 ? "#E5E7EB" : "transparent"}` }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: v.medal ? `${v.medal}20` : "transparent", color: v.medal || "#9CA3AF", fontWeight: 800, fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>{v.rank}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{v.name}</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>{v.cat}</p>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#16A34A", fontFamily: "'IBM Plex Mono',monospace" }}>{v.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: "24px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>Risk by Vendor Category</p>
        <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>How does risk vary across supplier categories?</p>
        <div style={{ height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData} margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="cat" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip />
              <Legend formatter={(v) => <span style={{ fontSize: "12px", color: "#374151" }}>{v === "low" ? "Low" : v === "med" ? "Medium" : "High"} Risk</span>} />
              <Bar dataKey="low" name="low" stackId="a" fill="#16A34A" />
              <Bar dataKey="med" name="med" stackId="a" fill="#F59E0B" />
              <Bar dataKey="high" name="high" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...card, padding: "24px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>Network Risk Snapshot</p>
        <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>Current portfolio summary</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div style={{ padding: "16px", border: "1px solid #E5E7EB", borderRadius: "10px" }}>
            <p style={lbl}>HIGH RISK</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: "#DC2626", fontFamily: "'IBM Plex Mono',monospace" }}>{byLevel.high}</p>
          </div>
          <div style={{ padding: "16px", border: "1px solid #E5E7EB", borderRadius: "10px" }}>
            <p style={lbl}>MEDIUM RISK</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: "#D97706", fontFamily: "'IBM Plex Mono',monospace" }}>{byLevel.medium}</p>
          </div>
          <div style={{ padding: "16px", border: "1px solid #E5E7EB", borderRadius: "10px" }}>
            <p style={lbl}>LOW RISK</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: "#16A34A", fontFamily: "'IBM Plex Mono',monospace" }}>{byLevel.low}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  const reports = [
    { title: "Vendor Risk Report", desc: "Comprehensive risk scores for all vendors with trend analysis", Icon: Shield, color: "#DC2626", updated: "Today, 09:00 AM" },
    { title: "Compliance Report", desc: "Compliance status, certificate expiry, and violation history", Icon: CheckCircle, color: "#16A34A", updated: "Today, 08:30 AM" },
    { title: "Supplier Ranking Report", desc: "Vendor performance leaderboard ranked by composite risk score", Icon: Award, color: "#F59E0B", updated: "Yesterday" },
    { title: "SLA Performance Report", desc: "Delivery performance, delay rates, and SLA breach summary", Icon: Clock, color: "#7C3AED", updated: "Yesterday" },
    { title: "Financial Risk Report", desc: "Vendor financial health scores and early warning indicators", Icon: TrendingDown, color: "#2563EB", updated: "Jun 3, 2026" },
    { title: "Category Risk Summary", desc: "Risk distribution breakdown by supplier category and subcategory", Icon: BarChart2, color: "#0EA5E9", updated: "Jun 2, 2026" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Reports</p>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Export and share procurement intelligence</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
        {reports.map((r, i) => (
          <div
            key={i}
            style={{ ...card, padding: "24px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <r.Icon size={20} color={r.color} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>{r.title}</p>
            <p style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.6, flex: 1 }}>{r.desc}</p>
            <div style={{ borderTop: "1px solid #F3F4F6", marginTop: "16px", paddingTop: "14px" }}>
              <p style={{ ...lbl, marginBottom: "10px" }}>UPDATED {r.updated.toUpperCase()}</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["CSV", "Excel", "PDF"].map((fmt) => (
                  <button key={fmt} style={{ padding: "5px 11px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit" }}>
                    <Download size={9} /> {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const [tog, setTog] = useState({ email: true, weekly: true, realtime: false });
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>Settings</p>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Configure dashboard preferences and data integrations</p>
      </div>
      <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>Alert Thresholds</p>
          {[
            { l: "Defect Rate Alert Threshold", v: "12%" },
            { l: "Delay Rate Alert Threshold", v: "20%" },
            { l: "Compliance Issue Alert Level", v: "3" },
            { l: "Financial Score Warning Level", v: "50" },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", marginBottom: i < arr.length - 1 ? "14px" : 0 }}>
              <p style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{s.l}</p>
              <input defaultValue={s.v} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#111827", outline: "none", fontFamily: "'IBM Plex Mono',monospace", width: "80px", textAlign: "center" }} />
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>Notification Preferences</p>
          {[
            { key: "email", l: "Email alerts for High Risk vendors" },
            { key: "weekly", l: "Weekly summary reports" },
            { key: "realtime", l: "Real-time SLA breach notifications" },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", marginBottom: i < arr.length - 1 ? "14px" : 0 }}>
              <p style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{s.l}</p>
              <div onClick={() => setTog((t) => ({ ...t, [s.key]: !t[s.key] }))} style={{ width: "40px", height: "22px", borderRadius: "11px", background: tog[s.key] ? "#2563EB" : "#D1D5DB", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: "16px", height: "16px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: tog[s.key] ? "21px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: "24px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Data Integration</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>Connect real datasets and ML models through the Flask backend</p>
          {[
            { l: "Vendor Dataset Source", v: "Live API → /vendors" },
            { l: "ML Model", v: "Live API → /predict" },
            { l: "Database", v: "SQLite → database.db" },
          ].map((s, i, arr) => (
            <div key={i} style={{ paddingBottom: "14px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", marginBottom: i < arr.length - 1 ? "14px" : 0 }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{s.l}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "'IBM Plex Mono',monospace", background: "#F8FAFC", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>{s.v}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ padding: "12px 24px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save Settings</button>
          <button style={{ padding: "12px 24px", background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reset Defaults</button>
        </div>
      </div>
    </div>
  );
}

export default function VendorRiskDashboard() {
  const [page, setPage] = useState("dashboard");
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`;
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  const loadVendors = async () => {
    setLoadingVendors(true);
    setApiError("");
    try {
      const res = await fetch(`${API_URL}/vendors`);
      if (!res.ok) throw new Error(`Failed to load vendors (${res.status})`);
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizeVendor) : [];
      setVendors(normalized.length ? normalized : fallbackVendors.map(normalizeVendor));
    } catch (err) {
      setApiError(err.message || "Unable to reach backend");
      setVendors(fallbackVendors.map(normalizeVendor));
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const deleteVendor = async (id) => {
    try {
      const res = await fetch(`${API_URL}/vendor/${id}`, { method: "DELETE" });
      if (!res.ok) {
        let body = {};
        try {
          body = await res.json();
        } catch {}
        throw new Error(body.error || "Delete failed");
      }
      await loadVendors();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "vendors", label: "Vendors", Icon: Building2 },
    { id: "predict", label: "Predict Risk", Icon: Zap },
    { id: "analytics", label: "Analytics", Icon: BarChart2 },
    { id: "reports", label: "Reports", Icon: FileText },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  const titles = {
    dashboard: "Dashboard",
    vendors: "Vendor Explorer",
    predict: "Risk Prediction",
    analytics: "Analytics",
    reports: "Reports",
    settings: "Settings",
  };

  return (
    <div style={{ fontFamily: "'Sora',sans-serif" }}>
      <aside style={{ width: "220px", height: "100vh", background: "linear-gradient(180deg,#0D1421 0%,#111827 100%)", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #ffffff08" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={16} color="#fff" />
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>VendorGuard</p>
              <p style={{ color: "#4B5563", fontSize: "10px" }}>Risk Intelligence</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" }} />
            <span style={{ fontSize: "10px", color: "#4B5563", fontWeight: 500 }}>System Online</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#374151", letterSpacing: "0.1em", padding: "0 8px", marginBottom: "8px", marginTop: "4px" }}>NAVIGATION</p>
          {nav.map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: active ? "#2563EB18" : "transparent",
                  color: active ? "#60A5FA" : "#6B7280",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  marginBottom: "2px",
                  borderLeft: `3px solid ${active ? "#2563EB" : "transparent"}`,
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff08" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>PM</span>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>Proc. Manager</p>
              <p style={{ color: "#4B5563", fontSize: "10px" }}>admin@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ marginLeft: "220px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: "56px", background: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", boxShadow: "0 1px 0 #E5E7EB", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#9CA3AF" }}>VendorGuard</span>
            <span style={{ color: "#D1D5DB" }}>/</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{titles[page]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={loadVendors}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #E5E7EB",
                background: "#fff",
                borderRadius: "10px",
                padding: "7px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Sync
            </button>
            <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Live API</span>
            <div style={{ position: "relative" }}>
              <Bell size={18} color="#6B7280" style={{ cursor: "pointer" }} />
              <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", background: "#DC2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", color: "#fff", fontWeight: 700 }}>{Math.min(9, vendors.filter((v) => riskLevelFromCategory(v.risk_category) === "High").length || 0)}</span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", background: "#F1F5F9", padding: "28px 32px" }}>
          {apiError && (
            <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", fontSize: "13px" }}>
              Backend warning: {apiError}. Showing fallback data.
            </div>
          )}

          {page === "dashboard" && <DashboardPage vendors={vendors} loading={loadingVendors} refreshVendors={loadVendors} />}
          {page === "vendors" && <VendorsPage vendors={vendors} loading={loadingVendors} onRefresh={loadVendors} onDelete={deleteVendor} />}
          {page === "predict" && <PredictPage />}
          {page === "analytics" && <AnalyticsPage vendors={vendors} />}
          {page === "reports" && <ReportsPage />}
          {page === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
