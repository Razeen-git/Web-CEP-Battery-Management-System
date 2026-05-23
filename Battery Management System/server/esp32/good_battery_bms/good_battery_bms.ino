/*
 * ESP32 #1 — GOOD battery + BMS emulator (UART transmitter)
 * 23S LiFePO4 pack (~75 V) — matches ML training dataset scale.
 */
#include <Arduino.h>
#include <math.h>

#ifndef PI
#define PI 3.14159265f
#endif

#define RXD2 16
#define TXD2 17
#define N_CELLS 23

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

void sendFrame(float packV, int16_t currentA, uint8_t soc, uint8_t alarms) {
  const uint16_t frameLen = 16 + N_CELLS * 2 + 1 + 4 + 2;
  uint8_t frame[80];
  frame[0] = 0x4E; frame[1] = 0x57;
  frame[2] = (frameLen >> 8) & 0xFF; frame[3] = frameLen & 0xFF;
  frame[4] = 0x01; frame[5] = 0x01; frame[6] = 0x03; frame[7] = 0x01;

  uint16_t pack_mv = (uint16_t)(packV * 1000.0f);
  int16_t current_ma = currentA * 100;
  frame[8] = (pack_mv >> 8) & 0xFF; frame[9] = pack_mv & 0xFF;
  frame[10] = (current_ma >> 8) & 0xFF; frame[11] = current_ma & 0xFF;
  frame[12] = soc;
  frame[13] = 0x03;
  frame[14] = alarms;
  frame[15] = N_CELLS;

  float cellBase = packV / N_CELLS;
  uint16_t idx = 16;
  for (uint8_t i = 0; i < N_CELLS; i++) {
    float cellV = cellBase + 0.004f * sinf((float)(millis() / 1000 + i) * 0.2f);
    uint16_t mv = (uint16_t)(cellV * 1000.0f);
    frame[idx++] = (mv >> 8) & 0xFF; frame[idx++] = mv & 0xFF;
  }
  frame[idx++] = 2;
  int16_t t1 = 220, t2 = 210; // 22.0 C, 21.0 C (matches training normal temps)
  frame[idx++] = (t1 >> 8) & 0xFF; frame[idx++] = t1 & 0xFF;
  frame[idx++] = (t2 >> 8) & 0xFF; frame[idx++] = t2 & 0xFF;

  uint16_t crc = crc16_modbus(frame, frameLen - 2);
  frame[frameLen - 2] = crc & 0xFF;
  frame[frameLen - 1] = (crc >> 8) & 0xFF;
  Serial2.write(frame, frameLen);
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);
  Serial.println("GOOD BMS (23S ~75V) started");
}

void loop() {
  static uint32_t t = 0;
  t++;
  float theta = (t % 60) * 2.0f * PI / 60.0f;
  float packV = 75.4f + 0.4f * sinf(theta);
  int16_t currentA = 20 + (int16_t)(12 * sinf(theta * 1.2f));
  uint8_t soc = 55 + (uint8_t)(25 * sinf(theta * 0.4f));
  sendFrame(packV, currentA, soc, 0x00);
  Serial.printf("GOOD pack=%.2fV I=%dA SOC=%u%%\n", packV, currentA, soc);
  delay(1000);
}
