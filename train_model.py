"""
Train vendor risk model from procurement dataset.
Run from project root: python train_model.py
"""
import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "Procurement KPI Analysis Dataset.csv"
MODEL_DIR = BASE_DIR / "model"

FEATURE_COLUMNS = [
    "delay_rate",
    "defect_rate",
    "complaints",
    "contract_value",
    "performance_score",
]


def create_complaints(defect_rate: float) -> int:
    if defect_rate > 15:
        return 5
    if defect_rate > 8:
        return 3
    return 1


def calculate_performance(row: pd.Series) -> float:
    score = 100.0
    score -= row["defect_rate"] * 1.5
    score -= row["delay_rate"] * 1.0
    if str(row["Compliance"]).lower() == "non-compliant":
        score -= 20
    return max(0.0, min(100.0, score))


def create_risk(row: pd.Series) -> str:
    if (
        row["defect_rate"] > 15
        or row["delay_rate"] > 15
        or row["performance_score"] < 50
    ):
        return "High"
    if (
        row["defect_rate"] > 5
        or row["delay_rate"] > 7
        or row["performance_score"] < 80
    ):
        return "Medium"
    return "Low"


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["Order_Date"] = pd.to_datetime(df["Order_Date"], errors="coerce")
    df["Delivery_Date"] = pd.to_datetime(df["Delivery_Date"], errors="coerce")

    df["delay_rate"] = (df["Delivery_Date"] - df["Order_Date"]).dt.days
    df["defect_rate"] = (df["Defective_Units"] / df["Quantity"]) * 100
    df["contract_value"] = df["Quantity"] * df["Negotiated_Price"]
    df["complaints"] = df["defect_rate"].apply(create_complaints)
    df["performance_score"] = df.apply(calculate_performance, axis=1)
    df["risk_level"] = df.apply(create_risk, axis=1)

    df = df.dropna(subset=FEATURE_COLUMNS + ["risk_level"])
    return df


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    df = build_features(df)

    X = df[FEATURE_COLUMNS]
    y = df["risk_level"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_DIR / "vendor_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(MODEL_DIR / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    print("\nSaved:")
    print(f"  {MODEL_DIR / 'vendor_model.pkl'}")
    print(f"  {MODEL_DIR / 'scaler.pkl'}")


if __name__ == "__main__":
    main()
