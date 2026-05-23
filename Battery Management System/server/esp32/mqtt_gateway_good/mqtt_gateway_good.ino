/*
 * ESP32 — GOOD battery + MQTT gateway (all-in-one, NO UART)
 *
 * Simulates a healthy 23S LiFePO4 pack and publishes JSON to HiveMQ Cloud.
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
  Serial.println("  MQTT CONNECTED  (GOOD battery mode)");
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
  String cid = "esp32-good-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
    updateMqttStatus(true);
    return true;
  }
  Serial.printf(" FAILED (%d)\n", mqtt.state());
  updateMqttStatus(false, mqtt.state());
  return false;
}

void publishGoodTelemetry() {
  static uint32_t n = 0;
  n++;
  float theta = (n % 60) * 2.0f * PI / 60.0f;

  float packV = 75.4f + 0.4f * sinf(theta);
  float currentA = 22.0f + 10.0f * sinf(theta * 1.2f);
  int soc = 55 + (int)(20.0f * sinf(theta * 0.4f));
  int cellDiff = 12 + (int)(4.0f * sinf(theta * 0.7f));
  float ratio = packV / (N_CELLS * 3.65f);

  char json[640];
  snprintf(json, sizeof(json),
    "{\"source\":\"good_battery\",\"battery_mode\":\"good\","
    "\"pack_voltage_v\":%.2f,\"voltage_v\":%.2f,\"current_a\":%.2f,"
    "\"soc\":%d,\"soc_pct\":%d,\"cell_count\":%d,"
    "\"cell_diff_mv\":%d,\"max_temp_c\":22,\"min_temp_c\":21,\"avg_temp_c\":21,"
    "\"temp_deviation\":-3,\"alarm_flags\":0,\"voltage_ratio\":%.4f,"
    "\"c_rate\":%.3f,\"charge_mos\":1,\"discharge_mos\":1,"
    "\"mos\":{\"charge\":true,\"discharge\":true},"
    "\"alarms\":{\"low_voltage\":false,\"cell_diff\":false,\"overcurrent\":false}}",
    packV, packV, currentA, soc, soc, N_CELLS, cellDiff, ratio, fabs(currentA) / 100.0f);

  if (!mqttConnect()) return;
  if (mqtt.publish(MQTT_TOPIC, json, false)) {
    Serial.print("[GOOD] Published ");
    Serial.printf("V=%.1f SOC=%d%% I=%.1fA diff=%dmV\n", packV, soc, currentA, cellDiff);
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
  Serial.println("=== MQTT Gateway — GOOD battery (no UART) ===");

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
    publishGoodTelemetry();
    lastPub = millis();
  }
}
