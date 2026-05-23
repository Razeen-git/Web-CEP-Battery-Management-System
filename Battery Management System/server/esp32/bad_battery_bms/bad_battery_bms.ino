/*
 * ESP32 #2 — BAD battery + BMS emulator (UART transmitter)
 * Same protocol as good_battery_bms.ino but simulates faults:
 *   - low SOC, high cell imbalance, alarm flags, weak cells
 *
 * Arduino IDE: Board = ESP32 Dev Module
 */
#include <Arduino.h>
#include <math.h>

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

void sendFrame(float packV, int16_t currentA, uint8_t soc, uint8_t alarms,
               float badCellOffsetV) {
  const uint16_t frameLen = 16 + N_CELLS * 2 + 1 + 4 + 2;
  uint8_t frame[96];
  frame[0] = 0x4E; frame[1] = 0x57;
  frame[2] = (frameLen >> 8) & 0xFF; frame[3] = frameLen & 0xFF;
  frame[4] = 0x01; frame[5] = 0x01; frame[6] = 0x03; frame[7] = 0x01;

  uint16_t pack_mv = (uint16_t)(packV * 1000.0f);
  int16_t current_ma = currentA * 100;
  frame[8] = (pack_mv >> 8) & 0xFF; frame[9] = pack_mv & 0xFF;
  frame[10] = (current_ma >> 8) & 0xFF; frame[11] = current_ma & 0xFF;
  frame[12] = soc;
  frame[13] = 0x02; // discharge only (charge MOS off)
  frame[14] = alarms;
  frame[15] = N_CELLS;

  float cellBase = packV / N_CELLS;
  uint16_t idx = 16;
  for (uint8_t i = 0; i < N_CELLS; i++) {
    float cellV = cellBase;
    if (i == 3) cellV -= badCellOffsetV;       // weak cell
    if (i == 7) cellV -= badCellOffsetV * 0.5f;
    uint16_t mv = (uint16_t)(max(cellV, 0.5f) * 1000.0f);
    frame[idx++] = (mv >> 8) & 0xFF; frame[idx++] = mv & 0xFF;
  }
  frame[idx++] = 2;
  int16_t t1 = 620, t2 = 580; // ~62 C / 58 C (over-temp)
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
  Serial.println("BAD BMS emulator started (UART2 -> gateway)");
}

void loop() {
  static uint32_t t = 0;
  t++;
  float packV = 74.0f + 0.3f * sin(t * 0.1f);
  int16_t currentA = 55 + (int16_t)(20 * sin(t * 0.05f));
  uint8_t soc = 12 + (uint8_t)(3 * sin(t * 0.02f));
  float badOffset = 0.25f + 0.05f * sin(t * 0.03f);
  uint8_t alarms = 0x0B; // low voltage + cell diff + overcurrent bits
  sendFrame(packV, currentA, soc, alarms, badOffset);
  Serial.printf("BAD pack=%.2fV I=%dA SOC=%u%% offset=%.2fV\n",
                packV, currentA, soc, badOffset);
  delay(1000);
}
