"""Feature extraction for CSV training rows and live MQTT / UART JSON."""
from __future__ import annotations

from typing import Any

import numpy as np

from config import FEATURE_NAMES, MODEL_FEATURE_NAMES


def _num(x: Any, default: float = float("nan")) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def canonical_payload(body: dict[str, Any]) -> dict[str, Any]:
    b = dict(body)
    if b.get("voltage_v") is None and b.get("pack_voltage_v") is not None:
        b["voltage_v"] = b["pack_voltage_v"]
    if b.get("voltage_v") is None and b.get("packVoltage") is not None:
        b["voltage_v"] = b["packVoltage"]
    if b.get("current_a") is None and b.get("packCurrent") is not None:
        b["current_a"] = b["packCurrent"]
    if b.get("soc_pct") is None and b.get("soc") is not None:
        soc = _num(b["soc"])
        b["soc_pct"] = soc * 100.0 if 0 <= soc <= 1.0 else soc
    if b.get("power_w") is None and b.get("voltage_v") is not None and b.get("current_a") is not None:
        b["power_w"] = _num(b["voltage_v"]) * _num(b["current_a"])
    cells = b.get("cells") or b.get("cellVoltages")
    if isinstance(cells, list) and cells:
        mvs = []
        for c in cells:
            if isinstance(c, dict):
                v = c.get("v") or c.get("mv")
                if v is not None:
                    fv = _num(v)
                    mvs.append(fv * 1000.0 if fv < 10 else fv)
            elif c is not None:
                fv = _num(c)
                mvs.append(fv * 1000.0 if fv < 10 else fv)
        if mvs:
            b["max_cell_mv"] = max(mvs)
            b["min_cell_mv"] = min(mvs)
            b["avg_cell_mv"] = sum(mvs) / len(mvs)
            b["cell_diff_mv"] = b["max_cell_mv"] - b["min_cell_mv"]
    temps = b.get("temps") or b.get("temperatures")
    if isinstance(temps, list) and temps:
        tc = []
        for t in temps:
            if isinstance(t, dict) and t.get("c") is not None:
                tc.append(_num(t["c"]))
            elif t is not None:
                tc.append(_num(t))
        if tc:
            b["max_temp_c"] = max(tc)
            b["min_temp_c"] = min(tc)
            b["avg_temp_c"] = sum(tc) / len(tc)
    if isinstance(b.get("mos"), dict):
        m = b["mos"]
        if "charge" in m:
            b["charge_mos"] = 1 if m["charge"] else 0
        if "discharge" in m:
            b["discharge_mos"] = 1 if m["discharge"] else 0
    if isinstance(b.get("alarms"), dict):
        b["alarm_flags"] = sum(1 for v in b["alarms"].values() if v)
    return b


def build_feature_dict(body: dict[str, Any]) -> dict[str, float]:
    b = canonical_payload(body)
    out: dict[str, float] = {}
    for k in FEATURE_NAMES:
        out[k] = _num(b.get(k))
    if np.isnan(out["power_w"]) and not np.isnan(out["voltage_v"]) and not np.isnan(out["current_a"]):
        out["power_w"] = out["voltage_v"] * out["current_a"]
    if np.isnan(out["cell_diff_mv"]) and not np.isnan(out.get("max_cell_mv", float("nan"))):
        out["cell_diff_mv"] = out["max_cell_mv"] - out["min_cell_mv"]
    if np.isnan(out["temp_deviation"]) and not np.isnan(out.get("max_temp_c", float("nan"))):
        out["temp_deviation"] = out["max_temp_c"] - 25.0
    n_cells = b.get("cell_count") or (len(b.get("cells") or []) or 23)
    if np.isnan(out.get("voltage_ratio", float("nan"))) and not np.isnan(out["voltage_v"]):
        out["voltage_ratio"] = out["voltage_v"] / (float(n_cells) * 3.65)
    if np.isnan(out.get("c_rate", float("nan"))) and not np.isnan(out["current_a"]):
        cap = _num(b.get("capacity_ah"), 100.0)
        out["c_rate"] = abs(out["current_a"]) / cap
    if np.isnan(out.get("cell_diff_ratio", float("nan"))) and not np.isnan(out.get("cell_diff_mv", float("nan"))):
        avg = out.get("avg_cell_mv") or out.get("max_cell_mv")
        if not np.isnan(_num(avg)):
            out["cell_diff_ratio"] = out["cell_diff_mv"] / max(_num(avg), 1.0)

    n_cells_f = float(n_cells) if n_cells else 23.0
    if not np.isnan(out["voltage_v"]):
        est_avg_mv = out["voltage_v"] * 1000.0 / n_cells_f
        if np.isnan(out.get("avg_cell_mv", float("nan"))):
            out["avg_cell_mv"] = est_avg_mv
        if np.isnan(out.get("cell_diff_mv", float("nan"))):
            out["cell_diff_mv"] = _num(b.get("cell_diff_mv"), 15.0)
        diff = out["cell_diff_mv"]
        if np.isnan(out.get("max_cell_mv", float("nan"))):
            out["max_cell_mv"] = out["avg_cell_mv"] + diff / 2.0
        if np.isnan(out.get("min_cell_mv", float("nan"))):
            out["min_cell_mv"] = out["avg_cell_mv"] - diff / 2.0
        if np.isnan(out.get("cell_diff_ratio", float("nan"))):
            out["cell_diff_ratio"] = diff / max(out["avg_cell_mv"], 1.0)

    if np.isnan(out.get("avg_temp_c", float("nan"))):
        if not np.isnan(out.get("max_temp_c", float("nan"))) and not np.isnan(out.get("min_temp_c", float("nan"))):
            out["avg_temp_c"] = (out["max_temp_c"] + out["min_temp_c"]) / 2.0
    if np.isnan(out.get("balance_active", float("nan"))):
        out["balance_active"] = 0.0

    return out


def feature_vector(body: dict[str, Any], columns: list[str] | None = None) -> np.ndarray:
    d = build_feature_dict(body)
    cols = columns or MODEL_FEATURE_NAMES
    return np.array([[d.get(k, float("nan")) for k in cols]], dtype=np.float64)


def rule_verdict(body: dict[str, Any]) -> str | None:
    d = build_feature_dict(body)
    alarms = d.get("alarm_flags", float("nan"))
    soc = d.get("soc_pct", float("nan"))
    diff = d.get("cell_diff_mv", float("nan"))
    temp = d.get("max_temp_c", float("nan"))
    ratio = d.get("voltage_ratio", float("nan"))
    if any(np.isnan(x) for x in (alarms, soc, diff, temp, ratio)):
        return None
    if alarms == 0 and soc >= 25 and diff <= 40 and 20 <= temp <= 40 and 0.86 <= ratio <= 0.93:
        return "good"
    if soc < 18 or diff >= 120 or temp >= 52 or alarms >= 1:
        return "bad"
    return None
