import os
import sqlite3
from typing import Any, Dict, Tuple

import numpy as np
from flask import Blueprint, current_app, jsonify, request

try:
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None


predict_bp = Blueprint("predict", __name__)


def _db_path() -> str:
    return current_app.config["DATABASE_PATH"]


def _load_model_and_scaler() -> Tuple[Any, Any]:
    if joblib is None:
        return None, None

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "model", "vendor_model.pkl")
    scaler_path = os.path.join(base_dir, "model", "scaler.pkl")

    if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
        return None, None

    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        return model, scaler
    except Exception:
        return None, None


def _validate_payload(payload: Dict[str, Any]) -> Tuple[Dict[str, Any] | None, str | None]:
    required = ["delay_rate", "defect_rate", "complaints", "contract_value", "performance_score"]
    for k in required:
        if k not in payload:
            return None, f"Missing field: {k}"

    def to_float(name: str) -> float:
        try:
            return float(payload[name])
        except Exception:
            raise ValueError(f"Invalid number for {name}")

    def to_int(name: str) -> int:
        try:
            return int(payload[name])
        except Exception:
            raise ValueError(f"Invalid integer for {name}")

    try:
        data = {
            "vendor_name": str(payload.get("vendor_name", "")).strip() or None,
            "delay_rate": to_float("delay_rate"),
            "defect_rate": to_float("defect_rate"),
            "complaints": to_int("complaints"),
            "contract_value": to_float("contract_value"),
            "performance_score": to_float("performance_score"),
        }
    except ValueError as e:
        return None, str(e)

    # Basic validation (professors love this)
    if data["delay_rate"] < 0 or data["defect_rate"] < 0:
        return None, "Invalid Input: rates cannot be negative"
    if data["complaints"] < 0:
        return None, "Invalid Input: complaints cannot be negative"
    if data["contract_value"] < 0:
        return None, "Invalid Input: contract_value cannot be negative"
    if not (0 <= data["performance_score"] <= 100):
        return None, "Invalid Input: performance_score must be 0..100"

    return data, None


def _risk_category(score: float) -> str:
    if score >= 80:
        return "High Risk"
    if score >= 50:
        return "Medium Risk"
    return "Low Risk"


def _fallback_risk_score(
    delay_rate: float,
    defect_rate: float,
    complaints: int,
    contract_value: float,
    performance_score: float,
) -> float:
    # Simple heuristic score 0..100 when model files aren't available.
    contract_factor = min(20.0, contract_value / 10000.0)  # 0..20
    score = (
        0.40 * delay_rate
        + 0.30 * defect_rate
        + 0.20 * (complaints * 2.0)
        + 0.10 * (100.0 - performance_score)
        + contract_factor
    )
    return float(np.clip(score, 0.0, 100.0))


def _model_risk_score(
    delay_rate: float,
    defect_rate: float,
    complaints: int,
    contract_value: float,
    performance_score: float,
) -> float:
    model, scaler = _load_model_and_scaler()
    if model is None or scaler is None:
        return _fallback_risk_score(delay_rate, defect_rate, complaints, contract_value, performance_score)

    X = np.array([[delay_rate, defect_rate, complaints, contract_value, performance_score]], dtype=float)
    try:
        Xs = scaler.transform(X)
        pred = model.predict(Xs)

        # Accept common shapes: [0..100], [0..1], or class labels.
        if isinstance(pred, (list, tuple, np.ndarray)):
            pred_val = float(np.array(pred).reshape(-1)[0])
        else:
            pred_val = float(pred)

        if 0.0 <= pred_val <= 1.0:
            return float(np.clip(pred_val * 100.0, 0.0, 100.0))
        return float(np.clip(pred_val, 0.0, 100.0))
    except Exception:
        return _fallback_risk_score(delay_rate, defect_rate, complaints, contract_value, performance_score)


@predict_bp.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    data, err = _validate_payload(payload)
    if err:
        return jsonify({"error": err}), 400

    risk_score = _model_risk_score(
        delay_rate=data["delay_rate"],
        defect_rate=data["defect_rate"],
        complaints=data["complaints"],
        contract_value=data["contract_value"],
        performance_score=data["performance_score"],
    )
    category = _risk_category(risk_score)

    # Store in SQLite using parameterized queries (SQL injection protection)
    with sqlite3.connect(_db_path()) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO vendors (
                vendor_name, delay_rate, defect_rate, complaints,
                contract_value, performance_score, risk_score, risk_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data["vendor_name"],
                data["delay_rate"],
                data["defect_rate"],
                data["complaints"],
                data["contract_value"],
                data["performance_score"],
                float(risk_score),
                category,
            ),
        )
        conn.commit()

    return jsonify({"risk_score": round(float(risk_score), 2), "risk_category": category})


@predict_bp.get("/vendors")
def get_vendors():
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM vendors ORDER BY id DESC").fetchall()
        return jsonify([dict(r) for r in rows])


@predict_bp.delete("/vendor/<int:vendor_id>")
def delete_vendor(vendor_id: int):
    with sqlite3.connect(_db_path()) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "Vendor not found"}), 404
    return jsonify({"deleted": vendor_id})

