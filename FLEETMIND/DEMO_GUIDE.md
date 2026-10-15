# FLEETMIND — Live Hackathon Demo Guide

Follow this guide to demonstrate FLEETMIND to judges or evaluators.

---

## ⚡ 2-Minute Quick Presentation Script

1. **Open the Application**:
   Notice the **dark industrial control-room aesthetic**, the live 2D warehouse map, and the 10 real-time KPI telemetry cards across the top ribbon.

2. **Click "DEMO FLOW" (Top Right Header)**:
   This opens the **Grand Finale 10-Step Interactive Workflow**.

3. **Step 1: Simulation Genesis**:
   - Click **Run Step**.
   - 5 AMRs (`R-01` to `R-05`) deploy on the Medium warehouse grid.
   - Tasks are automatically assigned by the `DynamicTaskAllocator`.
   - Each robot computes its path and begins traversing aisles.

4. **Step 2: Overlapping Paths & Intent Sharing**:
   - Click **Run Step**.
   - A critical mission is injected creating corridor contention.
   - Observe the AMRs sharing future waypoints via P2P.
   - The higher-priority robot proceeds; the other yields without colliding!

5. **Step 3: Aisle Blockage & Dynamic Replanning**:
   - Click **Run Step**.
   - A pallet blockage appears at `(10, 6)`.
   - The affected robot detects the blocked aisle, marks it on its local map, and executes an A\* replan around the racks.

6. **Step 4: Dynamic Task Reassignment**:
   - Click **Run Step**.
   - The active robot's battery is depleted below 20%.
   - Notice the mission is automatically reassigned to the nearest available candidate robot.

7. **Step 5: Communication Loss Resilience**:
   - Click **Run Step**.
   - Wi-Fi is severed for `R-01`.
   - The robot transitions to offline edge resilience, using its simulated LiDAR array to safely continue.

8. **Step 6: Deadlock Resolution**:
   - Click **Run Step**.
   - A choke point is created.
   - After 3 waiting ticks, the cyclic deadlock protocol triggers an evasive lateral sidestep.

9. **Step 7: Low Battery Autonomous Recharging**:
   - Click **Run Step**.
   - AMR battery reaches threshold and navigates to the yellow Charging Dock (`⚡`).

10. **Steps 8–10: Scientific Baseline vs FLEETMIND Benchmark**:
    - Click **Run Step** to open the **Scientific Benchmark Lab**.
    - Click **Run Benchmark**.
    - Watch the progress bar execute Baseline Stop-and-Wait and FLEETMIND under identical seeds.
    - Inspect the genuine comparison table: observe zero collisions, higher throughput, and export CSV/JSON reports!

---

## 🔍 Deep-Dive Navigation

- **Click any AMR on the Map**: Opens the **Robot Drawer** showing telemetry and the **Edge Decision Explainability** panel (`Decision`, `Why`, `Inputs`, `Alternatives`, `Action`).
- **Click "Tasks"**: Inspect the mission lifecycle table or dispatch a custom task between any stations.
- **Click "Fault Injection"**: Interactively block custom aisles or inject network partitions.
- **Click "P2P Mesh Network"**: Inspect the real-time broadcast packet log and adjust latency/loss sliders.
