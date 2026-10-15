# FLEETMIND — Simulation Assumptions, Limitations & Future Roadmap

## 1. Simulation vs Physical Hardware Boundary

FLEETMIND is an advanced **simulation-first software prototype** built to demonstrate decentralized multi-agent coordination principles. In accordance with the Anti-Fabrication Constitution, the following distinctions are explicitly clarified:

| Component | Simulation Model (Current) | Physical Hardware (Future Production) |
|---|---|---|
| **World Representation** | Discrete 2D grid cells (1m x 1m equivalent) | Continuous 2D/3D SE(2) metric space with sub-centimeter localization (SLAM / LiDAR odometry). |
| **Motion Kinematics** | Discrete grid steps with 4-directional headings | Differential drive or omnidirectional wheel kinematics with acceleration, inertia, and non-holonomic constraints. |
| **Sensors** | Simulated raycasted LiDAR forward scans and proximity distances | Physical 2D/3D safety LiDAR scanners (e.g., SICK, Hokuyo) and Time-of-Flight depth cameras. |
| **P2P Networking** | In-process message bus with simulated latency, packet drop, and partitions | Physical wireless mesh network (802.11ah HaLow, ROS 2 / Zenoh, or MQTT over local broker). |
| **Edge Compute** | WebAssembly / TypeScript execution in browser & Python backend | NVIDIA Jetson Orin Nano or Raspberry Pi 5 onboard compute on each physical AMR. |

---

## 2. Technical Limitations

1. **Grid Granularity**:
   AMRs navigate cell centers. Sub-cell continuous curvature paths (e.g. Dubins curves or spline smoothing) are planned for future kinematic iterations.

2. **Network Protocol**:
   The current web demonstration executes the P2P gossip protocol over an in-process simulated bus with configurable packet loss and latency. A production hardware deployment requires real-world UDP/Zenoh mesh transports.

3. **Collision Avoidance Algorithm**:
   FLEETMIND currently employs space-time reservation negotiation and deterministic sidestep deadlock breaking. Full ORCA (Optimal Reciprocal Collision Avoidance) in continuous velocities is architected as the next kinematic phase.

---

## 3. Future Roadmap

- [ ] ROS 2 / micro-ROS driver bridge for physical turtlebots and industrial AMRs.
- [ ] Learned traffic flow prediction using graph neural networks (GNNs) on historical routing graphs.
- [ ] 3D digital twin visualization using WebGL / Three.js.
- [ ] Hardware-in-the-loop (HIL) testing harness with real MQTT broker endpoints.
