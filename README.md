# ENGG1101 Smart Helmet — Fall & Helmet Removal Detection System

A Raspberry Pi 5-based smart safety helmet with real-time sensor monitoring, fall detection, helmet removal alerts, and a React web dashboard accessible over LAN.

---

## Hardware

| Component | Model | GPIO / I2C |
|-----------|-------|------------|
| IMU | MPU6050 | I2C (addr 0x68) |
| ToF Distance | VL53L0X | I2C (addr 0x29) |
| Light Sensor | BH1750 | I2C (addr 0x23) |
| OLED Display | SSD1306 128x64 | I2C (addr 0x3C) |
| Ultrasonic | HC-SR04 | Trig=GPIO23, Echo=GPIO24 |
| Temp/Humidity | DHT22 | GPIO21 |
| Touch Sensor | Generic | GPIO18 |
| IR Proximity | Generic | GPIO20 (active-low) |
| Buzzer | KY-006 | GPIO17 (PWM) |

**I2C bus:** SDA=GPIO2, SCL=GPIO3

---

## Quick Start

### 1. Clone the Repo on Your Pi

```bash
cd ~
git clone https://github.com/27racer/ENGG1101_final-.git
cd ENGG1101_final-
```

### 2. Run the Backend (Sensors + Alerts)

```bash
cd pi
bash setup.sh          # enables I2C, installs deps, creates venv
source venv/bin/activate
python3 smart_helmet.py
```

You should see sensor readings every ~300ms:
```
[  OK  ] A(+0.34,-0.09,-0.91)g  G(-2.6,+1.2,-0.8)d/s  US=45.2cm  ToF=142mm  T=26.1C  H=58%  HI=26.3C  Lux=320  Touch=N  IR=Y  Helmet=ON
```

### 3. Run the API (REST Bridge)

In a **new terminal** (keep smart_helmet.py running):

```bash
cd pi
source venv/bin/activate
HELMET_API_PORT=8001 python3 helmet_api.py
```

The API serves:
- `GET /` → API info
- `GET /api/` → API info
- `GET /api/sensors` → Live sensor JSON
- `GET /api/health` → Health check
- `POST /api/reset-fall` → Reset fall detection flag

### 4. Build and Serve the Frontend

On your **laptop** (or on the Pi):

```bash
cd web
npm install
npm run build
```

To serve on the Pi for phone access:

```bash
python3 serve_spa.py
# or with a specific port:
PORT=8000 python3 serve_spa.py
```

---

## Accessing the App

| Service | Port | URL |
|---------|------|-----|
| **React Web App** | 8000 | `http://<pi-ip>:8000` |
| **Sensor API** | 8001 | `http://<pi-ip>:8001` |

Find your Pi's IP:
```bash
hostname -I
```

In the web app's **Settings** page, enter the API URL:
```
Pi URL: http://<pi-ip>:8001
```

The app polls `/api/sensors` every 500ms and displays live data.

---

## Systemd Services (Auto-Start on Boot)

### Install Services

```bash
# Sensor + buzzer + OLED (runs as your user)
sudo cp pi/helmet-smart.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable helmet-smart

# REST API
sudo cp pi/helmet-api.service /etc/systemd/system/
sudo sed -i 's/5000/8001/' /etc/systemd/system/helmet-api.service
sudo systemctl daemon-reload
sudo systemctl enable helmet-api

# Web frontend
sudo cp web/helmet-web.service /etc/systemd/system/
sudo sed -i 's/8000/8000/' /etc/systemd/system/helmet-web.service
sudo systemctl daemon-reload
sudo systemctl enable helmet-web

# Start all
sudo systemctl start helmet-smart helmet-api helmet-web
```

### Service Commands

```bash
# Status
sudo systemctl status helmet-smart
sudo systemctl status helmet-api
sudo systemctl status helmet-web

# View logs
sudo journalctl -u helmet-smart -f
sudo journalctl -u helmet-api -f
sudo journalctl -u helmet-web -f

# Restart
sudo systemctl restart helmet-smart
sudo systemctl restart helmet-api
sudo systemctl restart helmet-web
```

---

## Architecture

```
smart_helmet.py          ← Sensors, fall/helmet detection, buzzer, OLED
        ↓ (writes to /tmp/helmet_api_state.json every loop)
helmet_api.py            ← Flask REST API (reads state file, no GPIO)
        ↓ HTTP /api/sensors (every 500ms from React app)
React Web App            ← Dashboard, 3D viewer, settings page
        ↓
Browser on phone         ← http://<pi-ip>:8000
```

The two Python processes share state via `/tmp/helmet_api_state.json`. This allows `smart_helmet.py` to own all GPIO/sensors while `helmet_api.py` serves HTTP without GPIO conflicts.

---

## Troubleshooting

### DHT22 shows "--" for temperature/humidity
The DHT22 sensor may not be connected or has a GPIO conflict. This is non-fatal — all other sensors continue working.

### Sensors return 503 "stale data"
- Make sure `smart_helmet.py` is still running
- Check: `cat /tmp/helmet_api_state.json`
- Restart: `sudo systemctl restart helmet-smart helmet-api`

### Port already in use
```bash
sudo fuser -k 8000/tcp  # kill whatever's on port 8000
sudo systemctl restart helmet-web
```

### GPIO busy / "Unable to set line 21 to input"
A leftover `libgpiod_pulsein64` process is holding the GPIO. Kill it:
```bash
sudo pkill -f libgpiod_pulsein64
sudo systemctl restart helmet-smart
```

### App shows "URL not found"
Make sure the Pi URL in Settings ends with no trailing slash:
```
http://172.29.26.232:8001
```
(not `http://172.29.26.232:8001/`)

### ToF shows 8191mm (max range)
Nothing is in front of the sensor — this is normal when no object is detected.

---

## Project Structure

```
ENGG1101_final-/
├── pi/
│   ├── smart_helmet.py       Main sensor/alerts application
│   ├── helmet_api.py         Flask REST API bridge
│   ├── requirements.txt      Python pip dependencies
│   ├── setup.sh             Pi setup script (I2C, venv, deps)
│   └── helmet-smart.service  Systemd service file
│
└── web/
    ├── src/                  React TypeScript source
    │   ├── api/              API client (piSensors.ts)
    │   ├── components/       UI components (HelmetViewer, SensorSection, etc.)
    │   ├── context/          React context (SensorDataContext)
    │   ├── pages/            Pages (Dashboard, Settings, Alerts)
    │   └── types/            TypeScript types
    ├── public/models/        3D helmet model files
    ├── serve_spa.py          Threaded SPA HTTP server
    ├── package.json
    └── vite.config.ts
```
