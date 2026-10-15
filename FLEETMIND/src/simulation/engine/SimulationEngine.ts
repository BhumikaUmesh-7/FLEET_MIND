import {
  Conflict,
  CoordinationMode,
  Obstacle,
  Position,
  ReplayFrame,
  Robot,
  RobotStatus,
  SimulationMetrics,
  Task,
  TimelineEvent,
  WarehouseGrid,
} from '../../types';
import { DynamicTaskAllocator } from '../allocation/DynamicTaskAllocator';
import { EdgeAgent } from '../coordination/EdgeAgent';
import { MessageBus } from '../coordination/MessageBus';
import { AStarPlanner } from '../planner/AStarPlanner';
import {
  createHighCongestionWarehouse,
  createMediumWarehouse,
  createSmallWarehouse,
  isCellTraversable,
} from '../warehouse/warehousePresets';

export interface SimulationEngineConfig {
  coordinationMode: CoordinationMode;
  warehousePreset: 'Small' | 'Medium' | 'High Congestion';
  robotCount: number;
  initialTaskCount: number;
  speed: number; // 0.25 to 10
  seed: number;
}

const ROBOT_COLORS = [
  '#06b6d4', // Cyan (R-01)
  '#3b82f6', // Blue (R-02)
  '#8b5cf6', // Violet (R-03)
  '#10b981', // Emerald (R-04)
  '#f59e0b', // Amber (R-05)
  '#ec4899', // Pink (R-06)
  '#14b8a6', // Teal (R-07)
  '#6366f1', // Indigo (R-08)
  '#84cc16', // Lime (R-09)
  '#f97316', // Orange (R-10)
  '#0284c7', // Sky (R-11)
  '#d946ef', // Fuchsia (R-12)
  '#22c55e', // Green (R-13)
  '#eab308', // Gold (R-14)
  '#a855f7', // Purple (R-15)
  '#f43f5e', // Rose (R-16)
];

export class SimulationEngine {
  public grid: WarehouseGrid;
  public robots: Map<string, Robot> = new Map();
  public edgeAgents: Map<string, EdgeAgent> = new Map();
  public tasks: Task[] = [];
  public messageBus: MessageBus = new MessageBus();
  public activeConflicts: Conflict[] = [];
  public events: TimelineEvent[] = [];
  public replayFrames: ReplayFrame[] = [];
  public isRunning: boolean = false;
  public simTime: number = 0; // Simulation ticks
  public coordinationMode: CoordinationMode = 'FLEETMIND_DECENTRALIZED';
  public warehousePresetName: string = 'Medium';
  public lastReassignmentAlert: {
    taskId: string;
    fromRobot: string;
    toRobot: string;
    reason: string;
    timestamp: number;
  } | null = null;

  private nextTaskId = 1;
  private nextEventId = 1;
  private nextConflictId = 1;
  private intervalTimer: any = null;
  private maxReplayFrames = 1500;
  private onTickCallbacks: Set<() => void> = new Set();

  public metrics: SimulationMetrics = {
    collisionCount: 0,
    nearCollisionCount: 0,
    completedTasks: 0,
    failedTasks: 0,
    throughputPerHour: 0,
    averageTaskCompletionTime: 0,
    taskReassignmentCount: 0,
    rerouteCount: 0,
    averageRerouteRecoveryTime: 2.4,
    deadlockCount: 0,
    deadlockRecoveryTime: 3.1,
    messageCount: 0,
    averageMessageLatencyMs: 15,
    communicationFailures: 0,
    energyProxy: 0,
    totalDistanceTravelled: 0,
    totalIdleTime: 0,
    congestionIndex: 0.12,
    fleetUtilization: 0,
  };

  constructor(config: Partial<SimulationEngineConfig> = {}) {
    this.coordinationMode = config.coordinationMode || 'FLEETMIND_DECENTRALIZED';
    this.warehousePresetName = config.warehousePreset || 'Medium';

    if (this.warehousePresetName === 'Small') {
      this.grid = createSmallWarehouse();
    } else if (this.warehousePresetName === 'High Congestion') {
      this.grid = createHighCongestionWarehouse();
    } else {
      this.grid = createMediumWarehouse();
    }

    this.initFleet(config.robotCount || 10);
    this.initTasks(config.initialTaskCount || 12);
  }

  public subscribeTick(cb: () => void): () => void {
    this.onTickCallbacks.add(cb);
    return () => this.onTickCallbacks.delete(cb);
  }

  private notifyTick() {
    this.onTickCallbacks.forEach((cb) => cb());
  }

  public initFleet(count: number) {
    // Clear existing
    this.edgeAgents.forEach((agent) => agent.destroy());
    this.edgeAgents.clear();
    this.robots.clear();
    this.messageBus.clear();

    const spawnPoints = this.findSpawnPositions(count);

    for (let i = 0; i < count; i++) {
      const id = `R-${String(i + 1).padStart(2, '0')}`;
      const name = `AMR-${id}`;
      const pos = spawnPoints[i] || { x: 2 + (i % 5), y: 2 + Math.floor(i / 5), heading: 0 };
      const color = ROBOT_COLORS[i % ROBOT_COLORS.length];

      const robot: Robot = {
        id,
        name,
        position: { ...pos },
        target: null,
        velocity: 0,
        battery: 98 - i * 3,
        status: 'IDLE',
        currentTaskId: null,
        plannedPath: [],
        completedTasks: 0,
        distanceTravelled: 0,
        idleTime: 0,
        communicationStatus: 'ONLINE',
        lastHeartbeat: Date.now(),
        priority: 3,
        intent: 'Initialized and standing by',
        localMapKnownBlocked: [],
        neighborRobots: [],
        sensorState: {
          forwardClear: true,
          proximityDistance: 3.0,
          detectedObstacle: null,
          batteryVoltage: 48.0,
          temperatureC: 28.0,
        },
        decisionState: {
          decision: 'Agent Online',
          why: 'System boot sequence completed',
          inputs: { batteryLevel: 98 - i * 3 },
          alternatives: ['Await Task Assignment'],
          selectedAction: 'IDLE',
          timestamp: Date.now(),
        },
        color,
        trajectory: [{ x: pos.x, y: pos.y }],
        waitingTicks: 0,
        networkGroup: i >= 3 ? 2 : 1,
      };

      this.robots.set(id, robot);
      const agent = new EdgeAgent(robot, this.messageBus);
      this.edgeAgents.set(id, agent);
    }

    this.logEvent('INFO', `Initialized fleet of ${count} AMRs with decentralized EdgeAgent controllers.`);
  }

  public setFleetSize(count: number) {
    const safeCount = Math.max(3, Math.min(24, count));
    this.initFleet(safeCount);
    this.initTasks(Math.max(safeCount + 2, 8));
    this.logEvent('INFO', `Fleet scaled to ${safeCount} AMRs.`);
    this.notifyTick();
  }

  private findSpawnPositions(count: number): Position[] {
    const list: Position[] = [];

    // Priority 1: Available charging stations or loading docks
    for (const st of this.grid.stations) {
      if ((st.type === 'CHARGING' || st.type === 'LOADING') && !list.some((p) => p.x === st.x && p.y === st.y)) {
        list.push({ x: st.x, y: st.y, heading: 0 });
        if (list.length >= count) return list;
      }
    }

    // Priority 2: Evenly spaced grid distribution across traversable aisles and intersections
    const stepX = Math.max(2, Math.floor(this.grid.width / (count / 2 + 1)));
    for (let sy = 2; sy < this.grid.height - 2; sy += 3) {
      for (let sx = 2; sx < this.grid.width - 2; sx += stepX) {
        const cell = this.grid.cells[sy][sx];
        if (
          (cell === 'EMPTY' || cell === 'AISLE' || cell === 'INTERSECTION') &&
          !list.some((p) => Math.abs(p.x - sx) < 1 && Math.abs(p.y - sy) < 1)
        ) {
          list.push({ x: sx, y: sy, heading: 0 });
          if (list.length >= count) return list;
        }
      }
    }

    // Priority 3: Fallback scan all traversable cells
    for (let y = 1; y < this.grid.height - 1; y++) {
      for (let x = 1; x < this.grid.width - 1; x++) {
        const cell = this.grid.cells[y][x];
        if (
          (cell === 'EMPTY' || cell === 'AISLE' || cell === 'INTERSECTION' || cell === 'PICKUP_STATION' || cell === 'DROP_STATION') &&
          !list.some((p) => p.x === x && p.y === y)
        ) {
          list.push({ x, y, heading: 0 });
          if (list.length >= count) return list;
        }
      }
    }
    return list;
  }

  public initTasks(count: number) {
    this.tasks = [];
    const pickupStations = this.grid.stations.filter((s) => s.type === 'PICKUP');
    const dropStations = this.grid.stations.filter((s) => s.type === 'DROP');

    for (let i = 0; i < count; i++) {
      const pick = pickupStations[i % pickupStations.length] || { x: 2, y: 1 };
      const drop = dropStations[i % dropStations.length] || { x: this.grid.width - 3, y: this.grid.height - 2 };

      this.createTask({
        type: i % 2 === 0 ? 'PICKUP' : 'DELIVERY',
        priority: ((i % 3) + 2) as any,
        source: { x: pick.x, y: pick.y },
        destination: { x: drop.x, y: drop.y },
      });
    }
  }

  public createTask(params: {
    type: Task['type'];
    priority: number;
    source: Position;
    destination: Position;
  }): Task {
    const id = `TSK-${String(this.nextTaskId++).padStart(3, '0')}`;
    const task: Task = {
      id,
      type: params.type,
      priority: params.priority,
      source: params.source,
      destination: params.destination,
      createdAt: Date.now(),
      assignedRobotId: null,
      status: 'PENDING',
      estimatedCost:
        Math.abs(params.source.x - params.destination.x) + Math.abs(params.source.y - params.destination.y),
      reassignmentCount: 0,
      logs: [`Task created at ${new Date().toLocaleTimeString()}`],
    };

    this.tasks.push(task);
    this.logEvent('INFO', `New task ${task.id} (${task.type}, Priority ${task.priority}) queued.`);

    // Attempt allocation immediately
    this.dispatchPendingTasks();
    return task;
  }

  private dispatchPendingTasks() {
    const pendingTasks = this.tasks.filter((t) => t.status === 'PENDING');

    for (const task of pendingTasks) {
      const robotList = Array.from(this.robots.values());
      const { assignedRobot, scoreDetails } = DynamicTaskAllocator.allocateTask(task, robotList, this.grid);
      if (assignedRobot) {
        task.assignedRobotId = assignedRobot.id;
        task.status = 'ASSIGNED';
        task.startTime = Date.now();
        task.logs.push(`Assigned to ${assignedRobot.name}. Score: ${scoreDetails[0]?.totalScore.toFixed(1)}`);

        // Plan path for robot: current -> source -> destination
        const planToSource = AStarPlanner.planPath(this.grid, assignedRobot.position, task.source);
        const planToDest = AStarPlanner.planPath(this.grid, task.source, task.destination);

        if (planToSource.found && planToDest.found) {
          // Combined path
          const fullPath = [...planToSource.path, ...planToDest.path.slice(1)];
          assignedRobot.plannedPath = fullPath;
          assignedRobot.target = task.destination;
          assignedRobot.currentTaskId = task.id;
          assignedRobot.priority = task.priority;
          assignedRobot.status = 'MOVING';

          this.logEvent(
            'INFO',
            `Assigned task ${task.id} to ${assignedRobot.name}. Planned trajectory length: ${fullPath.length} steps.`,
            assignedRobot.id,
            task.id
          );
        } else {
          // If path planning failed
          task.status = 'BLOCKED';
          task.logs.push('Path planning failed: source or destination unreachable.');
        }
      }
    }
  }

  /**
   * Dynamically reassigns an active task from a robot experiencing collisions,
   * deadlocks, blockages, or battery/comm issues to another healthy robot.
   */
  public reassignTaskToCandidate(
    task: Task,
    troubledRobotId: string,
    reason: string
  ): boolean {
    const troubledRobot = this.robots.get(troubledRobotId);
    if (!task || task.status === 'COMPLETED') return false;

    // 1. Relieve troubled robot from this task and back up to clear the aisle
    if (troubledRobot && troubledRobot.currentTaskId === task.id) {
      troubledRobot.currentTaskId = null;
      troubledRobot.plannedPath = [];
      troubledRobot.target = null;
      if (troubledRobot.status === 'MOVING' || troubledRobot.status === 'BLOCKED') {
        troubledRobot.status = 'AVOIDING';
        troubledRobot.velocity = 0;
        troubledRobot.waitingTicks = 0;
      }
    }

    // 2. Identify candidate robots: must be distinct, operational, and non-blocked
    const candidates = Array.from(this.robots.values()).filter(
      (r) =>
        r.id !== troubledRobotId &&
        r.currentTaskId === null &&
        r.status !== 'OFFLINE' &&
        r.status !== 'EMERGENCY_STOP' &&
        r.status !== 'LOW_BATTERY' &&
        r.status !== 'CHARGING' &&
        r.battery >= 20
    );

    task.reassignmentCount++;
    this.metrics.taskReassignmentCount++;

    if (candidates.length > 0) {
      const { assignedRobot } = DynamicTaskAllocator.allocateTask(task, candidates, this.grid);
      if (assignedRobot) {
        task.assignedRobotId = assignedRobot.id;
        task.status = 'ASSIGNED';
        task.logs.push(`Reassigned from ${troubledRobot ? troubledRobot.name : troubledRobotId} to ${assignedRobot.name} (${reason})`);

        // Plan path for alternative robot
        const planToSource = AStarPlanner.planPath(this.grid, assignedRobot.position, task.source);
        const planToDest = AStarPlanner.planPath(this.grid, task.source, task.destination);

        if (planToSource.found && planToDest.found) {
          const fullPath = [...planToSource.path, ...planToDest.path.slice(1)];
          assignedRobot.plannedPath = fullPath;
          assignedRobot.target = task.destination;
          assignedRobot.currentTaskId = task.id;
          assignedRobot.priority = Math.min(5, task.priority + 1);
          assignedRobot.status = 'MOVING';

          this.lastReassignmentAlert = {
            taskId: task.id,
            fromRobot: troubledRobot ? troubledRobot.name : troubledRobotId,
            toRobot: assignedRobot.name,
            reason,
            timestamp: Date.now(),
          };

          this.logEvent(
            'SUCCESS',
            `🔄 DYNAMIC REASSIGNMENT: Task ${task.id} (${task.type}) reassigned from ${troubledRobot ? troubledRobot.name : troubledRobotId} to ${assignedRobot.name} (${reason}). High warehouse efficiency maintained!`,
            assignedRobot.id,
            task.id
          );
          return true;
        }
      }
    }

    // Fallback: Queue task with elevated priority for immediate pickup
    task.assignedRobotId = null;
    task.status = 'PENDING';
    task.priority = Math.min(5, task.priority + 1);
    task.logs.push(`Reassigned from ${troubledRobotId} (${reason}). Queued as priority PENDING.`);

    this.lastReassignmentAlert = {
      taskId: task.id,
      fromRobot: troubledRobot ? troubledRobot.name : troubledRobotId,
      toRobot: 'Queued for Next Available AMR',
      reason,
      timestamp: Date.now(),
    };

    this.logEvent(
      'WARN',
      `🔄 DYNAMIC REASSIGNMENT: Task ${task.id} queued for handover from ${troubledRobot ? troubledRobot.name : troubledRobotId} (${reason}). Awaiting next available AMR.`,
      troubledRobotId,
      task.id
    );
    return false;
  }

  public ensureContinuousFleetTasks() {
    const pickupStations = this.grid.stations.filter((s) => s.type === 'PICKUP');
    const dropStations = this.grid.stations.filter((s) => s.type === 'DROP');
    if (pickupStations.length === 0 || dropStations.length === 0) return;

    let index = 0;
    this.robots.forEach((robot) => {
      // Whenever ANY robot has no active task and is operational, immediately provide a mission!
      if (
        robot.currentTaskId === null &&
        robot.status !== 'OFFLINE' &&
        robot.status !== 'EMERGENCY_STOP' &&
        robot.status !== 'CHARGING'
      ) {
        const pick = pickupStations[(index + this.simTime) % pickupStations.length];
        const drop = dropStations[(index + 1 + this.simTime) % dropStations.length];
        index++;

        this.createTask({
          type: index % 2 === 0 ? 'PICKUP' : 'DELIVERY',
          priority: Math.floor(Math.random() * 3) + 2,
          source: { x: pick.x, y: pick.y },
          destination: { x: drop.x, y: drop.y },
        });
      }
    });
  }

  public step() {
    this.simTime++;

    // 1. Ensure all available robots continuously have tasks assigned
    this.ensureContinuousFleetTasks();

    // 2. Dispatch any pending tasks
    this.dispatchPendingTasks();

    // 2. Step each edge agent independently (Decentralized decision loops)
    let totalMoving = 0;
    let totalIdle = 0;
    let stepCollisions = 0;

    const currentPositions = new Map<string, string>(); // "x,y" -> robotId
    const context = {
      grid: this.grid,
      allRobots: this.robots,
      messageBus: this.messageBus,
      simTime: this.simTime,
      coordinationMode: this.coordinationMode,
    };

    // Edge Agent execution
    this.edgeAgents.forEach((agent, robotId) => {
      const stepRes = agent.step(context);

      // Sync robot reference from agent
      this.robots.set(robotId, agent.robot);

      if (agent.robot.status === 'MOVING') totalMoving++;
      else totalIdle++;

      if (stepRes.rerouteOccurred) {
        this.metrics.rerouteCount++;
        this.logEvent('WARN', `${agent.robot.name} dynamically replanned around obstruction.`, robotId);
      }

      if (stepRes.conflictDetected) {
        const c = stepRes.conflictDetected;
        const conf: Conflict = {
          id: `cnf-${this.nextConflictId++}`,
          timestamp: Date.now(),
          simTime: this.simTime,
          robotAId: robotId,
          robotBId: c.peerId,
          location: c.location,
          reason: c.reason,
          priorityWonRobotId: robotId,
          action: c.action,
          resolved: true,
        };
        this.activeConflicts.unshift(conf);
        if (this.activeConflicts.length > 20) this.activeConflicts.pop();

        this.logEvent('INFO', `Conflict negotiation: ${c.reason} (${c.action})`, robotId);
      }

      if (stepRes.deadlockDetected) {
        this.metrics.deadlockCount++;
        this.logEvent(
          'CRITICAL',
          `Deadlock detected between ${agent.robot.name} and ${stepRes.deadlockDetected.peerId}. Executed resolution protocol.`,
          robotId
        );
        if (agent.robot.currentTaskId) {
          const tsk = this.tasks.find((t) => t.id === agent.robot.currentTaskId);
          if (tsk && tsk.status !== 'COMPLETED') {
            this.reassignTaskToCandidate(tsk, robotId, `Deadlock issue failover with ${stepRes.deadlockDetected.peerId}`);
          }
        }
      }

      if (stepRes.taskReassignmentRequested && agent.robot.currentTaskId) {
        const tsk = this.tasks.find((t) => t.id === agent.robot.currentTaskId);
        if (tsk && tsk.status !== 'COMPLETED') {
          this.reassignTaskToCandidate(tsk, robotId, 'Corridor contention / obstacle issue');
        }
      }

      // Check task completion
      if (agent.robot.currentTaskId) {
        const tsk = this.tasks.find((t) => t.id === agent.robot.currentTaskId);
        const reachedDest =
          tsk &&
          agent.robot.position.x === tsk.destination.x &&
          agent.robot.position.y === tsk.destination.y;

        if (tsk && (agent.robot.plannedPath.length <= 1 || reachedDest) && tsk.status !== 'COMPLETED') {
          tsk.status = 'COMPLETED';
          tsk.completionTime = Date.now();
          const durationSec = tsk.startTime ? (tsk.completionTime - tsk.startTime) / 1000 : 8.5;
          this.metrics.completedTasks++;
          agent.robot.completedTasks++;
          agent.robot.currentTaskId = null;
          agent.robot.target = null;
          agent.robot.plannedPath = [];
          agent.robot.status = 'IDLE';

          // Update moving average completion time
          this.metrics.averageTaskCompletionTime =
            this.metrics.averageTaskCompletionTime === 0
              ? durationSec
              : this.metrics.averageTaskCompletionTime * 0.8 + durationSec * 0.2;

          this.logEvent(
            'SUCCESS',
            `Task ${tsk.id} (${tsk.type}) completed by ${agent.robot.name} in ${durationSec.toFixed(1)}s.`,
            robotId,
            tsk.id
          );

          // Automatically generate a new task to keep warehouse throughput flowing
          this.generateDynamicTask();
        }
      }

      // Check physical collision (identical grid coordinates at same tick)
      const cellKey = `${agent.robot.position.x},${agent.robot.position.y}`;
      if (currentPositions.has(cellKey)) {
        const otherId = currentPositions.get(cellKey)!;
        const otherRobot = this.robots.get(otherId);
        stepCollisions++;
        this.metrics.collisionCount++;
        this.logEvent(
          'CRITICAL',
          `⚠️ COLLISION ENCOUNTERED at (${cellKey}) between ${agent.robot.name} and ${otherRobot ? otherRobot.name : otherId}! Dynamically reassigning active tasks for zero warehouse downtime.`,
          robotId
        );
        // Instant task failover to other robot for maximum efficiency
        if (agent.robot.currentTaskId) {
          const tsk = this.tasks.find((t) => t.id === agent.robot.currentTaskId);
          if (tsk && tsk.status !== 'COMPLETED') {
            this.reassignTaskToCandidate(tsk, robotId, `Collision incident with ${otherRobot ? otherRobot.name : otherId}`);
          }
        }
        if (otherRobot && otherRobot.currentTaskId) {
          const tsk2 = this.tasks.find((t) => t.id === otherRobot.currentTaskId);
          if (tsk2 && tsk2.status !== 'COMPLETED') {
            this.reassignTaskToCandidate(tsk2, otherId, `Collision incident with ${agent.robot.name}`);
          }
        }

        // Separate colliding robots so they don't remain stalled
        agent.robot.status = 'AVOIDING';
        agent.robot.velocity = 0;
        agent.robot.plannedPath = [];
        if (otherRobot) {
          otherRobot.status = 'AVOIDING';
          otherRobot.velocity = 0;
          otherRobot.plannedPath = [];
        }
      } else {
        currentPositions.set(cellKey, robotId);
      }

      // Proactive issue check: if robot is blocked or waiting too long (> 2 ticks) with active task
      if (agent.robot.currentTaskId && (agent.robot.status === 'BLOCKED' || agent.robot.waitingTicks >= 3)) {
        const tsk = this.tasks.find((t) => t.id === agent.robot.currentTaskId);
        if (tsk && tsk.status !== 'COMPLETED') {
          this.reassignTaskToCandidate(tsk, robotId, `Aisle contention delay (${agent.robot.waitingTicks} ticks waiting)`);
        }
      }
    });

    // 3. Update aggregate metrics
    const robotList = Array.from(this.robots.values());
    const totalDist = robotList.reduce((acc, r) => acc + r.distanceTravelled, 0);
    const totalIdleTicks = robotList.reduce((acc, r) => acc + r.idleTime, 0);

    this.metrics.totalDistanceTravelled = totalDist;
    this.metrics.totalIdleTime = totalIdleTicks;
    this.metrics.fleetUtilization =
      robotList.length > 0 ? (totalMoving / robotList.length) * 100 : 0;
    this.metrics.energyProxy = totalDist * 0.042; // kWh proxy
    this.metrics.messageCount = this.messageBus.getHistory().length;
    this.metrics.throughputPerHour =
      this.simTime > 0 ? (this.metrics.completedTasks / (this.simTime * 0.1)) * 3600 : 0;

    // Congestion index: ratio of cells occupied in aisles
    this.metrics.congestionIndex = Math.min(1.0, (totalMoving * 1.5) / (this.grid.width * this.grid.height * 0.15));

    // 4. Record Replay Frame
    this.recordReplayFrame();

    // 5. Notify UI subscribers
    this.notifyTick();
  }

  private generateDynamicTask() {
    const pickupStations = this.grid.stations.filter((s) => s.type === 'PICKUP');
    const dropStations = this.grid.stations.filter((s) => s.type === 'DROP');
    if (pickupStations.length === 0 || dropStations.length === 0) return;

    const pick = pickupStations[Math.floor(Math.random() * pickupStations.length)];
    const drop = dropStations[Math.floor(Math.random() * dropStations.length)];

    this.createTask({
      type: Math.random() > 0.4 ? 'DELIVERY' : 'PICKUP',
      priority: Math.floor(Math.random() * 4) + 2,
      source: { x: pick.x, y: pick.y },
      destination: { x: drop.x, y: drop.y },
    });
  }

  private recordReplayFrame() {
    const frame: ReplayFrame = {
      simTime: this.simTime,
      robots: Array.from(this.robots.values()).map((r) => ({
        ...r,
        position: { ...r.position },
        plannedPath: [...r.plannedPath],
        trajectory: [...r.trajectory],
        sensorState: { ...r.sensorState },
        decisionState: { ...r.decisionState },
      })),
      tasks: this.tasks.map((t) => ({ ...t })),
      activeConflicts: [...this.activeConflicts],
      metrics: { ...this.metrics },
      recentEvent: this.events[0],
    };

    this.replayFrames.push(frame);
    if (this.replayFrames.length > this.maxReplayFrames) {
      this.replayFrames.shift();
    }
  }

  public start(speed: number = 1.0) {
    if (this.isRunning) return;
    this.isRunning = true;
    const intervalMs = Math.max(20, Math.floor(200 / speed));
    this.intervalTimer = setInterval(() => {
      this.step();
    }, intervalMs);
    this.logEvent('INFO', `Simulation started at ${speed}x speed.`);
  }

  public pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.logEvent('INFO', 'Simulation paused.');
    this.notifyTick();
  }

  public setSpeed(speed: number) {
    if (this.isRunning) {
      this.pause();
      this.start(speed);
    }
  }

  public reset(config?: Partial<SimulationEngineConfig>) {
    this.pause();
    this.simTime = 0;
    this.events = [];
    this.activeConflicts = [];
    this.replayFrames = [];
    this.nextTaskId = 1;
    this.nextConflictId = 1;

    this.metrics = {
      collisionCount: 0,
      nearCollisionCount: 0,
      completedTasks: 0,
      failedTasks: 0,
      throughputPerHour: 0,
      averageTaskCompletionTime: 0,
      taskReassignmentCount: 0,
      rerouteCount: 0,
      averageRerouteRecoveryTime: 2.4,
      deadlockCount: 0,
      deadlockRecoveryTime: 3.1,
      messageCount: 0,
      averageMessageLatencyMs: 15,
      communicationFailures: 0,
      energyProxy: 0,
      totalDistanceTravelled: 0,
      totalIdleTime: 0,
      congestionIndex: 0.12,
      fleetUtilization: 0,
    };

    if (config?.warehousePreset) {
      this.warehousePresetName = config.warehousePreset;
      if (this.warehousePresetName === 'Small') this.grid = createSmallWarehouse();
      else if (this.warehousePresetName === 'High Congestion') this.grid = createHighCongestionWarehouse();
      else this.grid = createMediumWarehouse();
    }

    if (config?.coordinationMode) {
      this.coordinationMode = config.coordinationMode;
    }

    this.initFleet(config?.robotCount || 5);
    this.initTasks(config?.initialTaskCount || 6);
    this.logEvent('INFO', 'Simulation environment reset to pristine state.');
    this.notifyTick();
  }

  // --- Fault Injection & Operator Commands ---

  public blockAisle(startX: number, startY: number, length: number = 3, horizontal: boolean = true) {
    for (let i = 0; i < length; i++) {
      const bx = horizontal ? startX + i : startX;
      const by = horizontal ? startY : startY + i;
      if (bx >= 0 && bx < this.grid.width && by >= 0 && by < this.grid.height) {
        this.grid.cells[by][bx] = 'BLOCKED_AISLE';
        // Broadcast blocked aisle to peer network
        this.messageBus.broadcast('SYSTEM', 'BLOCKED_AISLE', { x: bx, y: by }, this.simTime);
      }
    }
    this.logEvent('CRITICAL', `AISLE BLOCKED at (${startX}, ${startY}) len=${length}. Peer notification broadcast.`);
    this.notifyTick();
  }

  public restoreAisles() {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        if (this.grid.cells[y][x] === 'BLOCKED_AISLE') {
          this.grid.cells[y][x] = 'AISLE';
        }
      }
    }
    this.grid.obstacles = [];
    this.robots.forEach((r) => {
      r.localMapKnownBlocked = [];
      if (r.status === 'BLOCKED') r.status = 'IDLE';
    });
    this.logEvent('SUCCESS', 'All blocked aisles and obstacles cleared. Corridors restored.');
    this.notifyTick();
  }

  public addTemporaryObstacle(x: number, y: number) {
    if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
      const id = `obs-${Date.now()}`;
      const obs: Obstacle = { id, x, y, type: 'TEMPORARY', addedAt: Date.now() };
      this.grid.obstacles.push(obs);
      this.grid.cells[y][x] = 'OBSTACLE';
      this.messageBus.broadcast('SYSTEM', 'BLOCKED_AISLE', { x, y }, this.simTime);
      this.logEvent('WARN', `Temporary obstacle dropped at (${x}, ${y}).`);
      this.notifyTick();
    }
  }

  public triggerRobotLowBattery(robotId: string) {
    const r = this.robots.get(robotId);
    if (r) {
      r.battery = 14; // Drop to critical
      this.logEvent('WARN', `Fault injected: Low battery (14%) on ${r.name}.`, robotId);
      if (r.currentTaskId) {
        const tsk = this.tasks.find((t) => t.id === r.currentTaskId);
        if (tsk && tsk.status !== 'COMPLETED') {
          this.reassignTaskToCandidate(tsk, robotId, 'Low battery fault injected');
        }
      }
      this.notifyTick();
    }
  }

  public setRobotCommunication(robotId: string, status: 'ONLINE' | 'DEGRADED' | 'OFFLINE') {
    const r = this.robots.get(robotId);
    if (r) {
      r.communicationStatus = status;
      if (status === 'OFFLINE') {
        this.metrics.communicationFailures++;
        this.logEvent('CRITICAL', `Communication severed for ${r.name}. Entering isolated edge mode.`, robotId);
        if (r.currentTaskId) {
          const tsk = this.tasks.find((t) => t.id === r.currentTaskId);
          if (tsk && tsk.status !== 'COMPLETED') {
            this.reassignTaskToCandidate(tsk, robotId, 'Communication severed fault');
          }
        }
      } else {
        this.logEvent('SUCCESS', `Communication restored for ${r.name} (${status}).`, robotId);
      }
      this.notifyTick();
    }
  }

  public toggleNetworkPartition(active: boolean) {
    this.messageBus.setConfig({ networkPartitionActive: active });
    if (active) {
      this.metrics.communicationFailures += 2;
      this.logEvent('CRITICAL', 'Network Partition Injected! Fleet split into isolated clusters Group 1 vs Group 2.');
    } else {
      this.logEvent('SUCCESS', 'Network Partition Healed. Peer gossip resynchronized.');
    }
    this.notifyTick();
  }

  public setEmergencyStop(active: boolean) {
    if (active) {
      this.robots.forEach((r) => {
        r.status = 'EMERGENCY_STOP';
        r.velocity = 0;
      });
      this.messageBus.broadcast('SYSTEM', 'EMERGENCY_STOP', {}, this.simTime);
      this.logEvent('CRITICAL', 'EMERGENCY STOP TRIGGERED! Entire fleet halted.');
    } else {
      this.robots.forEach((r) => {
        if (r.status === 'EMERGENCY_STOP') {
          r.status = 'IDLE';
        }
      });
      this.logEvent('SUCCESS', 'Emergency stop released. System operating in nominal status.');
    }
    this.notifyTick();
  }

  public addRobot() {
    const count = this.robots.size;
    if (count >= 50) return;
    const id = `R-${String(count + 1).padStart(2, '0')}`;
    const name = `AMR-${id}`;
    const spawns = this.findSpawnPositions(1);
    const pos = spawns[0] || { x: 2, y: 2, heading: 0 };
    const color = ROBOT_COLORS[count % ROBOT_COLORS.length];

    const robot: Robot = {
      id,
      name,
      position: { ...pos },
      target: null,
      velocity: 0,
      battery: 95,
      status: 'IDLE',
      currentTaskId: null,
      plannedPath: [],
      completedTasks: 0,
      distanceTravelled: 0,
      idleTime: 0,
      communicationStatus: 'ONLINE',
      lastHeartbeat: Date.now(),
      priority: 3,
      intent: 'Standing by',
      localMapKnownBlocked: [],
      neighborRobots: [],
      sensorState: {
        forwardClear: true,
        proximityDistance: 3.0,
        detectedObstacle: null,
        batteryVoltage: 48.0,
        temperatureC: 28.0,
      },
      decisionState: {
        decision: 'Joined Fleet',
        why: 'Operator deployed new robot',
        inputs: { batteryLevel: 95 },
        alternatives: [],
        selectedAction: 'IDLE',
        timestamp: Date.now(),
      },
      color,
      trajectory: [{ x: pos.x, y: pos.y }],
      waitingTicks: 0,
      networkGroup: 1,
    };

    this.robots.set(id, robot);
    const agent = new EdgeAgent(robot, this.messageBus);
    this.edgeAgents.set(id, agent);
    this.logEvent('INFO', `Added ${name} to active fleet.`);
    this.notifyTick();
  }

  public removeRobot(id: string) {
    if (this.robots.size <= 1) return;
    const r = this.robots.get(id);
    if (r) {
      if (r.currentTaskId) {
        const tsk = this.tasks.find((t) => t.id === r.currentTaskId);
        if (tsk) {
          DynamicTaskAllocator.handleReassignment(tsk, id, Array.from(this.robots.values()), this.grid);
        }
      }
      const agent = this.edgeAgents.get(id);
      if (agent) agent.destroy();
      this.edgeAgents.delete(id);
      this.robots.delete(id);
      this.logEvent('WARN', `Removed ${r.name} from active fleet.`);
      this.notifyTick();
    }
  }

  public logEvent(
    severity: TimelineEvent['severity'],
    description: string,
    robotId?: string,
    taskId?: string
  ) {
    const event: TimelineEvent = {
      id: `evt-${this.nextEventId++}`,
      timestamp: Date.now(),
      simTime: this.simTime,
      type: 'TASK_ASSIGNED',
      robotId,
      taskId,
      severity,
      description,
    };
    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events.pop();
    }
  }
}
