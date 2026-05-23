/*
 * ESP32 #3 — UART receiver + HiveMQ Cloud MQTT publisher
 *
 * Wiring (gateway RX <- BMS TX):
 *   BMS ESP32 TX (GPIO17) -> Gateway RX (GPIO16)
 *   BMS ESP32 RX (GPIO16) -> Gateway TX (GPIO17)
 *   GND common
 *
 * Libraries (Arduino Library Manager):
 *   - PubSubClient
 *   - ArduinoJson (v6)
 *
 * HiveMQ Cloud credentials: see MQTT_Connection_details.png + Access Credentials in console.
 */
#include <Arduino.h>
#include <math.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define RXD2 16
#define TXD2 17

// Built-in LED (most ESP32 DevKit: GPIO 2, active LOW)
#ifndef LED_PIN
#define LED_PIN 2
#endif
#define LED_ON  LOW
#define LED_OFF HIGH

// If 1: publish demo JSON when no UART frames (gateway-only testing)
#define STANDALONE_DEMO 1
#define UART_IDLE_WARN_MS 5000
#define DEMO_PUBLISH_MS 2000

// -------- EDIT THESE --------
const char *WIFI_SSID = "abdul";
const char *WIFI_PASSWORD = "12345678";
const char *MQTT_BROKER = "36c09c3263cc461cb410705bc86628d9.s1.eu.hivemq.cloud";
const uint16_t MQTT_PORT = 8883;
const char *MQTT_USER = "Abdul_AI";
const char *MQTT_PASS = "Dsaqw_1981";
const char *MQTT_TOPIC = "bms/pack1/telemetry";
// ----------------------------

WiFiClientSecure net;
PubSubClient mqtt(net);
static bool mqttWasConnected = false;

uint16_t crc16_modbus(const uint8_t *data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int j = 0; j < 8; j++) {
      if (crc & 0x0001) { crc >>= 1; crc ^= 0xA001; }
      else crc >>= 1;
    }
  }
  return crc;
}

bool readFrame(uint8_t *buf, size_t maxLen, size_t &outLen) {
  while (Serial2.available()) {
    if (Serial2.read() != 0x4E) continue;
    unsigned long t0 = millis();
    while (!Serial2.available() && millis() - t0 < 50) delay(1);
    if (!Serial2.available() || Serial2.read() != 0x57) continue;
    buf[0] = 0x4E; buf[1] = 0x57;
    t0 = millis();
    while (Serial2.available() < 2 && millis() - t0 < 50) delay(1);
    if (Serial2.available() < 2) return false;
    buf[2] = Serial2.read(); buf[3] = Serial2.read();
    uint16_t len = ((uint16_t)buf[2] << 8) | buf[3];
    if (len < 10 || len > maxLen) return false;
    size_t idx = 4, need = len - 4;
    t0 = millis();
    while (need > 0 && millis() - t0 < 200) {
      if (Serial2.available()) { buf[idx++] = Serial2.read(); need--; }
    }
    if (need != 0) return false;
    outLen = len;
    return true;
  }
  return false;
}

void setMqttLed(bool connected) {
  digitalWrite(LED_PIN, connected ? LED_ON : LED_OFF);
}

void printWifiConnected() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("  WIFI CONNECTED");
  Serial.printf("  SSID   : %s\n", WIFI_SSID);
  Serial.printf("  IP     : %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("  RSSI   : %d dBm\n", WiFi.RSSI());
  Serial.println("========================================");
  Serial.println();
}

bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }
  Serial.printf("[WiFi] Connecting to \"%s\"", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    printWifiConnected();
    return true;
  }
  Serial.println("[WiFi] FAILED — check SSID/password or signal");
  return false;
}

void printMqttConnected() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("  MQTT CONNECTED");
  Serial.printf("  Broker : %s:%u\n", MQTT_BROKER, MQTT_PORT);
  Serial.printf("  Topic  : %s\n", MQTT_TOPIC);
  Serial.printf("  User   : %s\n", MQTT_USER);
  Serial.println("========================================");
  Serial.println();
}

void printMqttDisconnected(int reason) {
  Serial.println();
  Serial.println("----------------------------------------");
  Serial.println("  MQTT DISCONNECTED");
  if (reason >= 0) {
    Serial.printf("  Reason : %d", reason);
    switch (reason) {
      case -4: Serial.println(" (connection timeout)"); break;
      case -3: Serial.println(" (connection lost)"); break;
      case -2: Serial.println(" (connect failed)"); break;
      case -1: Serial.println(" (disconnected)"); break;
      case 1: Serial.println(" (bad protocol)"); break;
      case 2: Serial.println(" (bad client id)"); break;
      case 3: Serial.println(" (unavailable)"); break;
      case 4: Serial.println(" (bad credentials)"); break;
      case 5: Serial.println(" (not authorized)"); break;
      default: Serial.println(); break;
    }
  } else {
    Serial.println();
  }
  Serial.println("----------------------------------------");
  Serial.println();
}

void updateMqttStatus(bool connected, int failReason = -99) {
  setMqttLed(connected);
  if (connected && !mqttWasConnected) {
    printMqttConnected();
    mqttWasConnected = true;
  } else if (!connected && mqttWasConnected) {
    printMqttDisconnected(failReason);
    mqttWasConnected = false;
  }
}

bool mqttConnect() {
  if (mqtt.connected()) {
    updateMqttStatus(true);
    return true;
  }
  updateMqttStatus(false);
  Serial.print("[MQTT] Connecting");
  String cid = "esp32-bms-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)) {
    updateMqttStatus(true);
    return true;
  }
  int st = mqtt.state();
  Serial.printf(" ... FAILED (state=%d)\n", st);
  updateMqttStatus(false, st);
  return false;
}

void publishJson(const char *json) {
  if (!mqttConnect()) return;
  if (mqtt.publish(MQTT_TOPIC, json, false)) {
    Serial.print("[MQTT] Published -> ");
    Serial.println(json);
  } else {
    Serial.println("[MQTT] Publish FAILED (increase mqtt.setBufferSize?)");
  }
}

void publishStandaloneDemo() {
  static uint32_t n = 0;
  n++;
  float theta = (n % 60) * 6.28318f / 60.0f;
  float packV = 75.4f + 0.4f * sin(theta);
  int soc = 55 + (int)(20 * sin(theta * 0.4f));
  char json[512];
  snprintf(json, sizeof(json),
    "{\"source\":\"gateway_demo\",\"pack_voltage_v\":%.2f,\"voltage_v\":%.2f,"
    "\"current_a\":%.1f,\"soc\":%d,\"soc_pct\":%d,\"cell_count\":23,"
    "\"cell_diff_mv\":14,\"max_temp_c\":22,\"min_temp_c\":21,\"alarm_flags\":0,"
    "\"voltage_ratio\":%.4f,\"charge_mos\":1,\"discharge_mos\":1}",
    packV, packV, 22.0f + 10.0f * sin(theta * 1.2f), soc, soc, packV / (23.0f * 3.65f));
  publishJson(json);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  setMqttLed(false);

  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("BMS MQTT Gateway starting...");

  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);

  while (!connectWifi()) {
    Serial.println("[WiFi] Retry in 3s...");
    delay(3000);
  }

  net.setInsecure(); // HiveMQ Cloud — use setCACert for production
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(1024);

  Serial.println("[MQTT] Initial connect...");
  mqttConnect();
#if STANDALONE_DEMO
  Serial.println("[UART] Standalone demo ON — will publish if no BMS UART data");
  Serial.println("[UART] For real BMS: flash good/bad_battery_bms on 2nd ESP32");
  Serial.println("[UART] Wire BMS TX(17) -> Gateway RX(16), GND common");
#endif
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost — reconnecting...");
    connectWifi();
  }

  if (!mqtt.connected()) {
    mqttConnect();
  } else {
    updateMqttStatus(true);
  }
  mqtt.loop();

  static uint8_t frame[128];
  static unsigned long lastUartMs = 0;
  static unsigned long lastDemoMs = 0;
  static unsigned long lastWarnMs = 0;
  size_t frameLen = 0;

  if (!readFrame(frame, sizeof(frame), frameLen)) {
#if STANDALONE_DEMO
    unsigned long now = millis();
    if (now - lastUartMs > UART_IDLE_WARN_MS && now - lastWarnMs > UART_IDLE_WARN_MS) {
      Serial.println("[UART] No BMS frames — using standalone demo publish");
      lastWarnMs = now;
    }
    if (now - lastDemoMs >= DEMO_PUBLISH_MS) {
      publishStandaloneDemo();
      lastDemoMs = now;
    }
#endif
    delay(10);
    return;
  }

  lastUartMs = millis();
  Serial.println("[UART] BMS frame received");

  uint16_t crcCalc = crc16_modbus(frame, frameLen - 2);
  uint16_t crcRecv = frame[frameLen - 2] | ((uint16_t)frame[frameLen - 1] << 8);
  if (crcCalc != crcRecv) {
    Serial.println("CRC fail");
    return;
  }

  uint16_t pack_mv = ((uint16_t)frame[8] << 8) | frame[9];
  int16_t current_ma = (int16_t)(((uint16_t)frame[10] << 8) | frame[11]);
  uint8_t soc = frame[12];
  uint8_t mos = frame[13];
  uint8_t alarms = frame[14];
  uint8_t cellCount = frame[15];
  uint16_t idx = 16;

  StaticJsonDocument<1024> doc;
  doc["pack_voltage_v"] = pack_mv / 1000.0;
  doc["current_a"] = current_ma / 100.0;
  doc["soc"] = soc;
  doc["soc_pct"] = soc;
  doc["charge_mos"] = (mos & 0x01) ? 1 : 0;
  doc["discharge_mos"] = (mos & 0x02) ? 1 : 0;
  doc["alarm_flags"] = alarms;

  JsonObject mosObj = doc.createNestedObject("mos");
  mosObj["charge"] = (mos & 0x01) != 0;
  mosObj["discharge"] = (mos & 0x02) != 0;

  JsonObject al = doc.createNestedObject("alarms");
  al["low_voltage"] = (alarms & 0x01) != 0;
  al["cell_diff"] = (alarms & 0x02) != 0;
  al["overcurrent"] = (alarms & 0x04) != 0;

  JsonArray cells = doc.createNestedArray("cells");
  uint16_t min_mv = 65535, max_mv = 0;
  for (uint8_t i = 0; i < cellCount && idx + 1 < frameLen - 2; i++) {
    uint16_t mv = ((uint16_t)frame[idx] << 8) | frame[idx + 1];
    idx += 2;
    if (mv < min_mv) min_mv = mv;
    if (mv > max_mv) max_mv = mv;
    JsonObject c = cells.createNestedObject();
    c["n"] = i + 1;
    c["v"] = mv / 1000.0;
  }
  doc["min_cell_mv"] = min_mv;
  doc["max_cell_mv"] = max_mv;
  doc["cell_diff_mv"] = (max_mv > min_mv) ? (max_mv - min_mv) : 0;
  doc["avg_cell_mv"] = (uint16_t)((min_mv + max_mv) / 2);
  doc["voltage_v"] = pack_mv / 1000.0;
  doc["cell_count"] = cellCount;
  doc["power_w"] = (pack_mv / 1000.0) * (current_ma / 100.0);
  doc["voltage_ratio"] = (pack_mv / 1000.0) / (cellCount * 3.65);
  doc["c_rate"] = fabs(current_ma / 100.0) / 100.0;
  doc["cell_diff_ratio"] = (max_mv > min_mv) ? ((max_mv - min_mv) / max((uint16_t)1, (uint16_t)((min_mv + max_mv) / 2))) : 0;

  if (idx < frameLen - 2) {
    uint8_t tempCount = frame[idx++];
    JsonArray temps = doc.createNestedArray("temps");
    float tmax = -100, tmin = 200;
    for (uint8_t i = 0; i < tempCount && idx + 1 < frameLen - 2; i++) {
      int16_t tdec = (int16_t)(((uint16_t)frame[idx] << 8) | frame[idx + 1]);
      idx += 2;
      float tc = tdec / 10.0f;
      if (tc > tmax) tmax = tc;
      if (tc < tmin) tmin = tc;
      JsonObject t = temps.createNestedObject();
      t["n"] = i + 1;
      t["c"] = tc;
    }
    doc["max_temp_c"] = (int)tmax;
    doc["min_temp_c"] = (int)tmin;
    doc["avg_temp_c"] = (int)((tmax + tmin) / 2);
    doc["temp_deviation"] = (int)(tmax - 25);
  }

  char buf[1024];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (n > 0) publishJson(buf);
}
