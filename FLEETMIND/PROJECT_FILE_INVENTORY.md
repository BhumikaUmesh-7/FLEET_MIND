# FLEETMIND — Project File Inventory

This inventory documents the purpose and structure of all files in the repository.

```
.
├── .env.example                               # Environment template
├── .gitignore                                  # Git exclusion configuration
├── index.html                                  # HTML5 entrypoint with metadata & OpenGraph tags
├── metadata.json                               # AI Studio Applet configuration
├── package.json                                # Node.js dependencies & scripts
├── tsconfig.json                               # Strict TypeScript configuration
├── vite.config.ts                              # Vite build & Tailwind plugin config
├── Dockerfile                                  # Multi-stage production container build
├── docker-compose.yml                          # Fullstack multi-container orchestration
│
├── src/
│   ├── main.tsx                                # React application DOM mount
│   ├── index.css                               # Tailwind CSS v4 directives & theme styles
│   ├── App.tsx                                 # Main application shell, state management & router
│   │
│   ├── types/
│   │   └── index.ts                            # Complete TypeScript domain contracts & enums
│   │
│   ├── simulation/
│   │   ├── warehouse/
│   │   │   └── warehousePresets.ts             # Warehouse grid presets (Small, Medium, Congested)
│   │   ├── planner/
│   │   │   └── AStarPlanner.ts                 # Space-Time A* path planner & D* Lite invalidation
│   │   ├── coordination/
│   │   │   ├── MessageBus.ts                   # Decentralized P2P message bus with fault simulation
│   │   │   └── EdgeAgent.ts                    # Autonomous AMR EdgeAgent with negotiation & explainability
│   │   ├── allocation/
│   │   │   └── DynamicTaskAllocator.ts         # Multi-factor task scoring & dynamic reassignment
│   │   ├── engine/
│   │   │   └── SimulationEngine.ts             # Deterministic simulation loop, metrics & fault injection
│   │   └── experiments/
│   │       └── BenchmarkRunner.ts              # Scientific head-to-head Baseline vs FLEETMIND runner
│   │
│   └── components/
│       ├── layout/
│       │   └── Header.tsx                      # Top bar with sim controls, mode toggle & E-Stop
│       ├── dashboard/
│       │   └── KPIRow.tsx                      # Real-time KPI summary bar with units
│       ├── warehouse/
│       │   └── WarehouseCanvas.tsx             # Interactive 2D canvas with pan, zoom, routes & trails
│       ├── fleet/
│       │   └── RobotDrawer.tsx                 # AMR telemetry inspector & Edge Decision Explainability
│       ├── tasks/
│       │   └── TaskOperationsModal.tsx         # Task queue management & validated mission creation
│       ├── experiments/
│       │   └── ExperimentLab.tsx               # Head-to-head benchmark lab with CSV/JSON exports
│       ├── events/
│       │   └── FaultInjectionPanel.tsx         # Disruption center & timeline audit stream
│       ├── network/
│       │   └── CommunicationInspector.tsx      # P2P Gossip packet feed & network condition controls
│       ├── analytics/
│       │   └── AnalyticsView.tsx               # Fleet throughput, mission durations & energy metrics
│       ├── replay/
│       │   └── ReplayScrubber.tsx              # Historical simulation time-travel scrubber
│       ├── demo/
│       │   └── GrandFinaleDemo.tsx             # 10-step guided live presentation workflow
│       └── settings/
│           └── SettingsModal.tsx               # System presets, fleet scaling & canvas layer toggles
│
├── backend/
│   ├── main.py                                 # Python FastAPI server with REST & WebSockets
│   ├── requirements.txt                        # Python dependencies
│   └── Dockerfile                              # Backend container build
│
├── README.md                                   # Project documentation & quickstart
├── ARCHITECTURE.md                             # Deep architectural specification
├── PROJECT_FILE_INVENTORY.md                   # Complete file inventory (this file)
├── IMPLEMENTATION_STATUS.md                    # Detailed verification & phase status
├── TEST_RESULTS.md                             # Verification test matrix & build results
├── DEMO_GUIDE.md                               # Step-by-step judge presentation script
└── LIMITATIONS.md                              # Assumptions, simulation boundary & roadmap
```
