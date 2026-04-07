# Motion Sensor Integration Guide

## Overview
This updated ESP8266 sketch adds a PIR motion sensor (sensor 501) to automatically control classroom lights based on detected movement.

## Hardware Setup

### Wiring
- **Motion Sensor (PIR 501)**
  - VCC → ESP8266 3.3V
  - GND → ESP8266 GND
  - OUT → D2 (GPIO 4)

- **Light Relays**
  - Continue using pins as configured in your database

## How It Works

### Motion Detection Logic
1. **When Motion Detected:**
   - Lights turn ON immediately (all classrooms)
   - Lights stay ON while motion continues

2. **When No Motion Detected:**
   - After 30 seconds of NO movement, lights turn OFF automatically
   - Timeout can be changed in `MOTION_TIMEOUT` variable

3. **Server Commands Integration:**
   - Motion sensor works alongside server commands
   - If motion is active: **Motion sensor takes priority** (keeps lights ON)
   - If no motion: **Server commands apply** (respects manual ON/OFF)

### Code Sections

#### Motion Sensor Configuration
```cpp
#define MOTION_SENSOR_PIN D2  // GPIO 4
#define MOTION_TIMEOUT 30000  // 30 seconds in milliseconds
```

#### Key Functions
- `checkMotionSensor()` - Reads sensor and manages timeout logic
- `turnOnAllLights()` - Activates all relay pins
- `turnOffAllLights()` - Deactivates all relay pins
- `pollServerState()` - Fetches server state and respects motion priority

## Configuration Options

### Change Motion Timeout
Edit this line (time in milliseconds):
```cpp
#define MOTION_TIMEOUT 30000  // Change value here
```
- 30 seconds = 30000
- 60 seconds = 60000
- 5 minutes = 300000

### Change Motion Sensor Pin
If using different GPIO:
```cpp
#define MOTION_SENSOR_PIN D2  // Change D2 to your pin
```

## Serial Monitor Output Example
```
Motion DETECTED! Turning lights ON
Light ON - Pin: 5
Light ON - Pin: 12

Motion timeout! No movement for 30 seconds, turning lights OFF
Light OFF - Pin: 5
Light OFF - Pin: 12

Polling server...
Classroom: Class-63, Pin: 5, State: ON (Motion detected)
```

## Testing Tips

1. **Upload the sketch** using Arduino IDE
2. **Open Serial Monitor** (115200 baud rate)
3. **Wave your hand** near the motion sensor - should see "Motion DETECTED"
4. **Stop moving** - after 30 seconds should see "Motion timeout"
5. **Monitor output** to verify lights turning ON/OFF with correct pins

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Motion sensor not triggering | Verify wiring to D2 (GPIO 4), check sensor calibration time (usually 30-60 seconds after power) |
| Lights always ON | Check if motion sensor is stuck detecting, adjust sensor sensitivity dial |
| Lights not turning OFF after timeout | Verify MOTION_TIMEOUT value, check serial output for errors |
| Conflicts with server commands | Motion takes priority when detected - this is by design |

## Files
- `classroom_lights_with_motion.ino` - Main sketch with motion sensor
- `ESP8266_SETUP_GUIDE.md` - Original setup guide (unchanged)
