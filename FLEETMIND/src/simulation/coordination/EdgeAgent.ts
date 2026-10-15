import {
  DecisionExplanation,
  MessageType,
  PeerMessage,
  Position,
  Robot,
  RobotStatus,
  Task,
  WarehouseGrid,
} from '../../types';
import { AStarPlanner } from '../planner/AStarPlanner';
import { isCellTraversable } from '../warehouse/warehousePresets';
import { MessageBus } from './MessageBus';

export interface EdgeAgentContext {
  grid: WarehouseGrid;
  allRobots: Map<string, Robot>;
  messageBus: MessageBus;
  simTime: number;
  coordinationMode: 'FLEETMIND_DECENTRALIZED' | 'BASELINE_STOP_AND_WAIT';
}

export class EdgeAgent {
  public robot: Robot;
  private messageBus: MessageBus;
  private unsubscribeBus?: () => void;
  private knownPeerIntents: Map<string, { target: Position | null; nextPos: Position | null; priorityScore: number }> = new Map();
  private peerHeartbeats: Map<string, number> = new Map();

  constructor(robot: Robot, messageBus: MessageBus) {
    this.robot = { ...robot };
    this.messageBus = messageBus;
    this.setupMessaging();
  }

  private setupMessaging() {
    this.unsubscribeBus = this.messageBus.subscribe(this.robot.id, (msg: PeerMessage) => {
      this.handleIncomingMessage(msg);
    });
  }

  public destroy() {
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
    }
  }

  private handleIncomingMessage(msg: PeerMessage) {
    this.peerHeartbeats.set(msg.fromRobotId, msg.simTime);

    switch (msg.type) {
      case 'POSITION_UPDATE':
      case 'INTENT_UPDATE':
        this.knownPeerIntents.set(msg.fromRobotId, {
          target: msg.payload.target,
          nextPos: msg.payload.nextPos,
          priorityScore: msg.payload.priorityScore || 50,
        });
        break;

      case 'BLOCKED_AISLE':
        if (msg.payload && msg.payload.x !== undefined && msg.payload.y !== undefined) {
          const key = `${msg.payload.x},${msg.payload.y}`;
          if (!this.robot.localMapKnownBlocked.includes(key)) {
            this.robot.localMapKnownBlocked.push(key);
            // Check if our current path intersects
            if (this.robot.plannedPath.some((p) => p.x === msg.payload.x && p.y === msg.payload.y)) {
              this.robot.status = 'REROUTING';
            }
          }
        }
        break;

      case 'EMERGENCY_STOP':
        this.robot.status = 'EMERGENCY_STOP';
        this.recordDecision(
          'Emergency Stop Activated',
          'Received fleet-wide emergency stop broadcast from peer network',
          { commReliability: 1.0 },
          ['Halt Immediately'],
          'EMERGENCY_STOP',
          msg.simTime
        );
        break;

      case 'HEARTBEAT':
        this.peerHeartbeats.set(msg.fromRobotId, msg.simTime);
        break;
    }
  }

  /**
   * Primary Edge Intelligence Tick for this AMR
   */
  public step(ctx: EdgeAgentContext): {
    conflictDetected?: { peerId: string; location: Position; action: string; reason: string };
    deadlockDetected?: { peerId: string; location: Position; reason: string };
    rerouteOccurred?: boolean;
    taskReassignmentRequested?: boolean;
  } {
    const { grid, allRobots, simTime, coordinationMode } = ctx;
    let conflictEvent: any = undefined;
    let deadlockEvent: any = undefined;
    let rerouteOccurred = false;
    let taskReassignmentRequested = false;

    // 1. Check emergency stop or offline
    if (this.robot.status === 'EMERGENCY_STOP' || this.robot.status === 'OFFLINE') {
      this.robot.velocity = 0;
      this.robot.idleTime++;
      return {};
    }

    // 2. Battery Telemetry & Low Battery Protocol
    if (this.robot.status === 'CHARGING') {
      this.robot.battery = Math.min(100, this.robot.battery + 8.0);
      this.robot.velocity = 0;
      if (this.robot.battery >= 98) {
        this.robot.status = 'IDLE';
        this.robot.target = null;
        this.robot.plannedPath = [];
        this.recordDecision(
          'Charging Completed',
          'Battery reached full capacity (98%+). Returning to active task pool.',
          { batteryLevel: this.robot.battery },
          ['Wait', 'Resume Tasks'],
          'IDLE',
          simTime
        );
      }
      return {};
    }

    // Battery consumption while active (optimized for continuous multi-hour fleet operations)
    const batteryDrain = this.robot.status === 'MOVING' ? 0.015 : 0.002;
    this.robot.battery = Math.max(0, this.robot.battery - batteryDrain);

    // Check if on charging station cell
    const chargingStations = grid.stations.filter((s) => s.type === 'CHARGING');
    const isOnCharger = chargingStations.some((s) => s.x === this.robot.position.x && s.y === this.robot.position.y);
    if (isOnCharger && this.robot.battery < 95) {
      this.robot.status = 'CHARGING';
      this.robot.plannedPath = [];
      this.robot.velocity = 0;
      return {};
    }

    if (this.robot.battery < 25) {
      if (this.robot.status !== 'LOW_BATTERY') {
        this.robot.status = 'LOW_BATTERY';
        taskReassignmentRequested = true;
        this.recordDecision(
          'Low Battery Safety Threshold Reached',
          `Battery depleted to ${this.robot.battery.toFixed(1)}% (< 25%). Reassigning active tasks and navigating to charger.`,
          { batteryLevel: this.robot.battery },
          ['Continue Task', 'Reroute to Charger', 'Emergency Halt'],
          'LOW_BATTERY',
          simTime
        );
        this.messageBus.broadcast(
          this.robot.id,
          'BATTERY_LOW',
          { battery: this.robot.battery, pos: this.robot.position },
          simTime,
          this.robot.networkGroup
        );
      }

      // Autonomously plan route to closest charger if not already routing there
      if (chargingStations.length > 0 && this.robot.plannedPath.length <= 1) {
        let bestCharger = chargingStations[0];
        let bestDist = Infinity;
        for (const cs of chargingStations) {
          const d = Math.abs(cs.x - this.robot.position.x) + Math.abs(cs.y - this.robot.position.y);
          if (d < bestDist) {
            bestDist = d;
            bestCharger = cs;
          }
        }
        const planToCharger = AStarPlanner.planPath(grid, this.robot.position, { x: bestCharger.x, y: bestCharger.y });
        if (planToCharger.found && planToCharger.path.length > 0) {
          this.robot.plannedPath = planToCharger.path;
          this.robot.target = { x: bestCharger.x, y: bestCharger.y };
          this.robot.priority = 10;
        }
      }
    }

    // 3. Heartbeat & Communication Health
    if (this.robot.communicationStatus === 'ONLINE') {
      // Broadcast heartbeat every 5 ticks
      if (simTime % 5 === 0) {
        const nextWp = this.robot.plannedPath.length > 1 ? this.robot.plannedPath[1] : null;
        this.messageBus.broadcast(
          this.robot.id,
          'INTENT_UPDATE',
          {
            pos: this.robot.position,
            target: this.robot.target,
            nextPos: nextWp,
            priorityScore: this.calculatePriorityScore(),
          },
          simTime,
          this.robot.networkGroup
        );
      }
    }

    // Detect communication timeout (> 20 sim ticks without peer updates)
    let activePeers = 0;
    this.peerHeartbeats.forEach((lastTime, peerId) => {
      if (simTime - lastTime < 25) activePeers++;
    });
    this.robot.neighborRobots = Array.from(this.peerHeartbeats.keys()).filter(
      (id) => (simTime - (this.peerHeartbeats.get(id) || 0)) < 25
    );

    // 4. Check if current path is invalidated by newly blocked cells
    const knownBlockedSet = new Set(this.robot.localMapKnownBlocked);
    // Add real-time sensor forward check
    this.updateLocalSensorState(grid);

    if (
      this.robot.plannedPath.length > 0 &&
      AStarPlanner.isPathInvalidated(this.robot.plannedPath, grid, knownBlockedSet)
    ) {
      rerouteOccurred = true;
      this.robot.status = 'REROUTING';
      const replanGoal = this.robot.target || this.robot.plannedPath[this.robot.plannedPath.length - 1];
      const newPlan = AStarPlanner.planPath(grid, this.robot.position, replanGoal, {
        knownBlockedCells: knownBlockedSet,
      });

      if (newPlan.found && newPlan.path.length > 0) {
        this.robot.plannedPath = newPlan.path;
        this.recordDecision(
          'Dynamic Obstacle Replanned',
          'Path obstructed by detected obstacle. Executed A* replan around blocked coordinates.',
          {
            alternatePathsCount: 1,
            distanceToGoal: newPlan.cost,
            batteryLevel: this.robot.battery,
          },
          ['Wait for Obstacle Clear', 'Local A* Detour', 'Cancel Task'],
          'REROUTING -> MOVING',
          simTime
        );
      } else {
        // No path exists
        this.robot.status = 'BLOCKED';
        this.robot.waitingTicks++;
        taskReassignmentRequested = true;
        this.recordDecision(
          'No Feasible Route to Destination',
          'All corridors to target are blocked by obstacles or shelves. Triggering dynamic task reassignment.',
          { alternatePathsCount: 0 },
          ['Stay Blocked', 'Trigger Task Reassignment'],
          'BLOCKED',
          simTime
        );
        return { rerouteOccurred: true, taskReassignmentRequested: true };
      }
    }

    // 5. If arrived or no planned path, clear remaining point and handle state
    if (this.robot.plannedPath.length <= 1) {
      if (this.robot.plannedPath.length === 1) {
        this.robot.plannedPath = [];
      }
      if (isOnCharger && this.robot.battery < 95) {
        this.robot.status = 'CHARGING';
        this.robot.velocity = 0;
        return {};
      }
      if (this.robot.status !== 'LOW_BATTERY') {
        this.robot.status = 'IDLE';
        this.robot.velocity = 0;
        this.robot.idleTime++;
      }
      return {};
    }

    // 6. Multi-Agent Conflict Avoidance & Decentralized Negotiation
    const nextWaypoint = this.robot.plannedPath[1];

    if (coordinationMode === 'BASELINE_STOP_AND_WAIT') {
      // BASELINE MODE: Simple stop-and-wait
      // Whenever another robot is within Manhattan distance <= 2, stop and wait
      let peerInVicinity = false;
      allRobots.forEach((peer, peerId) => {
        if (peerId !== this.robot.id && peer.status !== 'OFFLINE') {
          const dist = Math.abs(peer.position.x - this.robot.position.x) + Math.abs(peer.position.y - this.robot.position.y);
          if (dist <= 2) {
            peerInVicinity = true;
          }
        }
      });

      if (peerInVicinity) {
        this.robot.status = 'WAITING';
        this.robot.velocity = 0;
        this.robot.waitingTicks++;
        this.robot.idleTime++;
        this.recordDecision(
          'Baseline Stop-and-Wait Halt',
          'Centralized proximity rule: Peer robot detected within 2 grid units. Full stop applied.',
          { proximityDistance: 2 },
          ['Stop and Wait'],
          'WAITING',
          simTime
        );
        return {};
      }
    } else {
      // FLEETMIND DECENTRALIZED COORDINATION MODE
      // Check for spatial-temporal conflict with peers
      let conflictingPeer: Robot | null = null;
      let conflictType: 'HEAD_ON' | 'CROSSING' | 'SAME_CELL' | 'BLOCKED_BY_LEADER' = 'SAME_CELL';

      for (const [peerId, peer] of allRobots.entries()) {
        if (peerId === this.robot.id || peer.status === 'OFFLINE') continue;

        // Same cell collision risk (both targeting nextWaypoint)
        const peerNext = peer.plannedPath.length > 1 ? peer.plannedPath[1] : peer.position;
        if (peerNext.x === nextWaypoint.x && peerNext.y === nextWaypoint.y) {
          conflictingPeer = peer;
          conflictType = 'SAME_CELL';
          break;
        } else if (peer.position.x === nextWaypoint.x && peer.position.y === nextWaypoint.y) {
          // Peer currently occupies the cell we want to enter
          conflictingPeer = peer;
          if (peerNext.x === this.robot.position.x && peerNext.y === this.robot.position.y) {
            conflictType = 'HEAD_ON';
          } else {
            conflictType = 'BLOCKED_BY_LEADER';
          }
          break;
        }
      }

      if (conflictingPeer) {
        const peer: Robot = conflictingPeer;
        const myScore = this.calculatePriorityScore();
        const peerScore =
          (peer.priority * 10) +
          (100 - (peer.plannedPath.length || 10)) +
          peer.battery * 0.1 +
          peer.waitingTicks * 5;

        // Check for Deadlock (both WAITING or high waitingTicks)
        if (this.robot.waitingTicks >= 3 && peer.waitingTicks >= 3) {
          deadlockEvent = {
            peerId: peer.id,
            location: nextWaypoint,
            reason: `Cyclic wait between ${this.robot.name} and ${peer.name} for > 3 ticks`,
          };

          // Deadlock Resolution Strategy:
          // Lexicographical ID tie-break: lower ID performs sidestep or detour
          if (this.robot.id < peer.id) {
            const sidestepPlan = this.findSidestepRoute(grid, nextWaypoint);
            if (sidestepPlan) {
              this.robot.plannedPath = sidestepPlan;
              this.robot.status = 'AVOIDING';
              this.robot.waitingTicks = 0;
              this.recordDecision(
                'Deadlock Resolution: Side-step Manoeuvre',
                `Cyclic blockage detected with ${peer.name}. Yielding through lateral corridor sidestep.`,
                { conflictingRobotId: peer.id, waitingTicks: this.robot.waitingTicks },
                ['Wait Indefinitely', 'Lateral Sidestep', 'Emergency Back-off'],
                'AVOIDING',
                simTime
              );
              return { deadlockDetected: deadlockEvent };
            }
          }
        }

        // Priority Negotiation: Who has right of way?
        const iWinPriority = myScore > peerScore || (myScore === peerScore && this.robot.id < peer.id);

        if (iWinPriority) {
          // We hold reservation: proceed or advance cautiously
          conflictEvent = {
            peerId: peer.id,
            location: nextWaypoint,
            action: 'PROCEED_PRIORITY_WIN',
            reason: `${this.robot.name} won priority over ${peer.name} (Score ${myScore.toFixed(0)} vs ${peerScore.toFixed(0)})`,
          };

          this.recordDecision(
            'Priority Right-of-Way Retained',
            `Contention at (${nextWaypoint.x}, ${nextWaypoint.y}). Retained reservation based on higher priority score (${myScore.toFixed(0)} vs ${peerScore.toFixed(0)}).`,
            {
              conflictingRobotId: peer.id,
              taskPriority: this.robot.priority,
              distanceToGoal: this.robot.plannedPath.length,
            },
            ['Yield to Peer', 'Claim Right-of-Way'],
            'PROCEED',
            simTime
          );

          // If peer is still standing directly on the cell, check for immediate lateral sidestep
          if (peer.position.x === nextWaypoint.x && peer.position.y === nextWaypoint.y) {
            if (this.robot.waitingTicks >= 1) {
              const sidestep = this.findSidestepRoute(grid, nextWaypoint);
              if (sidestep && sidestep.length > 1) {
                this.robot.plannedPath = sidestep;
                this.robot.status = 'AVOIDING';
                this.robot.waitingTicks = 0;
                return { conflictDetected: conflictEvent };
              }
            }
            this.robot.status = 'WAITING';
            this.robot.velocity = 0;
            this.robot.waitingTicks++;
            return { conflictDetected: conflictEvent };
          }
        } else {
          // Peer has higher priority: we must YIELD, WAIT or REROUTE
          conflictEvent = {
            peerId: peer.id,
            location: nextWaypoint,
            action: 'DYNAMIC_BYPASS_YIELD',
            reason: `${this.robot.name} yielded to ${peer.name} (Score ${myScore.toFixed(0)} vs ${peerScore.toFixed(0)})`,
          };

          // Attempt an immediate local lateral bypass so robot continues motion without stopping!
          const bypass = this.findSidestepRoute(grid, nextWaypoint);
          if (bypass && bypass.length > 1) {
            this.robot.plannedPath = bypass;
            this.robot.status = 'AVOIDING';
            this.robot.waitingTicks = 0;
            this.recordDecision(
              'Dynamic Lateral Bypass Yield',
              `Yielded priority to ${peer.name}. Engaged immediate lateral corridor bypass to keep moving.`,
              { conflictingRobotId: peer.id },
              ['Hold Position', 'Lateral Bypass'],
              'AVOIDING',
              simTime
            );
            return { conflictDetected: conflictEvent };
          }

          this.robot.status = 'WAITING';
          this.robot.velocity = 0;
          this.robot.waitingTicks++;
          this.robot.idleTime++;
          this.recordDecision(
            'Yielded Right-of-Way to Peer',
            `Yielded cell (${nextWaypoint.x}, ${nextWaypoint.y}) to ${peer.name} who holds higher priority score (${peerScore.toFixed(0)} vs ${myScore.toFixed(0)}).`,
            {
              conflictingRobotId: peer.id,
              taskPriority: this.robot.priority,
              waitingTicks: this.robot.waitingTicks,
            },
            ['Wait for Clearance', 'Reroute Around Peer'],
            'WAITING',
            simTime
          );
          return { conflictDetected: conflictEvent };
        }
      }
    }

    // 7. Execute Movement Step along Planned Path
    this.robot.waitingTicks = 0;
    this.robot.status = 'MOVING';
    this.robot.velocity = 1.0;

    // Advance to next waypoint
    const current = this.robot.position;
    const next = this.robot.plannedPath[1];

    // Compute heading
    let heading = this.robot.position.heading || 0;
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    if (dx === 1) heading = 0;
    else if (dy === 1) heading = 90;
    else if (dx === -1) heading = 180;
    else if (dy === -1) heading = 270;

    this.robot.position = { x: next.x, y: next.y, heading };
    this.robot.plannedPath.shift(); // Remove completed waypoint
    this.robot.distanceTravelled += 1;

    // Track trajectory breadcrumbs (keep last 30)
    this.robot.trajectory.push({ x: next.x, y: next.y });
    if (this.robot.trajectory.length > 30) {
      this.robot.trajectory.shift();
    }

    return { conflictDetected: conflictEvent, deadlockDetected: deadlockEvent };
  }

  private calculatePriorityScore(): number {
    const taskPrioWeight = this.robot.priority * 12;
    const remainingDistance = this.robot.plannedPath.length;
    const distWeight = Math.max(0, 100 - remainingDistance * 2);
    const batteryWeight = this.robot.battery * 0.15;
    const waitingWeight = this.robot.waitingTicks * 8;
    const emergencyWeight = this.robot.status === 'LOW_BATTERY' ? 500 : 0;

    return taskPrioWeight + distWeight + batteryWeight + waitingWeight + emergencyWeight;
  }

  private updateLocalSensorState(grid: WarehouseGrid) {
    const curr = this.robot.position;
    const heading = curr.heading || 0;
    let fx = curr.x;
    let fy = curr.y;

    if (heading === 0) fx += 1;
    else if (heading === 90) fy += 1;
    else if (heading === 180) fx -= 1;
    else if (heading === 270) fy -= 1;

    const clear = isCellTraversable(grid, fx, fy);
    this.robot.sensorState = {
      forwardClear: clear,
      proximityDistance: clear ? 3.0 : 0.8,
      detectedObstacle: clear ? null : { x: fx, y: fy },
      batteryVoltage: 48.0 * (this.robot.battery / 100) + 1.2,
      temperatureC: 28.5 + (this.robot.distanceTravelled % 15) * 0.2,
    };
  }

  private findSidestepRoute(grid: WarehouseGrid, blockedCell: Position): Position[] | null {
    // Attempt to detour around the blocked cell by temporarily marking it blocked
    const tempBlocked = new Set(this.robot.localMapKnownBlocked);
    tempBlocked.add(`${blockedCell.x},${blockedCell.y}`);

    const goal = this.robot.target || this.robot.plannedPath[this.robot.plannedPath.length - 1];
    if (!goal) return null;

    const res = AStarPlanner.planPath(grid, this.robot.position, goal, {
      knownBlockedCells: tempBlocked,
    });

    if (res.found && res.path.length > 1) {
      return res.path;
    }
    return null;
  }

  private recordDecision(
    decision: string,
    why: string,
    inputs: Record<string, any>,
    alternatives: string[],
    selectedAction: string,
    simTime: number
  ) {
    this.robot.decisionState = {
      decision,
      why,
      inputs,
      alternatives,
      selectedAction,
      timestamp: Date.now(),
    };
    this.robot.intent = `${decision} -> ${selectedAction}`;
  }
}
