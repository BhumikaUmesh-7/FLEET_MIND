# FLEETMIND — Edge-AI Distributed AMR Fleet Coordination

> **Edge Fleet-AI**: Edge-AI Based Distributed Fleet Coordination for Autonomous Mobile Robots (AMRs) in Smart Warehouses.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal.svg)](https://fastapi.tiangolo.com/)

---

## 🚀 Overview

FLEETMIND is a production-grade, simulation-driven **Edge-AI AMR fleet coordination platform**. Unlike legacy centralized robot controllers that represent single points of failure and suffer from latency bottlenecks, FLEETMIND treats each AMR as an **independent edge agent** equipped with:

- **Onboard Space-Time A\* Path Planning** with dynamic obstacle replanning.
- **Peer-to-Peer (P2P) Gossip & Intent Sharing** broadcasting upcoming waypoints without a central supervisor.
- **Decentralized Multi-Agent Conflict Resolution** negotiating right-of-way based on dynamic multi-factor priority scores.
- **Deadlock Detection & Resolution Protocols** breaking cyclic waiting in narrow corridors via deterministic sidestepping.
- **Dynamic Task Reassignment** automatically redistributing workloads when robots encounter obstacles or low battery.
- **Communication Failure Resilience** continuing safe local traversal using onboard LiDAR and ultrasonic sensor arrays when isolated.
- **Empirical Scientific Benchmark Lab** measuring genuine performance advantages against a centralized Stop-and-Wait baseline.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas 2D Engine |
| **Simulation Engine** | Deterministic Fixed-Timestep Engine, Space-Time A\* Planner, EdgeAgent Architecture |
| **P2P Networking** | Distributed Message Bus with simulated latency, packet loss, and partition triggers |
| **Backend API** | Python 3.11, FastAPI, WebSockets, Uvicorn (with Node.js/Vite server support) |
| **DevOps & Containers**| Docker, Docker Compose |

---

## 📦 Quick Start & Local Setup

### Option 1: Run with Node.js / Vite (Default)

```bash
# 1. Clone repository
git clone https://github.com/your-username/fleetmind.git
cd fleetmind

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser to `http://localhost:3000`.

### Option 2: Run with Docker Compose (Frontend + FastAPI Backend)

```bash
docker-compose up --build
```

- Web Command Center: `http://localhost:3000`
- Python FastAPI REST & WebSocket Docs: `http://localhost:8000/docs`

---

## 🧭 Navigation & Core Features

- **Command Center (`/dashboard`)**: Interactive 2D warehouse map with pan/zoom, live robot markers, heading vectors, trajectory trails, and audit logs.
- **Fleet Telemetry (`/fleet`)**: Detailed diagnostics for each AMR, onboard LiDAR sensor readings, battery discharge, and **Edge Decision Explainability**.
- **Task Operations (`/tasks`)**: Live mission lifecycle queue, validated task creation, and allocation score breakdowns.
- **Analytics (`/analytics`)**: Real-time throughput (tasks/hr), mission durations, collision counts, and energy consumption proxies.
- **Scientific Benchmark Lab (`/experiments`)**: Controlled head-to-head simulations comparing Stop-and-Wait Baseline with FLEETMIND. Real measured metrics with CSV/JSON exports.
- **Fault Injection (`/events`)**: Manual injection of aisle blockages, temporary obstacles, battery drains, communication loss, and network partitions.
- **P2P Gossip Inspector (`/network`)**: Live packet stream of peer-to-peer broadcasts with simulated network latency and packet drop rates.
- **Grand Finale Demo Mode**: 10-step guided live presentation workflow with one-click triggers.

---

## 📐 Architecture & Principles

Read [`ARCHITECTURE.md`](ARCHITECTURE.md) for full architectural specifications, data flow diagrams, and decentralized state management contracts.

---

## 📄 License

Licensed under the Apache License, Version 2.0.
