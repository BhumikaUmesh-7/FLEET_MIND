import { Position, Robot, Task, TaskType, WarehouseGrid } from '../../types';
import { AStarPlanner } from '../planner/AStarPlanner';

export interface AllocationScore {
  robotId: string;
  totalScore: number;
  factors: {
    distanceCost: number;
    batterySuitability: number;
    workloadPenalty: number;
    commReliability: number;
  };
  explanation: string;
}

export class DynamicTaskAllocator {
  /**
   * Evaluates candidate robots and assigns optimal candidate based on multi-factor cost
   */
  public static allocateTask(
    task: Task,
    robots: Robot[],
    grid: WarehouseGrid
  ): { assignedRobot: Robot | null; scoreDetails: AllocationScore[] } {
    const scores: AllocationScore[] = [];

    // Filter candidate robots: must be IDLE, have no active task, and sufficient battery
    const available = robots.filter(
      (r) =>
        r.status === 'IDLE' &&
        r.currentTaskId === null &&
        r.battery >= 25
    );

    if (available.length === 0) {
      return { assignedRobot: null, scoreDetails: [] };
    }

    for (const robot of available) {
      // 1. Distance metric (Manhattan + rough route check)
      const distToSource = Math.abs(robot.position.x - task.source.x) + Math.abs(robot.position.y - task.source.y);
      const distSourceToDest = Math.abs(task.source.x - task.destination.x) + Math.abs(task.source.y - task.destination.y);
      const totalEstimatedDist = distToSource + distSourceToDest;

      // 2. Battery sufficiency check
      const estimatedBatteryRequired = totalEstimatedDist * 0.25;
      const batteryBuffer = robot.battery - estimatedBatteryRequired;
      const batterySuitability = batteryBuffer > 20 ? 1.0 : Math.max(0, batteryBuffer / 20);

      // 3. Workload penalty
      const workloadPenalty = robot.status === 'IDLE' ? 0 : (robot.plannedPath.length * 1.5);

      // 4. Communication status
      const commReliability = robot.communicationStatus === 'ONLINE' ? 1.0 : 0.5;

      // Calculate weighted score (lower cost is better)
      const cost =
        distToSource * 1.5 +
        workloadPenalty +
        (100 - robot.battery) * 0.4 -
        (commReliability * 20);

      const explanation = `${robot.name}: Dist ${distToSource} units, Bat ${robot.battery.toFixed(0)}%, Status ${robot.status}`;

      scores.push({
        robotId: robot.id,
        totalScore: cost,
        factors: {
          distanceCost: distToSource,
          batterySuitability,
          workloadPenalty,
          commReliability,
        },
        explanation,
      });
    }

    // Sort by lowest cost
    scores.sort((a, b) => a.totalScore - b.totalScore);

    const winner = available.find((r) => r.id === scores[0].robotId) || null;
    return { assignedRobot: winner, scoreDetails: scores };
  }

  /**
   * Reassigns an existing task if robot is incapacitated
   */
  public static handleReassignment(
    task: Task,
    failedRobotId: string,
    robots: Robot[],
    grid: WarehouseGrid
  ): { newRobot: Robot | null; scoreDetails: AllocationScore[] } {
    const candidates = robots.filter(
      (r) =>
        r.id !== failedRobotId &&
        r.currentTaskId === null &&
        r.status !== 'OFFLINE' &&
        r.status !== 'EMERGENCY_STOP' &&
        r.status !== 'LOW_BATTERY' &&
        r.status !== 'CHARGING' &&
        r.battery >= 25
    );
    task.reassignmentCount++;
    task.status = 'REASSIGNED';
    task.logs.push(`Reassigned from ${failedRobotId} at ${Date.now()}`);

    const result = this.allocateTask(task, candidates, grid);
    if (result.assignedRobot) {
      task.assignedRobotId = result.assignedRobot.id;
      task.status = 'ASSIGNED';
      task.logs.push(`Assigned to ${result.assignedRobot.name}`);
    } else {
      task.assignedRobotId = null;
      task.status = 'PENDING';
      task.logs.push(`No available alternative robot found. Task queued as PENDING.`);
    }

    return { newRobot: result.assignedRobot, scoreDetails: result.scoreDetails };
  }
}
