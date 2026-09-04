# SmartFleet AI

A real-time fleet operations system that connects vehicle diagnostics, driver hours, workshop scheduling, and transport compliance into an automated, multi-agent control tower.

Built specifically to solve the disconnected data problem in commercial logistics—where telematics, maintenance workshops, FASTag tolls, and RTO paperwork exist in separate silos, leading to preventable vehicle breakdowns and expensive idle time.

---

## The Problem It Solves

If you run or manage commercial freight trucks in India (Tata Prima, Ashok Leyland, BharatBenz, etc.), your daily headache looks like this:

1. **Unexpected Roadside Breakdowns:** BS-VI engines are sensitive. A neglected AdBlue (DEF) tank or a clogged Diesel Particulate Filter (DPF) will suddenly throw the truck into limp mode on the highway. By the time a driver calls the depot, the haul is already delayed by 12+ hours.
2. **Blind Dispatching:** Dispatchers often assign a long haul to a driver who has already logged 8 hours of driving, or send a truck that has an overdue oil change onto a high-stress ghat section (like Mumbai–Pune expressway or NH-44).
3. **RTO Compliance Fines:** Tracking Fitness Certificates (FC), National Permits, Goods Carriage Insurance, and Road Tax across 50+ vehicles on spreadsheets leads to missed renewal dates. Getting stopped at an interstate border checkpost with an expired FC means impounded vehicles and hefty fines under the Motor Vehicles Act.
4. **Sub-optimal Routing:** Most routing apps only optimize for the shortest distance. They ignore pavement roughness (which ruins suspensions and pops tires), live monsoon waterlogging, and high FASTag toll corridors.

SmartFleet AI connects these data streams in real time. Instead of having a human dispatcher switch between five spreadsheets and three GPS portals, four coordinated software agents continuously analyze the data, flag risks, and automate decisions.

---

## How It Works (Multi-Agent Architecture)

The system is organized into four specialized agents that share state through an operational consensus coordinator:

```
                      +------------------------------------------+
                      |       Chief Operations Coordinator       |
                      |   (Arbitrates conflicts & daily dispatch)|
                      +--------------------+---------------------+
                                           |
         +---------------------------------+---------------------------------+
         |                                 |                                 |
         v                                 v                                 v
+------------------+             +-------------------+             +-------------------+
|    Predictive    |             |  Smart Dispatch   |             |    Autonomous     |
|   Maintenance    |             |    & Routing      |             |    Compliance     |
+--------+---------+             +---------+---------+             +---------+---------+
         |                                 |                                 |
  Live OBD-II stream,               5-factor corridor               RTO expiry alerts,
  BS6 DPF / AdBlue,                 scoring & weather               MV Act penalty logs,
  TPMS wheel pressures               hazard radar                    SHA audit receipts
```

### 1. Chief Operations Coordinator
The "air traffic controller" of the fleet. When another agent raises an alert—for example, the maintenance agent flags a high DPF soot level on truck `MH-12-RN-4821`—the Coordinator checks if that truck has an assigned high-priority delivery. It then decides whether to reassign the trip to an idle vehicle or route the truck to the nearest authorized service center first.

### 2. Predictive Maintenance Agent
Monitors continuous telemetry:
- Coolant temperature & oil pressure
- Individual wheel tire pressure (TPMS)
- BS-VI exhaust aftertreatment: AdBlue DEF level, DPF soot accumulation (grams), SCR efficiency, and NOx levels
- Computes **Remaining Useful Life (RUL)** and **Time-to-Failure (TTF)** in operating hours to generate preventive service tickets *before* roadside breakdown occurs.

### 3. Smart Dispatch & Routing Agent
Computes route feasibility using a **5-parameter weighted cost function**:
$$\text{Cost} = w_1(\text{Distance}) + w_2(\text{Live Delay}) + w_3(\text{Pavement Roughness / IRI}) + w_4(\text{FASTag Toll}) + w_5(\text{Elevation/Fuel})$$

It also checks:
- **Corridor Weather Radar:** Flags active heavy rain, waterlogging, or heat warnings on major Indian freight highways (NH-48, NH-44, NH-19).
- **Driver Fatigue & Hours of Service (HOS):** Prevents dispatching drivers exceeding recommended continuous driving limits.

### 4. Autonomous Compliance Agent
Keeps every vehicle street-legal:
- Monitors Fitness Certificate (FC), RC, Goods Carriage Insurance, All-India National Permit, and Road Tax.
- Calculates pending regulatory liability in Rupees (₹) based on active Motor Vehicles Act penalty rates.
- Issues digitally verifiable compliance audit summaries with SHA hash receipts.

---

## What's Included in the Platform

- **Live Fleet Control Tower:** Real-time map with vehicle cards showing speed, fuel, driver, location, and operational status.
- **5-Factor Route Optimizer & Road Hazard Radar:** Interactive corridor comparison with weather overlay and turn-by-turn guidance.
- **OBD-II Subsystem Diagnostics:** Live gauges for engine load, RPM, intake air temp, fuel rail pressure, plus one-click DTC code scanner and MIL clear tool.
- **Cargo Door Smart Latch:** Remote lock/unlock workflow with two-man rule approval, 60-second automatic relock timer, and tamper detection.
- **FASTag Toll Management:** Live toll plaza detection, deduction ledger, download receipts, and quick ₹1,000 balance recharge.
- **Fleet CCTV & Dashcam Viewer:** Multi-camera live streaming grid with screenshot capture, full-screen playback, and incident clip export.
- **Load & Weighbridge Slips:** Digital manifest tracking with axle weight distribution checks and CSV export.
- **Granular Role-Based Access Control:** Pre-configured permission sets for Fleet Admins, Dispatchers, Technicians, Compliance Officers, and Drivers.

---

## Tech Stack

| Layer | Technologies Used | Rationale |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Fast build cycles and type-safe state modeling |
| **Styling & UI** | Tailwind CSS, Radix UI, Lucide Icons | Clean, accessible dashboard components (dark & light modes) |
| **State Management** | React Context (`SimulationContext`), TanStack Query | Centralized telemetry loop with reactive UI updates |
| **Maps & Corridors** | Leaflet, React-Leaflet | Lightweight GIS mapping without expensive proprietary API billing |
| **Visualizations** | Recharts | Responsive charts for fuel burn, sensor trends, and diagnostic gauges |
| **Backend / DB** | Supabase (Postgres, Realtime, Auth, Edge Functions) | Instant backend with built-in real-time pub/sub |
| **Offline Fallback** | In-memory simulation engine | Fully functional demo mode even without an active Supabase database |

---

## Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or later)
- npm (bundled with Node) or pnpm / yarn

### 1. Clone & Install
```bash
git clone https://github.com/your-username/smartfleet-ai.git
cd smartfleet-ai
npm install
```

### 2. Environment Setup (Optional)
The project runs completely out of the box in **offline demo mode** using an internal telemetry simulator.

If you wish to connect your own Supabase database, create a `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:8080/`.

---

## Available NPM Scripts

```bash
npm run dev        # Launch local Vite dev server (hot reload enabled)
npm run build      # Typecheck with tsc and build production bundle into /dist
npm run preview    # Preview the production build locally
npm run test       # Run unit tests via Vitest
npm run lint       # Run ESLint across TypeScript and TSX files
```

---

## Project Directory Layout

```text
smartfleet-ai/
├── public/                 # Static assets, map markers, and favicon
├── src/
│   ├── components/
│   │   ├── cargo/          # Remote smart latch & door security controls
│   │   ├── common/         # Modals, forms, status pills, search dialogs
│   │   ├── dashboard/      # Telemetry cards, TPMS diagram, BS6 indicators
│   │   ├── layout/         # Sidebar navigation, header, quick switcher
│   │   ├── routing/        # 5-parameter route comparison & weather radar
│   │   ├── ui/             # Radix + Tailwind primitive components
│   │   └── views/          # 18 full dashboard views (Fleet, Routes, Fuel, etc.)
│   ├── contexts/
│   │   └── SimulationContext.tsx   # Centralized loop driving vehicle telemetry
│   ├── data/               # Realistic Indian highway waypoints, initial mock data
│   ├── hooks/              # Custom hooks for telemetry, permissions, and agent consensus
│   ├── lib/                # Multi-agent logic, routing math, CSV generation
│   ├── App.tsx             # Route declarations and provider wrapping
│   └── main.tsx            # React DOM mounting
├── package.json            # Dependencies and npm script targets
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and path alias settings
```

---

## The Simulation Engine (Testing Without Physical Hardware)

In production, telematics data is ingested via an MQTT or HTTP telematics gateway connected to vehicle OBD-II / J1939 CAN bus hardware.

For local development and testing, this repo includes a built-in simulation engine (`SimulationContext.tsx`):
- **Highway Waypoint Interpolation:** Vehicles realistically travel along actual Indian national highways (e.g., NH-48 Mumbai–Bengaluru, NH-44 Delhi–Chennai) rather than teleporting.
- **Dynamic Sensor Noise:** Engine temperature, tire pressure, and fuel levels fluctuate naturally with vehicle speed and simulated ambient heat.
- **Toll Crossing Detection:** Triggers automated FASTag deductions when a vehicle enters the bounding box of a toll plaza.
- **Full Interactive Mutability:** Every button works end-to-end—you can clear DTC error codes, request and approve door unlock codes, add maintenance records, schedule new trips, and export audit logs to CSV.

---

## Troubleshooting & Common Gotchas

- **Port 8080 already in use:** If port 8080 is occupied by another local service, Vite will automatically select the next available port (e.g., 8081). Check the terminal output after running `npm run dev`.
- **Leaflet map tiles not rendering:** Ensure your machine has internet access to fetch open OpenStreetMap tile layers. If tiles appear grey, inspect browser console for any ad-blockers blocking tile domain requests.
- **Supabase credentials empty:** This is completely normal for local evaluation. The app checks for credentials and seamlessly falls back to the in-memory mock store so all views and action buttons stay functional.

---

## License

Distributed under the MIT License. See `LICENSE` for more details.
