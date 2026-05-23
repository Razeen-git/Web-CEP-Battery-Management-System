#!/usr/bin/env python3
"""Publish test BMS JSON to MQTT. Run: npm run test-mqtt"""
import json
import sys
import time
from pathlib import Path

import paho.mqtt.client as mqtt

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import MQTT_BROKER, MQTT_PASSWORD, MQTT_PORT, MQTT_TOPIC, MQTT_USERNAME

payload = {
    "source": "python_test",
    "pack_voltage_v": 52.4,
    "voltage_v": 52.4,
    "current_a": 18.5,
    "soc": 78,
    "soc_pct": 78,
    "cell_diff_mv": 15,
    "max_temp_c": 26,
    "min_temp_c": 24,
    "alarm_flags": 0,
    "charge_mos": 1,
    "discharge_mos": 1,
}


def main():
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="bms-test-publisher",
    )
    client.tls_set()
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    for i in range(5):
        payload["seq"] = i
        body = json.dumps(payload)
        client.publish(MQTT_TOPIC, body, qos=0)
        print(f"Published: {body}")
        time.sleep(2)
    client.loop_stop()
    client.disconnect()


if __name__ == "__main__":
    main()
