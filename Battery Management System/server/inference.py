"""Load trained models and score incoming BMS readings."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from config import MODEL_FEATURE_NAMES, MODELS_DIR
from features import build_feature_dict, feature_vector, rule_verdict

MODEL_IDS = ("random_forest", "gradient_boosting", "extra_trees")
DISPLAY_NAMES = {
    "random_forest": "Random Forest",
    "gradient_boosting": "Gradient Boosting",
    "extra_trees": "Extra Trees",
}


def build_remark(model_name: str, verdict: str, score_pct: float) -> str:
    if verdict == "good":
        return f"According to {model_name}, the battery is fine ({score_pct:.0f}% healthy)."
    return (
        f"According to {model_name}, the battery is not fine — "
        f"inspection advised ({100 - score_pct:.0f}% fault risk)."
    )


def build_consensus_remark(consensus: dict[str, Any]) -> str:
    v = consensus.get("verdict", "unknown")
    avg = consensus.get("avg_score_pct", 0)
    votes = consensus.get("good_votes", 0)
    total = consensus.get("total", 0)
    rule = consensus.get("rule_verdict")
    base = f"BMS rules indicate: {rule}. " if rule else ""
    if v == "good":
        return base + f"Overall: battery looks fine — {votes}/{total} models agree (avg {avg:.0f}% healthy)."
    return base + f"Overall: battery may be faulty — only {votes}/{total} models say fine; inspect the pack."


class ModelEnsemble:
    def __init__(self) -> None:
        self.models: dict[str, Any] = {}
        self.feature_names: list[str] = list(MODEL_FEATURE_NAMES)
        self.threshold = 0.5
        self._load()

    def _load(self) -> None:
        meta_path = MODELS_DIR / "metadata.json"
        if meta_path.is_file():
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
            self.feature_names = meta.get("feature_names", self.feature_names)
            self.threshold = float(meta.get("threshold", 0.5))
        for mid in MODEL_IDS:
            path = MODELS_DIR / f"{mid}.joblib"
            if path.is_file():
                self.models[mid] = joblib.load(path)

    def ready(self) -> bool:
        return len(self.models) > 0

    def predict_all(self, body: dict[str, Any]) -> dict[str, Any]:
        if not self.ready():
            return {"error": "Models not trained. Run: npm run setup-models"}

        feats = build_feature_dict(body)
        X = feature_vector(body, self.feature_names)
        ratings = []
        for mid in MODEL_IDS:
            if mid not in self.models:
                continue
            pipe = self.models[mid]
            proba = pipe.predict_proba(X)[0]
            classes = list(pipe.named_steps["clf"].classes_)
            good_idx = classes.index(1) if 1 in classes else 1
            score = float(proba[good_idx])
            verdict = "good" if score >= self.threshold else "bad"
            name = DISPLAY_NAMES.get(mid, mid)
            ratings.append(
                {
                    "model_id": mid,
                    "model_name": name,
                    "verdict": verdict,
                    "score_good": round(score, 4),
                    "score_pct": round(score * 100, 1),
                    "confidence_bad": round(1 - score, 4),
                    "remark": build_remark(name, verdict, round(score * 100, 1)),
                }
            )

        consensus = _consensus(ratings)
        rule = rule_verdict(body)
        if rule:
            consensus["rule_verdict"] = rule
            if rule == "good" and consensus["good_votes"] >= 1:
                consensus["verdict"] = "good"
            elif rule == "bad" and consensus["good_votes"] < consensus["total"]:
                consensus["verdict"] = "bad"
        consensus["remark"] = build_consensus_remark(consensus)
        return {
            "features": {k: (None if np.isnan(v) else round(v, 4)) for k, v in feats.items()},
            "ratings": ratings,
            "consensus": consensus,
        }


def _consensus(ratings: list[dict]) -> dict[str, Any]:
    if not ratings:
        return {"verdict": "unknown", "good_votes": 0, "total": 0, "avg_score_pct": 0.0}
    good_votes = sum(1 for r in ratings if r["verdict"] == "good")
    total = len(ratings)
    return {
        "verdict": "good" if good_votes > total / 2 else "bad",
        "good_votes": good_votes,
        "total": total,
        "avg_score_pct": round(sum(r["score_pct"] for r in ratings) / total, 1),
    }
