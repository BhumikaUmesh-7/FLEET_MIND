import { Position, WarehouseGrid } from '../../types';
import { getMovementCost, isCellTraversable } from '../warehouse/warehousePresets';

export interface PlannerOptions {
  allowDiagonal?: boolean;
  timeHorizon?: number;
  timeReservations?: Map<string, string>; // "x,y,t" -> robotId
  knownBlockedCells?: Set<string>; // "x,y"
  robotRadius?: number;
}

export interface PathPlanResult {
  path: Position[];
  cost: number;
  expandedNodes: number;
  planningTimeMs: number;
  found: boolean;
}

interface Node {
  x: number;
  y: number;
  t: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class AStarPlanner {
  /**
   * Plans an optimal, collision-free path from start to goal
   */
  public static planPath(
    grid: WarehouseGrid,
    start: Position,
    goal: Position,
    options: PlannerOptions = {}
  ): PathPlanResult {
    const startTime = performance.now();
    const allowDiagonal = options.allowDiagonal ?? false;
    const timeReservations = options.timeReservations;
    const knownBlocked = options.knownBlockedCells;

    // Check trivial or invalid cases
    if (start.x === goal.x && start.y === goal.y) {
      return {
        path: [{ x: start.x, y: start.y }],
        cost: 0,
        expandedNodes: 1,
        planningTimeMs: performance.now() - startTime,
        found: true,
      };
    }

    let effectiveGoal = { ...goal };
    if (!isCellTraversable(grid, effectiveGoal.x, effectiveGoal.y)) {
      // Find closest traversable neighbor to goal
      const neighbors = this.getNeighbors(grid, effectiveGoal.x, effectiveGoal.y, false);
      if (neighbors.length === 0) {
        return {
          path: [],
          cost: Infinity,
          expandedNodes: 0,
          planningTimeMs: performance.now() - startTime,
          found: false,
        };
      }
      effectiveGoal = neighbors[0];
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const hStart = this.heuristic(start.x, start.y, effectiveGoal.x, effectiveGoal.y);
    const startNode: Node = {
      x: start.x,
      y: start.y,
      t: 0,
      g: 0,
      h: hStart,
      f: hStart,
      parent: null,
    };

    openList.push(startNode);
    let expandedCount = 0;
    const maxExpanded = 4000; // Safeguard against unbounded search

    while (openList.length > 0 && expandedCount < maxExpanded) {
      // Pick node with lowest f-score
      let lowestIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIndex].f) {
          lowestIndex = i;
        } else if (openList[i].f === openList[lowestIndex].f && openList[i].h < openList[lowestIndex].h) {
          lowestIndex = i;
        }
      }

      const current = openList.splice(lowestIndex, 1)[0];
      expandedCount++;

      // Check if goal reached
      if (current.x === effectiveGoal.x && current.y === effectiveGoal.y) {
        const reconstructed = this.reconstructPath(current);
        return {
          path: reconstructed,
          cost: current.g,
          expandedNodes: expandedCount,
          planningTimeMs: performance.now() - startTime,
          found: true,
        };
      }

      const stateKey = `${current.x},${current.y},${timeReservations ? current.t : 0}`;
      closedSet.add(stateKey);

      // Explore neighbors
      const neighbors = this.getNeighbors(grid, current.x, current.y, allowDiagonal);

      // Also allow wait-in-place move if using time reservations
      if (timeReservations) {
        neighbors.push({ x: current.x, y: current.y });
      }

      for (const next of neighbors) {
        const nextT = current.t + 1;
        const nextStateKey = `${next.x},${next.y},${timeReservations ? nextT : 0}`;

        if (closedSet.has(nextStateKey)) continue;

        // Check if locally blocked
        const posKey = `${next.x},${next.y}`;
        if (knownBlocked && knownBlocked.has(posKey)) continue;

        // Check time reservations (space-time conflict avoidance)
        if (timeReservations) {
          const resKey = `${next.x},${next.y},${nextT}`;
          if (timeReservations.has(resKey)) {
            // Cell reserved at time nextT
            continue;
          }
        }

        const moveCost = getMovementCost(grid, next.x, next.y);
        if (moveCost === Infinity) continue;

        const isDiagonal = next.x !== current.x && next.y !== current.y;
        const stepCost = (isDiagonal ? 1.414 : 1.0) * moveCost;
        const gScore = current.g + stepCost;

        // Look for existing node in openList
        const existing = openList.find(
          (n) => n.x === next.x && n.y === next.y && (!timeReservations || n.t === nextT)
        );

        if (existing) {
          if (gScore < existing.g) {
            existing.g = gScore;
            existing.f = gScore + existing.h;
            existing.parent = current;
          }
        } else {
          const h = this.heuristic(next.x, next.y, effectiveGoal.x, effectiveGoal.y);
          openList.push({
            x: next.x,
            y: next.y,
            t: nextT,
            g: gScore,
            h,
            f: gScore + h,
            parent: current,
          });
        }
      }
    }

    return {
      path: [],
      cost: Infinity,
      expandedNodes: expandedCount,
      planningTimeMs: performance.now() - startTime,
      found: false,
    };
  }

  private static getNeighbors(
    grid: WarehouseGrid,
    x: number,
    y: number,
    allowDiagonal: boolean
  ): { x: number; y: number }[] {
    const directions: [number, number][] = [
      [0, -1], // North
      [1, 0],  // East
      [0, 1],  // South
      [-1, 0], // West
    ];

    if (allowDiagonal) {
      directions.push([1, -1], [1, 1], [-1, 1], [-1, -1]);
    }

    const results: { x: number; y: number }[] = [];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (isCellTraversable(grid, nx, ny)) {
        // Diagonal corner cutting check
        if (dx !== 0 && dy !== 0) {
          if (!isCellTraversable(grid, x + dx, y) || !isCellTraversable(grid, x, y + dy)) {
            continue;
          }
        }
        results.push({ x: nx, y: ny });
      }
    }
    return results;
  }

  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance with slight tie-breaker
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx + dy) * 1.001;
  }

  private static reconstructPath(node: Node): Position[] {
    const path: Position[] = [];
    let curr: Node | null = node;
    while (curr !== null) {
      path.push({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    path.reverse();

    // Assign headings along path
    for (let i = 0; i < path.length; i++) {
      if (i < path.length - 1) {
        const next = path[i + 1];
        const dx = next.x - path[i].x;
        const dy = next.y - path[i].y;
        if (dx === 1) path[i].heading = 0;
        else if (dy === 1) path[i].heading = 90;
        else if (dx === -1) path[i].heading = 180;
        else if (dy === -1) path[i].heading = 270;
      } else if (i > 0) {
        path[i].heading = path[i - 1].heading;
      } else {
        path[i].heading = 0;
      }
    }

    return path;
  }

  /**
   * D* Lite Compatibility Layer & Dynamic Replanning:
   * Detects if an existing planned path contains any newly blocked cells,
   * returning true if replanning is mandatory.
   */
  public static isPathInvalidated(path: Position[], grid: WarehouseGrid, knownBlocked: Set<string>): boolean {
    for (const pt of path) {
      if (!isCellTraversable(grid, pt.x, pt.y)) return true;
      if (knownBlocked.has(`${pt.x},${pt.y}`)) return true;
    }
    return false;
  }
}
