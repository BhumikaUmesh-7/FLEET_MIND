# FLEETMIND — System Architecture & Engineering Specifications

## 1. High-Level Architecture Diagram

```
                             FLEETMIND
             Edge-AI AMR Fleet Coordination Platform
                               |
        +----------------------+----------------------+
        |                                             |
   WEB DASHBOARD                               SIMULATION ENGINE
 (React + Vite + Canvas)                   (Deterministic Fixed-Timestep)
        |                                             |
  +-----+-----+                                 +-----+-----+
  |     |     |                                 |     |     |
 Map  Fleet Analytics                         AMR-01 AMR-02 AMR-N
  |     |     |                                 |     |     |
  +-----+-----+                                 +-----+-----+
        |                                             |
        |                                      Edge Coordination
        |                                             |
        +------------- Message Bus <------------------+
                               |
              +----------------+----------------+
              |                |                |
           A* Planner     Conflict Resolver  Task Allocator
          (Space-Time)      (Negotiation)     (Multi-Factor)
              |                |                |
              +----------------+----------------+
                               |
                        Metrics Engine
                               |
                      Live State / Replay
```

---

## 2. Decentralized Edge-Agent Model

Each Autonomous Mobile Robot (AMR) operates an isolated `EdgeAgent` instance containing:

1. **Local State & Sensor Model**:
   - Continuous 2D coordinates `(x, y)` and heading angle $\theta \in [0, 360)^\circ$.
   - Forward LiDAR scan detection checking clear corridors up to 3.0m ahead.
   - Core operating temperature and 48V battery voltage discharge telemetry.
   - Known blocked obstacle map updated via direct line-of-sight sensing and peer gossip.

2. **Onboard Space-Time A\* Planner**:
   - Computes time-expanded paths avoiding static geometry (walls, storage racks) and dynamic reservations.
   - Detects route invalidation when obstacles appear and calculates local detours without central dispatch.

3. **P2P Gossip & Intent Sharing**:
   - Broadcasts future space-time waypoints `(x, y, t)` and dynamic priority scores.
   - Receives peer heartbeats; detects peer communication timeouts (> 25 ticks).

4. **Multi-Agent Priority Negotiation**:
   - Calculates priority score:
     $$\text{Score} = (\text{Priority}_{\text{task}} \times 12) + \max(0, 100 - 2 \times d_{\text{goal}}) + (0.15 \times \text{Battery}) + (8 \times t_{\text{waiting}}) + \text{EmergencyBonus}$$
   - When two AMRs target the same corridor or intersection cell, the agent with higher priority retains right-of-way.
   - The lower-priority agent yields by either waiting, executing a lateral sidestep, or replanning an alternate route.

5. **Deadlock Detection & Resolution**:
   - Tracks consecutive waiting ticks $t_{\text{waiting}}$.
   - If both agents in conflict have $t_{\text{waiting}} \ge 3$, cyclic deadlock is detected.
   - Deterministic tie-breaking: lower ID executes an evasive sidestep manoeuvre to allow peer traversal.

---

## 3. Dynamic Task Allocation Engine

The `DynamicTaskAllocator` computes a multi-factor assignment cost:

$$\text{Cost} = (1.5 \times d_{\text{source}}) + \text{WorkloadPenalty} + 0.4 \times (100 - \text{Battery}) - (20 \times \text{CommReliability})$$

Workloads are automatically reassigned if:
- AMR battery drops below critical threshold ($< 20\%$).
- AMR path becomes completely impassable due to structural corridor blockages.
- AMR communication is partitioned or offline.

---

## 4. Scientific Baseline Comparison

To guarantee anti-fabrication integrity, the `BenchmarkRunner` runs identical configurations (warehouse preset, robot count, task queue, obstacle locations, and random seed) across two distinct coordination modes:

1. **Baseline (Stop-and-Wait)**: Conservative centralized proximity halting where AMRs stop whenever another robot is within 2 grid units.
2. **FLEETMIND (Decentralized Edge-AI)**: Full P2P reservation, spatial negotiation, and local dynamic replanning.

Measured metrics are compared directly with genuine mathematical percentage differences.
