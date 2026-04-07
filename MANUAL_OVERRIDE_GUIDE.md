# Manual Override Feature for Classroom Lights

## Problem
Previously, when the motion sensor detected movement, it would automatically turn lights ON. However, if you manually turned the lights OFF via the UI/server, the motion sensor would immediately turn them back ON because the Arduino was continuously polling the server state while motion was still being detected.

## Solution: Manual Override System
The updated system now respects your manual control decisions with a **5-minute manual override feature**.

## How It Works

### 1. **Automatic Mode (Default)**
- Motion sensor detects movement → Lights turn ON automatically
- No motion for 30 seconds → Lights turn OFF automatically
- Any manual control is ignored during motion detection

### 2. **Manual Override Activation**
When you manually turn lights OFF via the UI while motion is detected:
- The system detects the discrepancy (Server says OFF, but motion is active)
- A **5-minute manual override timer** is activated
- During this 5-minute period: **Motion sensor commands are IGNORED**
- Lights stay OFF as per your manual command

### 3. **Override Expiration**
After 5 minutes without manual interaction:
- The override is cleared
- Motion sensor returns to normal operation
- Motion detection works automatically again

## Configuration

The manual override duration can be adjusted in the Arduino sketch:

```cpp
const unsigned long MANUAL_OVERRIDE_DURATION = 300000;  // 5 minutes in milliseconds
```

To change it:
- **1 minute:** `60000`
- **2 minutes:** `120000`
- **3 minutes:** `180000`
- **5 minutes:** `300000` (default)
- **10 minutes:** `600000`

## Usage Example

**Scenario:** You're in a classroom and don't want the lights to keep turning on due to motion detection.

1. Motion is detected → Lights turn ON
2. You manually toggle lights OFF via the dashboard/UI
3. System recognizes manual override and activates 5-minute protection
4. Even if motion is detected again, lights stay OFF
5. After 5 minutes of no manual interaction, automatic motion detection resumes

## Serial Monitor Output

When manual override is active, you'll see messages like:
```
*** MANUAL OVERRIDE DETECTED for Group - 64 - respecting user's OFF command for 300 seconds ***
Classroom Group - 64: Manual override ACTIVE (expires in 285 seconds)
```

When the override expires:
```
Classroom Group - 64: Manual override EXPIRED, returning to auto mode
```

## Light Control Priority

When an override is active, the priority is:
1. **Manual Override** (highest priority when active)
2. Server Command (when override is inactive)
3. Motion Sensor (only when override and server don't override)

## Benefits

✅ **User Control:** You can manually control lights without fighting the motion sensor
✅ **Auto Recovery:** System automatically returns to automatic motion detection after 5 minutes
✅ **Energy Efficient:** Combines automated motion detection with manual override capability
✅ **No Network Dependency:** Override works even if communication is delayed

## Technical Details

The implementation adds tracking for each classroom:
- `manualOverrideActive[]` - Whether override is currently active
- `manualOverrideTimes[]` - Timestamp when override was activated
- `MANUAL_OVERRIDE_DURATION` - How long override remains active (5 minutes)

The system continuously checks:
1. Is motion being detected?
2. Is there an active manual override?
3. What does the server command say?
4. What should the relay do?

## Troubleshooting

**Issue:** Lights are turning on immediately after being turned off
- **Solution:** The override is likely expired. Once activated, it lasts 5 minutes. Contact the administrator if the duration needs to be adjusted.

**Issue:** Override isn't working
- **Solution:** Check the serial monitor output. The server must respond with state=0 (OFF) for override to activate. If the server shows state=1 (ON), the override won't activate.

**Issue:** Lights stay off too long
- **Solution:** The manual override duration can be increased by adjusting `MANUAL_OVERRIDE_DURATION` in the Arduino sketch.

