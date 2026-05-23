#!/usr/bin/env python3
"""Train ML models (one-time). Run: npm run train"""
from __future__ import annotations

import json
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from config import BMS_DATASET_CSV, MODEL_FEATURE_NAMES, MODELS_DIR, TRAIN_SAMPLE_ROWS


def load_training_data():
    path = BMS_DATASET_CSV
    if not path.is_file():
        raise FileNotFoundError(f"Dataset not found: {path}")

    print(f"Loading {path} (sample up to {TRAIN_SAMPLE_ROWS:,} rows)...")
    df = pd.read_csv(path, nrows=TRAIN_SAMPLE_ROWS)
    if len(df) < TRAIN_SAMPLE_ROWS:
        df = pd.read_csv(path)
        if len(df) > TRAIN_SAMPLE_ROWS:
            df = df.sample(n=TRAIN_SAMPLE_ROWS, random_state=42)

    y = (df["label"] == "normal").astype(int).to_numpy()
    cols = [c for c in MODEL_FEATURE_NAMES if c in df.columns]
    X = df[cols].to_numpy(dtype=np.float64)
    print(f"Rows: {len(df):,} | good: {y.sum():,} | bad: {(1 - y).sum():,}")
    return X, y, cols


def train_and_save(name, pipeline, X_tr, y_tr, X_te, y_te):
    pipeline.fit(X_tr, y_tr)
    proba = pipeline.predict_proba(X_te)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_te, pred)),
        "roc_auc": float(roc_auc_score(y_te, proba)) if len(np.unique(y_te)) > 1 else 0.0,
    }
    print(f"\n=== {name} ===")
    print(classification_report(y_te, pred, target_names=["bad", "good"]))
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODELS_DIR / f"{name}.joblib")
    return metrics


def main():
    X, y, feature_cols = load_training_data()
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    models = {
        "random_forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(n_estimators=200, max_depth=14, min_samples_leaf=10, class_weight="balanced", random_state=42, n_jobs=-1)),
        ]),
        "gradient_boosting": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", GradientBoostingClassifier(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42)),
        ]),
        "extra_trees": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", ExtraTreesClassifier(n_estimators=200, max_depth=14, min_samples_leaf=10, class_weight="balanced", random_state=42, n_jobs=-1)),
        ]),
    }

    all_metrics = {}
    for name, pipe in models.items():
        all_metrics[name] = train_and_save(name, pipe, X_tr, y_tr, X_te, y_te)

    meta = {
        "feature_names": feature_cols,
        "label_map": {"0": "bad", "1": "good"},
        "threshold": 0.5,
        "metrics": all_metrics,
    }
    with open(MODELS_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"\nSaved models to {MODELS_DIR.resolve()}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Training failed: {e}", file=sys.stderr)
        sys.exit(1)
