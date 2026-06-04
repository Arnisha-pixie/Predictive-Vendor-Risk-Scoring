import os
import pickle
import sqlite3
from typing import Any, Dict, Tuple

import numpy as np
from flask import Blueprint, current_app, jsonify, request

try:
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None


predict_bp = Blueprint("predict", __name__)

FEATURE_ORDER = [
    "delay_rate",
    "defect_rate",
    "complaints",
    "contract_value",
    "performance_score",
]

# Map classifier labels to API risk categories and numeric scores for dashboard.
CLASS_TO_CATEGORY = {
    "High": "High Risk",
    "Medium": "Medium Risk",
    "Low": "Low Risk",
}

CLASS_SCORES = {
    "High": 90.0,
    "Medium": 65.0,
    "Low": 25.0,
}


def _db_path() -> str:
    return current_app.config["DATABASE_PATH"]


def _load_pickle(path: str) -> Any:
    with open(path, "rb") as f:
        return pickle.load(f)


def _load_model_and_scaler() -> Tuple[Any, Any]:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "model", "vendor_model.pkl")
    scaler_path = os.path.join(base_dir, "model", "scaler.pkl")

    if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
        return None, None

    try:
        model = _load_pickle(model_path)
        scaler = _load_pickle(scaler_path)
        return model, scaler
    except Exception:
        if joblib is None:
            return None, None
        try:
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            return model, scaler
        except Exception:
            return None, None


def _validate_payload(payload: Dict[str, Any]) -> Tuple[Dict[str, Any] | None, str | None]:
    for field in FEATURE_ORDER:
        if field not in payload:
            return None, f"Missing field: {field}"

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

    if data["delay_rate"] < 0 or data["defect_rate"] < 0:
        return None, "Invalid Input: rates cannot be negative"
    if data["complaints"] < 0:
        return None, "Invalid Input: complaints cannot be negative"
    if data["contract_value"] < 0:
        return None, "Invalid Input: contract_value cannot be negative"
    if not (0 <= data["performance_score"] <= 100):
        return None, "Invalid Input: performance_score must be 0..100"

    return data, None


def _fallback_prediction(
    delay_rate: float,
    defect_rate: float,
    complaints: int,
    contract_value: float,
    performance_score: float,
) -> Tuple[float, str]:
    score = (
        0.40 * delay_rate
        + 0.30 * defect_rate
        + 0.20 * (complaints * 2.0)
        + 0.10 * (100.0 - performance_score)
        + min(20.0, contract_value / 10000.0)
    )
    risk_score = float(np.clip(score, 0.0, 100.0))

    if risk_score >= 80:
        return risk_score, "High Risk"
    if risk_score >= 50:
        return risk_score, "Medium Risk"
    return risk_score, "Low Risk"


def _model_prediction(
    delay_rate: float,
    defect_rate: float,
    complaints: int,
    contract_value: float,
    performance_score: float,
) -> Tuple[float, str]:
    model, scaler = _load_model_and_scaler()
    if model is None or scaler is None:
        return _fallback_prediction(
            delay_rate, defect_rate, complaints, contract_value, performance_score
        )

    X = np.array(
        [[delay_rate, defect_rate, complaints, contract_value, performance_score]],
        dtype=float,
    )

    try:
        X_scaled = scaler.transform(X)
        predicted_class = model.predict(X_scaled)[0]
        category = CLASS_TO_CATEGORY.get(str(predicted_class), "Medium Risk")

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(X_scaled)[0]
            classes = list(model.classes_)
            risk_score = sum(
                prob * CLASS_SCORES.get(str(label), 50.0)
                for prob, label in zip(probabilities, classes)
            )
        else:
            risk_score = CLASS_SCORES.get(str(predicted_class), 50.0)

        return float(np.clip(risk_score, 0.0, 100.0)), category
    except Exception:
        return _fallback_prediction(
            delay_rate, defect_rate, complaints, contract_value, performance_score
        )


@predict_bp.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    data, err = _validate_payload(payload)
    if err:
        return jsonify({"error": err}), 400

    risk_score, category = _model_prediction(
        delay_rate=data["delay_rate"],
        defect_rate=data["defect_rate"],
        complaints=data["complaints"],
        contract_value=data["contract_value"],
        performance_score=data["performance_score"],
    )

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
