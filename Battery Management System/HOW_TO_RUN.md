# Dashboard — single project (all tabs)

Everything lives in this folder: Map, Battery Status, **Battery AI**, Wallet, plus the Python BMS backend.

## Folder layout

```
Dashboard/
├── src/              React website
├── server/           Python API (MQTT + ML) — started by npm run dev
│   ├── models/       ML model files (.joblib)
│   └── esp32/        Arduino sketches (after npm run setup-models)
├── package.json
└── setup-models.ps1
```

## One-time setup (after git clone)

```powershell
cd "Battery Management System"
npm install
npm run setup
```

`npm run setup` installs Python packages (`server/requirements.txt`). It does **not** require training first.

### Does a cloner need to train models before `npm run dev`?

| What | Needs trained `.joblib` files? |
|------|--------------------------------|
| `npm run dev` (site + API start) | **No** |
| Login, Map, Wallet, Battery Status | **No** |
| Battery AI → Hugging Face tab | **No** (uses your HF Space) |
| Battery AI → **Live MQTT** (`/battery-ai/live`) | **Yes** (3 model files in `server/models/`) |

So your professor can run `npm run dev` immediately after `npm install` + `npm run setup` and use almost everything.

For **local ML predictions** on Live MQTT, either:

1. **Commit** `random_forest.joblib`, `gradient_boosting.joblib`, `extra_trees.joblib` under `server/models/` (recommended for grading), or  
2. **Train once** (needs the CSV dataset):

```powershell
npm run train
```

### Google Maps (optional)

Add to `.env` in this folder:

```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

## Run everything (one command)

```powershell
npm run dev
```

This starts:

- **Website** — http://localhost:5173
- **BMS API** — http://localhost:8080 (Battery AI tab)

### Login

| Email | Password |
|-------|----------|
| `admin@dashboard.com` | `admin123` |

## Tabs

| Button | Needs API |
|--------|-----------|
| Map | No |
| Battery Status | No |
| **Battery AI** | Yes (included in `npm run dev`) |
| Wallet | No |

## ESP32

Sketches are in `server\esp32\` after setup. Flash `mqtt_gateway_good.ino` or `mqtt_gateway_bad.ino`.

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Website + BMS API together |
| `npm run dev:web` | Website only |
| `npm run dev:api` | BMS API only |
| `npm run test-mqtt` | Send test MQTT messages |
| `npm run train` | Retrain ML models |

## MQTT credentials

Edit `server\.env` (WiFi is only in ESP32 sketches under `server\esp32\`).
