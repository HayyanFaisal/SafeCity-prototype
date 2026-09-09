# SafeCity Prototype

A dark-themed React + TypeScript + Vite surveillance command-center prototype for the Naval Anchorage / Pindi Housing Society AI Safe City Command Center.

## Project Overview

This project simulates a smart-city CCTV command center with:

- role-based access control (Super Admin, Operator / Analyst, Security Guard)
- live grid monitoring with mounted local .mp4 streams
- GIS-style map management with camera pin plotting
- forensic playback / timeline event markers
- automated alerting and toast flows
- model priority management
- incident log with PDF-style export action
- trajectory reconstruction search panel

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Native HTML5 video playback

## Current Status / Progress

This repository is best described as a polished frontend prototype rather than a production-grade surveillance platform.

### Implemented

- RBAC switching between roles
- Interactive GIS map mode with upload + pin editing flow
- Camera node plotting and direct link to video streams
- Drag-and-drop live grid tile swapping
- Multiple grid layouts
- Playback and forensic inspection panel
- Alert modal, floating toast system, and siren audio feedback
- Priority bucket UI for AI model response handling
- Incident log filtering and export workflow
- Trajectory query visualization

### Still Simulated / Not Production Backend

- No real CCTV media server integration
- No real GIS backend or persistent map database
- No authenticated multi-user backend or database
- No real AI model inference engine
- No true cross-device streaming architecture
- No enterprise audit database or secure RBAC service

### Progress Estimate

- Product UI & interaction prototype: 82%
- Functional simulation completeness: 78%
- Production readiness: 15%

## Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/HayyanFaisal/SafeCity-prototype.git
cd SafeCity-prototype
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the developer server

```bash
npm run dev
```

Then open the local Vite address shown in the terminal, typically:

```text
http://localhost:5173
```

### 4. Production build

```bash
npm run build
```

## How to Use the App

### Role Switcher

Use the top bar role dropdown to switch between:

- Super Admin
- Operator / Analyst
- Security Guard (View-Only)

### Live Grid

- Click empty tiles to mount a local .mp4 file
- Switch layouts from the toolbar
- Drag one tile onto another to swap streams
- Use the master Play / Pause control for all mounted streams

### GIS Map

- In Super Admin mode, enable Edit Mode
- Upload a custom map image
- Click the map to create a camera pin
- Configure camera ID, name, IP, enabled models, and video stream
- In operational mode, click pins to jump into forensic playback

### Forensics / Playback

- Open any stream from the grid or map
- Use the timeline scrubber to inspect events
- Hover over markers for confidence metadata
- Click a marker to jump directly to that timestamp

### Incident & Trajectory Tools

- Use the Trajectory Search tab to run a plate or person-based query
- Use the Incident Alert Log tab to filter events and export an incident report

### Model Assignment & Priority Manager

- Open the drawers from the sidebar or top bar
- Reassign model priority buckets
- Enable / disable models per camera stream

## Notes

This repository is intended as a polished frontend demonstration and evaluation prototype for surveillance-dashboard workflows.

## License

This project is provided for prototype/demo purposes.
