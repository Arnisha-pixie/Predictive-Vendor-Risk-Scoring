import os
import sqlite3

from flask import Flask, jsonify
from flask_cors import CORS

from routes.predict import predict_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.config["DATABASE_PATH"] = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "database.db"
    )

    init_db(app.config["DATABASE_PATH"])
    app.register_blueprint(predict_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not found"}), 404

    return app


def init_db(db_path: str) -> None:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS vendors(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_name TEXT,
                delay_rate REAL,
                defect_rate REAL,
                complaints INTEGER,
                contract_value REAL,
                performance_score REAL,
                risk_score REAL,
                risk_category TEXT
            );
            """
        )
        conn.commit()


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)

