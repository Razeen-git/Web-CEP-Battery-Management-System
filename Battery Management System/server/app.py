"""
BMS API: MQTT (HiveMQ) + WebSocket + ML inference.
Started automatically with `npm run dev` from the project root.
"""
from __future__ import annotations

import asyncio
import json
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import API_HOST, API_PORT, MQTT_BROKER, MQTT_PASSWORD, MQTT_PORT, MQTT_TOPIC, MQTT_USERNAME
from inference import ModelEnsemble

HISTORY_MAX = 120

ensemble = ModelEnsemble()
state_lock = threading.Lock()
mqtt_state: dict[str, Any] = {
    "connected": False,
    "messages_received": 0,
    "last_message_at": None,
    "error": None,
    "rc": None,
}
latest: dict[str, Any] = {"last_message": None, "predictions": None, "telemetry": None}
history: deque = deque(maxlen=HISTORY_MAX)
ws_clients: set[WebSocket] = set()
loop: asyncio.AbstractEventLoop | None = None


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def process_payload(payload: dict[str, Any]) -> dict[str, Any]:
    preds = ensemble.predict_all(payload)
    row = {
        "timestamp": _utc_iso(),
        "telemetry": payload,
        "predictions": preds,
    }
    with state_lock:
        latest["last_message"] = row["timestamp"]
        latest["telemetry"] = payload
        latest["predictions"] = preds
        history.append(row)
    return row


async def broadcast(row: dict[str, Any]) -> None:
    dead = []
    msg = json.dumps(row)
    for ws in list(ws_clients):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_clients.discard(ws)


def on_mqtt_message(_client, _userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return
    with state_lock:
        mqtt_state["messages_received"] = int(mqtt_state.get("messages_received", 0)) + 1
        mqtt_state["last_message_at"] = _utc_iso()
    row = process_payload(payload)
    if loop and loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast(row), loop)


def on_mqtt_connect(client, _userdata, _flags, reason_code, _properties=None):
    rc = reason_code if isinstance(reason_code, int) else getattr(reason_code, "value", reason_code)
    with state_lock:
        mqtt_state["connected"] = rc == 0
        mqtt_state["rc"] = rc
        if rc == 0:
            mqtt_state["error"] = None
        else:
            mqtt_state["error"] = f"connect failed rc={rc}"
    if rc == 0:
        client.subscribe(MQTT_TOPIC, qos=0)
        print(f"MQTT connected — subscribed to {MQTT_TOPIC!r}", flush=True)
    else:
        print(f"MQTT connect failed: rc={rc}", flush=True)


def start_mqtt_thread():
    def run():
        try:
            client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"bms-api-{int(time.time())}",
            )
            client.on_connect = on_mqtt_connect
        except (TypeError, AttributeError):
            client = mqtt.Client(client_id=f"bms-api-{int(time.time())}")
            client.on_connect = lambda c, u, f, rc: on_mqtt_connect(c, u, f, rc)
        client.on_message = on_mqtt_message
        client.tls_set()
        if MQTT_USERNAME:
            client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD or "")
        print(
            f"MQTT connecting to {MQTT_BROKER}:{MQTT_PORT} topic={MQTT_TOPIC!r} user={MQTT_USERNAME!r}",
            flush=True,
        )
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            client.loop_forever()
        except Exception as e:
            with state_lock:
                mqtt_state["connected"] = False
                mqtt_state["error"] = str(e)
            print(f"MQTT thread error: {e}", flush=True)

    t = threading.Thread(target=run, daemon=True, name="mqtt")
    t.start()


app = FastAPI(title="Battery Classifier", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictBody(BaseModel):
    model_config = {"extra": "allow"}


@app.get("/api/health")
def health():
    with state_lock:
        ms = dict(mqtt_state)
    return {
        "ok": True,
        "models_ready": ensemble.ready(),
        "mqtt": {
            "broker": MQTT_BROKER,
            "port": MQTT_PORT,
            "topic": MQTT_TOPIC,
            "username": MQTT_USERNAME,
            "connected": bool(ms.get("connected")),
            "messages_received": int(ms.get("messages_received", 0)),
            "last_message_at": ms.get("last_message_at"),
            "error": ms.get("error"),
            "rc": ms.get("rc"),
        },
    }


@app.get("/api/status")
def status():
    with state_lock:
        return {
            "latest": dict(latest),
            "history_len": len(history),
        }


@app.get("/api/history")
def get_history(limit: int = 60):
    with state_lock:
        rows = list(history)[-limit:]
    return {"rows": rows}


@app.post("/api/predict")
def predict(body: PredictBody):
    row = process_payload(body.model_dump())
    if loop and loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast(row), loop)
    return row


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_clients.add(ws)
    with state_lock:
        if latest.get("telemetry"):
            await ws.send_text(
                json.dumps(
                    {
                        "timestamp": latest.get("last_message"),
                        "telemetry": latest.get("telemetry"),
                        "predictions": latest.get("predictions"),
                    }
                )
            )
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients.discard(ws)


@app.on_event("startup")
async def startup():
    global loop
    loop = asyncio.get_running_loop()
    start_mqtt_thread()


def main():
    uvicorn.run("app:app", host=API_HOST, port=API_PORT, reload=False)


if __name__ == "__main__":
    main()
