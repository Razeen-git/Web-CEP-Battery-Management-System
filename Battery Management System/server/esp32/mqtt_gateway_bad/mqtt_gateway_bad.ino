/*
 * ESP32 — BAD battery + MQTT gateway (all-in-one, NO UART)
 *
 * Simulates a faulty 23S pack (low SOC, imbalance, high temp, alarms)
 * and publishes JSON to HiveMQ Cloud.
 *
 * Flash this sketch on ONE ESP32 only — no second BMS board needed.
 *
 * Libraries: PubSubClient, ArduinoJson v6
 */
#include <Arduino.h>
#include <math.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#ifndef PI
#define PI 3.14159265f
#endif

#define LED_PIN 2
#define LED_ON  LOW
#define LED_OFF HIGH
#define PUBLISH_MS 2000
#define N_CELLS 23

// WiFi + HiveMQ (same as config.py / mqtt_gateway.ino)
const char *WIFI_SSID = "abdul";
const char *WIFI_PASSWORD = "12345678";
const char *MQTT_BROKER = "36c09c3263cc461cb410705bc86628d9.s1.eu.hivemq.cloud";
const uint16_t MQTT_PORT = 8883;
const char *MQTT_USER = "Abdul_AI";
const char *MQTT_PASS = "Dsaqw_1981";
const char *MQTT_TOPIC = "bms/pack1/telemetry";

WiFiClientSecure net;
PubSubClient mqtt(net);
static bool mqttWasConnected = false;

void setMqttLed(bool on) {
  digitalWrite(LED_PIN, on ? LED_ON : LED_OFF);
}

void printWifiConnected() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("  WIFI CONNECTED");
  Serial.printf("  SSID : %s\n", WIFI_SSID);
  Serial.printf("  IP   : %s\n", WiFi.localIP().toString().c_str());
  Serial.println("========================================");
  Serial.println();
}

bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  Serial.printf("[WiFi] Connecting to \"%s\"", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int i = 0; i < 60 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    printWifiConnected();
    return true;
  }
  Serial.println("[WiFi] FAILED");
  return false;
}

void printMqttConnected() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("  MQTT CONNECTED  (BAD battery mode)");
  Serial.printf("  Broker : %s:%u\n", MQTT_BROKER, MQTT_PORT);
  Serial.printf("  Topic  : %s\n", MQTT_TOPIC);
  Serial.println("========================================");
  Serial.println();
}

void updateMqttStatus(bool connected, int failReason = -99) {
  setMqttLed(connected);
  if (connected && !mqttWasConnected) {
    printMqttConnected();
    mqttWasConnected = true;
  } else if (!connected && mqttWasConnected) {
    Serial.println("[MQTT] DISCONNECTED");
    if (failReason >= 0) Serial.printf("  reason=%d\n", failReason);
    mqttWasConnected = false;
  }
}

bool mqttConnect() {
  if (mqtt.connected()) {
    updateMqttStatus(true);
    return true;
  }
  Serial.print("[MQTT] Connecting");
  String cid = "esp32-bad-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
    updateMqttStatus(true);
    return true;
  }
  Serial.printf(" FAILED (%d)\n", mqtt.state());
  updateMqttStatus(false, mqtt.state());
  return false;
}

void publishBadTelemetry() {
  static uint32_t n = 0;
  n++;
  float t = n * 0.05f;

  float packV = 73.5f + 0.3f * sinf(t);
  float currentA = 52.0f + 15.0f * sinf(t * 1.1f);
  int soc = 12 + (int)(3.0f * sinf(t * 0.3f));
  int cellDiff = 180 + (int)(70.0f * sinf(t * 0.5f));
  int maxTemp = 58 + (int)(5.0f * sinf(t));
  int minTemp = 52 + (int)(3.0f * cosf(t));
  float ratio = packV / (N_CELLS * 3.65f);

  char json[640];
  snprintf(json, sizeof(json),
    "{\"source\":\"bad_battery\",\"battery_mode\":\"bad\","
    "\"pack_voltage_v\":%.2f,\"voltage_v\":%.2f,\"current_a\":%.2f,"
    "\"soc\":%d,\"soc_pct\":%d,\"cell_count\":%d,"
    "\"cell_diff_mv\":%d,\"max_temp_c\":%d,\"min_temp_c\":%d,\"avg_temp_c\":%d,"
    "\"temp_deviation\":%d,\"alarm_flags\":7,\"voltage_ratio\":%.4f,"
    "\"c_rate\":%.3f,\"charge_mos\":0,\"discharge_mos\":1,"
    "\"mos\":{\"charge\":false,\"discharge\":true},"
    "\"alarms\":{\"low_voltage\":true,\"cell_diff\":true,\"overcurrent\":true}}",
    packV, packV, currentA, soc, soc, N_CELLS, cellDiff, maxTemp, minTemp, (maxTemp + minTemp) / 2,
    maxTemp - 25, ratio, fabs(currentA) / 100.0f);

  if (!mqttConnect()) return;
  if (mqtt.publish(MQTT_TOPIC, json, false)) {
    Serial.print("[BAD] Published ");
    Serial.printf("V=%.1f SOC=%d%% I=%.1fA diff=%dmV Tmax=%dC\n",
                  packV, soc, currentA, cellDiff, maxTemp);
  } else {
    Serial.println("[MQTT] Publish FAILED");
  }
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  setMqttLed(false);
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("=== MQTT Gateway — BAD battery (no UART) ===");

  while (!connectWifi()) {
    Serial.println("[WiFi] Retry in 3s...");
    delay(3000);
  }

  net.setInsecure();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(1024);
  mqttConnect();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) mqttConnect();
  else updateMqttStatus(true);
  mqtt.loop();

  static unsigned long lastPub = 0;
  if (millis() - lastPub >= PUBLISH_MS) {
    publishBadTelemetry();
    lastPub = millis();
  }
}
