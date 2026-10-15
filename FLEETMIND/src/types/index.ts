export type RobotStatus =
  | 'IDLE'
  | 'MOVING'
  | 'WAITING'
  | 'AVOIDING'
  | 'REROUTING'
  | 'CHARGING'
  | 'LOW_BATTERY'
  | 'BLOCKED'
  | 'EMERGENCY_STOP'
  | 'OFFLINE'
  | 'ERROR';

export type TaskType =
  | 'PICKUP'
  | 'DELIVERY'
  | 'RECHARGE'
  | 'INSPECTION'
  | 'RETURN_TO_BASE';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'REASSIGNED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type CellType =
  | 'EMPTY'
  | 'WALL'
  | 'SHELF'
  | 'AISLE'
  | 'INTERSECTION'
  | 'LOADING'
  | 'PICKUP_STATION'
  | 'DROP_STATION'
  | 'CHARGING_STATION'
  | 'RESTRICTED'
  | 'BLOCKED_AISLE'
  | 'OBSTACLE';

export type MessageType =
  | 'POSITION_UPDATE'
  | 'INTENT_UPDATE'
  | 'PATH_PROPOSAL'
  | 'TASK_UPDATE'
  | 'TASK_REASSIGNMENT'
  | 'CONFLICT_DETECTED'
  | 'CONFLICT_RESOLVED'
  | 'HEARTBEAT'
  | 'HEARTBEAT_TIMEOUT'
  | 'BLOCKED_AISLE'
  | 'REROUTE_REQUEST'
  | 'EMERGENCY_STOP'
  | 'BATTERY_LOW'
  | 'CHARGING_REQUEST';

export type CoordinationMode = 'FLEETMIND_DECENTRALIZED' | 'BASELINE_STOP_AND_WAIT';

export interface Position {
  x: number;
  y: number;
  heading?: number; // degrees: 0=East, 90=South, 180=West, 270=North
}

export interface PathNode {
  x: number;
  y: number;
  t?: number;
}

export interface Station {
  id: string;
  name: string;
  type: 'PICKUP' | 'DROP' | 'CHARGING' | 'LOADING';
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'STATIC' | 'TEMPORARY' | 'BLOCKED_AISLE';
  addedAt: number;
}

export interface WarehouseGrid {
  width: number;
  height: number;
  cells: CellType[][];
  stations: Station[];
  obstacles: Obstacle[];
}

export interface DecisionExplanation {
  decision: string;
  why: string;
  inputs: {
    taskPriority?: number;
    distanceToGoal?: number;
    batteryLevel?: number;
    waitingTicks?: number;
    conflictingRobotId?: string;
    alternatePathsCount?: number;
    localCongestionScore?: number;
    commReliability?: number;
  };
  alternatives: string[];
  selectedAction: string;
  timestamp: number;
}

export interface SensorState {
  forwardClear: boolean;
  proximityDistance: number;
  detectedObstacle: Position | null;
  batteryVoltage: number;
  temperatureC: number;
}

export interface Robot {
  id: string;
  name: string;
  position: Position;
  target: Position | null;
  velocity: number; // cells per tick
  battery: number; // 0 - 100%
  status: RobotStatus;
  currentTaskId: string | null;
  plannedPath: Position[];
  completedTasks: number;
  distanceTravelled: number;
  idleTime: number; // ticks
  communicationStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastHeartbeat: number;
  priority: number;
  intent: string;
  localMapKnownBlocked: string[]; // "x,y" keys
  neighborRobots: string[];
  sensorState: SensorState;
  decisionState: DecisionExplanation;
  color: string;
  trajectory: Position[];
  waitingTicks: number;
  networkGroup: number; // for network partition simulation (1 or 2)
}

export interface Task {
  id: string;
  type: TaskType;
  priority: number; // 1 (low) - 5 (critical)
  source: Position;
  destination: Position;
  createdAt: number;
  assignedRobotId: string | null;
  status: TaskStatus;
  deadline?: number;
  estimatedCost: number;
  reassignmentCount: number;
  completionTime?: number;
  startTime?: number;
  logs: string[];
}

export interface PeerMessage {
  id: string;
  timestamp: number;
  simTime: number;
  fromRobotId: string;
  toRobotId: string; // 'BROADCAST' or specific id
  type: MessageType;
  payload: any;
  latencyMs: number;
  status: 'DELIVERED' | 'DROPPED' | 'DELAYED';
}

export interface Conflict {
  id: string;
  timestamp: number;
  simTime: number;
  robotAId: string;
  robotBId: string;
  location: Position;
  reason: string;
  priorityWonRobotId: string;
  action: string;
  resolved: boolean;
}

export interface SimulationMetrics {
  collisionCount: number;
  nearCollisionCount: number;
  completedTasks: number;
  failedTasks: number;
  throughputPerHour: number;
  averageTaskCompletionTime: number; // seconds
  taskReassignmentCount: number;
  rerouteCount: number;
  averageRerouteRecoveryTime: number; // seconds
  deadlockCount: number;
  deadlockRecoveryTime: number; // seconds
  messageCount: number;
  averageMessageLatencyMs: number;
  communicationFailures: number;
  energyProxy: number; // kWh proxy
  totalDistanceTravelled: number;
  totalIdleTime: number;
  congestionIndex: number; // 0 - 1
  fleetUtilization: number; // 0 - 100%
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  simTime: number;
  type:
    | 'TASK_ASSIGNED'
    | 'TASK_COMPLETED'
    | 'CONFLICT_DETECTED'
    | 'CONFLICT_RESOLVED'
    | 'DEADLOCK_DETECTED'
    | 'DEADLOCK_RESOLVED'
    | 'AISLE_BLOCKED'
    | 'AISLE_RESTORED'
    | 'REROUTE'
    | 'TASK_REASSIGNED'
    | 'COMM_FAILURE'
    | 'COMM_RESTORED'
    | 'BATTERY_LOW'
    | 'CHARGING_STARTED'
    | 'EMERGENCY_STOP'
    | 'ROBOT_ADDED'
    | 'ROBOT_REMOVED';
  robotId?: string;
  taskId?: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  description: string;
}

export interface ReplayFrame {
  simTime: number;
  robots: Robot[];
  tasks: Task[];
  activeConflicts: Conflict[];
  metrics: SimulationMetrics;
  recentEvent?: TimelineEvent;
}

export interface ExperimentResult {
  id: string;
  name: string;
  seed: number;
  duration: number; // ticks
  robotCount: number;
  taskCount: number;
  warehousePreset: string;
  baselineMetrics: SimulationMetrics;
  fleetmindMetrics: SimulationMetrics;
  comparison: Record<
    string,
    {
      baseline: number;
      fleetmind: number;
      diffPercent: number; // (fleetmind - baseline) / baseline * 100
      improved: boolean;
      unit: string;
    }
  >;
  timestamp: number;
}
