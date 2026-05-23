"""BMS backend settings (MQTT + ML). Loaded from server/.env"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

MQTT_BROKER = os.getenv("MQTT_BROKER", "36c09c3263cc461cb410705bc86628d9.s1.eu.hivemq.cloud")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "bms/pack1/telemetry")
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "Abdul_AI")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "Dsaqw_1981")

# Optional: only needed for `npm run train`
BMS_DATASET_CSV = Path(
    os.getenv(
        "BMS_DATASET_CSV",
        str(ROOT.parent.parent / "bms_dataset" / "bms_dataset_extended.csv"),
    )
)
TRAIN_SAMPLE_ROWS = int(os.getenv("TRAIN_SAMPLE_ROWS", "80000"))

MODELS_DIR = ROOT / "models"
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))

FEATURE_NAMES = [
    "voltage_v",
    "current_a",
    "power_w",
    "soc_pct",
    "cell_diff_mv",
    "max_cell_mv",
    "min_cell_mv",
    "avg_cell_mv",
    "max_temp_c",
    "min_temp_c",
    "avg_temp_c",
    "c_rate",
    "cell_diff_ratio",
    "voltage_ratio",
    "temp_deviation",
    "alarm_flags",
    "charge_mos",
    "discharge_mos",
    "balance_active",
]

MODEL_FEATURE_NAMES = [
    "soc_pct",
    "cell_diff_mv",
    "cell_diff_ratio",
    "voltage_ratio",
    "c_rate",
    "temp_deviation",
    "max_temp_c",
    "min_temp_c",
    "alarm_flags",
    "charge_mos",
    "discharge_mos",
]
