# VendorIQ — Frontend

Pure HTML + CSS + JS frontend for the Predictive Vendor Risk Scoring backend.
**No build step. No npm. No JSX. Just open and run.**

## File structure

```
vendoriq-frontend/
├── index.html          ← Entry point (open this in a browser)
├── css/
│   └── style.css       ← Full design system + dark theme
├── js/
│   ├── core.js         ← API client, router, state, toast, helpers
│   └── pages.js        ← All 4 page renderers + chart logic
└── README.md
```

## Setup

### 1. Start the Flask backend
```bash
cd Predictive-Vendor-Risk-Scoring-main
pip install -r requirements.txt
python train_model.py      # only needed once — trains + saves model .pkl files
python app.py              # starts on http://127.0.0.1:5000
```

### 2. Serve the frontend
Option A — just open the file:
```
Open vendoriq-frontend/index.html in your browser
```

Option B — serve locally (avoids any CORS quirks):
```bash
cd vendoriq-frontend
python -m http.server 8080
# then visit http://localhost:8080
```

## Pages

| Page | Route | API calls |
|------|-------|-----------|
| Dashboard | `#dashboard` | `GET /vendors` |
| All Vendors | `#vendors` | `GET /vendors`, `DELETE /vendor/:id` |
| Predict Risk | `#predict` | `POST /predict` |
| API Reference | `#docs` | — (static) |

## How it connects to the backend

All API calls go to `http://127.0.0.1:5000` (defined as `API` in `js/core.js`).
Change that constant if your Flask server runs on a different host/port.

The sidebar API dot pulses green when the backend is reachable (polls `GET /health` every 12s).
