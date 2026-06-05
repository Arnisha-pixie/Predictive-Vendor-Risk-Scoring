import React, { useEffect, useMemo, useState } from "react";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://127.0.0.1:5000";

export default function VendorRiskDashboard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const [form, setForm] = useState({
    vendor_name: "",
    delay_rate: 10,
    defect_rate: 5,
    complaints: 1,
    contract_value: 500000,
    performance_score: 80,
  });

  const [prediction, setPrediction] = useState(null);

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vendors`);
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function predict() {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Prediction failed");
      return;
    }

    setPrediction(data);
    loadVendors();
  }

  async function deleteVendor(id) {
    await fetch(`${API_URL}/vendor/${id}`, {
      method: "DELETE",
    });

    loadVendors();
  }

  const stats = useMemo(() => {
    const total = vendors.length;
    const high = vendors.filter(v => v.risk_category === "High Risk").length;
    const medium = vendors.filter(v => v.risk_category === "Medium Risk").length;
    const low = vendors.filter(v => v.risk_category === "Low Risk").length;

    return { total, high, medium, low };
  }, [vendors]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Vendor Risk Dashboard (Connected)</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("predict")}>Predict</button>
        <button onClick={() => setTab("vendors")}>Vendors</button>
      </div>

      {tab === "dashboard" && (
        <div>
          <h2>Live Dashboard</h2>
          <p>Total Vendors: {stats.total}</p>
          <p>High Risk: {stats.high}</p>
          <p>Medium Risk: {stats.medium}</p>
          <p>Low Risk: {stats.low}</p>
        </div>
      )}

      {tab === "predict" && (
        <div>
          <h2>Predict Risk</h2>

          {Object.keys(form).map((k) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <label>{k}</label><br/>
              <input
                value={form[k]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [k]:
                      k === "vendor_name"
                        ? e.target.value
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          ))}

          <button onClick={predict}>Predict</button>

          {prediction && (
            <div style={{ marginTop: 20 }}>
              <h3>Result</h3>
              <p>Risk Score: {prediction.risk_score}</p>
              <p>Category: {prediction.risk_category}</p>
            </div>
          )}
        </div>
      )}

      {tab === "vendors" && (
        <div>
          <h2>Live Vendors</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Risk Score</th>
                  <th>Category</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.vendor_name}</td>
                    <td>{v.risk_score}</td>
                    <td>{v.risk_category}</td>
                    <td>
                      <button onClick={() => deleteVendor(v.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
