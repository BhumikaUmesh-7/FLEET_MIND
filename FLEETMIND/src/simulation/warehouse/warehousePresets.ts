import { CellType, Obstacle, Station, WarehouseGrid } from '../../types';

export function createEmptyGrid(width: number, height: number): CellType[][] {
  const cells: CellType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push('WALL');
      } else {
        row.push('EMPTY');
      }
    }
    cells.push(row);
  }
  return cells;
}

export function createSmallWarehouse(): WarehouseGrid {
  const width = 16;
  const height = 12;
  const cells = createEmptyGrid(width, height);

  // Shelves / racks layout: 2 double rows of shelves with aisles
  // Shelf row 1
  for (let x = 3; x <= 6; x++) {
    cells[3][x] = 'SHELF';
    cells[4][x] = 'SHELF';
  }
  // Shelf row 2
  for (let x = 9; x <= 12; x++) {
    cells[3][x] = 'SHELF';
    cells[4][x] = 'SHELF';
  }
  // Shelf row 3
  for (let x = 3; x <= 6; x++) {
    cells[7][x] = 'SHELF';
    cells[8][x] = 'SHELF';
  }
  // Shelf row 4
  for (let x = 9; x <= 12; x++) {
    cells[7][x] = 'SHELF';
    cells[8][x] = 'SHELF';
  }

  // Intersections
  cells[2][2] = 'INTERSECTION';
  cells[2][7] = 'INTERSECTION';
  cells[2][13] = 'INTERSECTION';
  cells[5][2] = 'INTERSECTION';
  cells[5][7] = 'INTERSECTION';
  cells[5][13] = 'INTERSECTION';
  cells[9][2] = 'INTERSECTION';
  cells[9][7] = 'INTERSECTION';
  cells[9][13] = 'INTERSECTION';

  const stations: Station[] = [
    { id: 'st-pick-1', name: 'Pickup Zone Alpha', type: 'PICKUP', x: 2, y: 1 },
    { id: 'st-pick-2', name: 'Pickup Zone Beta', type: 'PICKUP', x: 7, y: 1 },
    { id: 'st-drop-1', name: 'Drop Station 01', type: 'DROP', x: 13, y: 10 },
    { id: 'st-drop-2', name: 'Drop Station 02', type: 'DROP', x: 8, y: 10 },
    { id: 'st-chg-1', name: 'Charging Dock A', type: 'CHARGING', x: 1, y: 5 },
    { id: 'st-chg-2', name: 'Charging Dock B', type: 'CHARGING', x: 1, y: 6 },
    { id: 'st-load-1', name: 'Loading Bay 01', type: 'LOADING', x: 14, y: 5 },
  ];

  for (const s of stations) {
    if (s.type === 'PICKUP') cells[s.y][s.x] = 'PICKUP_STATION';
    else if (s.type === 'DROP') cells[s.y][s.x] = 'DROP_STATION';
    else if (s.type === 'CHARGING') cells[s.y][s.x] = 'CHARGING_STATION';
    else if (s.type === 'LOADING') cells[s.y][s.x] = 'LOADING';
  }

  return {
    width,
    height,
    cells,
    stations,
    obstacles: [],
  };
}

export function createMediumWarehouse(): WarehouseGrid {
  const width = 24;
  const height = 18;
  const cells = createEmptyGrid(width, height);

  // 3 columns of storage shelf clusters
  const shelfColumns = [
    { startX: 3, endX: 7 },
    { startX: 10, endX: 14 },
    { startX: 17, endX: 21 },
  ];

  const shelfRowBands = [
    { startY: 3, endY: 5 },
    { startY: 8, endY: 10 },
    { startY: 13, endY: 15 },
  ];

  for (const col of shelfColumns) {
    for (const row of shelfRowBands) {
      for (let y = row.startY; y <= row.endY; y++) {
        for (let x = col.startX; x <= col.endX; x++) {
          // Leave middle slot open for cross-pass through
          if (x === Math.floor((col.startX + col.endX) / 2)) {
            cells[y][x] = 'AISLE';
          } else {
            cells[y][x] = 'SHELF';
          }
        }
      }
    }
  }

  // Intersections at main thoroughfares
  for (let x of [2, 8, 9, 15, 16, 22]) {
    for (let y of [2, 6, 7, 11, 12, 16]) {
      if (x < width - 1 && y < height - 1 && cells[y][x] === 'EMPTY') {
        cells[y][x] = 'INTERSECTION';
      }
    }
  }

  // Restricted zone in high-speed staging area
  for (let x = 10; x <= 14; x++) {
    cells[1][x] = 'RESTRICTED';
  }

  const stations: Station[] = [
    { id: 'st-pick-1', name: 'Inbound Dock 1', type: 'PICKUP', x: 2, y: 1 },
    { id: 'st-pick-2', name: 'Inbound Dock 2', type: 'PICKUP', x: 7, y: 1 },
    { id: 'st-pick-3', name: 'Inbound Dock 3', type: 'PICKUP', x: 15, y: 1 },
    { id: 'st-pick-4', name: 'Inbound Dock 4', type: 'PICKUP', x: 21, y: 1 },
    { id: 'st-drop-1', name: 'Outbound Pack 1', type: 'DROP', x: 2, y: 16 },
    { id: 'st-drop-2', name: 'Outbound Pack 2', type: 'DROP', x: 8, y: 16 },
    { id: 'st-drop-3', name: 'Outbound Pack 3', type: 'DROP', x: 14, y: 16 },
    { id: 'st-drop-4', name: 'Outbound Pack 4', type: 'DROP', x: 21, y: 16 },
    { id: 'st-chg-1', name: 'Rapid Charger 1', type: 'CHARGING', x: 1, y: 7 },
    { id: 'st-chg-2', name: 'Rapid Charger 2', type: 'CHARGING', x: 1, y: 8 },
    { id: 'st-chg-3', name: 'Rapid Charger 3', type: 'CHARGING', x: 1, y: 9 },
    { id: 'st-chg-4', name: 'Rapid Charger 4', type: 'CHARGING', x: 1, y: 10 },
    { id: 'st-load-1', name: 'Pallet Transfer A', type: 'LOADING', x: 22, y: 6 },
    { id: 'st-load-2', name: 'Pallet Transfer B', type: 'LOADING', x: 22, y: 12 },
  ];

  for (const s of stations) {
    if (s.type === 'PICKUP') cells[s.y][s.x] = 'PICKUP_STATION';
    else if (s.type === 'DROP') cells[s.y][s.x] = 'DROP_STATION';
    else if (s.type === 'CHARGING') cells[s.y][s.x] = 'CHARGING_STATION';
    else if (s.type === 'LOADING') cells[s.y][s.x] = 'LOADING';
  }

  return {
    width,
    height,
    cells,
    stations,
    obstacles: [],
  };
}

export function createHighCongestionWarehouse(): WarehouseGrid {
  const width = 30;
  const height = 20;
  const cells = createEmptyGrid(width, height);

  // Long narrow vertical storage aisles with tight intersections
  for (let x = 3; x <= 26; x += 3) {
    for (let y = 3; y <= 16; y++) {
      // Create choke points every 4 cells
      if (y === 6 || y === 10 || y === 14) {
        cells[y][x] = 'INTERSECTION';
      } else {
        cells[y][x] = 'SHELF';
      }
    }
  }

  // Restricted corridors
  for (let x = 8; x <= 22; x++) {
    cells[2][x] = 'RESTRICTED';
    cells[17][x] = 'RESTRICTED';
  }

  const stations: Station[] = [
    { id: 'st-pick-1', name: 'Intake Bay A', type: 'PICKUP', x: 2, y: 1 },
    { id: 'st-pick-2', name: 'Intake Bay B', type: 'PICKUP', x: 8, y: 1 },
    { id: 'st-pick-3', name: 'Intake Bay C', type: 'PICKUP', x: 20, y: 1 },
    { id: 'st-pick-4', name: 'Intake Bay D', type: 'PICKUP', x: 27, y: 1 },
    { id: 'st-drop-1', name: 'Sort Station 1', type: 'DROP', x: 2, y: 18 },
    { id: 'st-drop-2', name: 'Sort Station 2', type: 'DROP', x: 14, y: 18 },
    { id: 'st-drop-3', name: 'Sort Station 3', type: 'DROP', x: 27, y: 18 },
    { id: 'st-chg-1', name: 'Charger Rack 1', type: 'CHARGING', x: 1, y: 8 },
    { id: 'st-chg-2', name: 'Charger Rack 2', type: 'CHARGING', x: 1, y: 9 },
    { id: 'st-chg-3', name: 'Charger Rack 3', type: 'CHARGING', x: 1, y: 10 },
    { id: 'st-chg-4', name: 'Charger Rack 4', type: 'CHARGING', x: 1, y: 11 },
    { id: 'st-load-1', name: 'Buffer Bay 1', type: 'LOADING', x: 28, y: 8 },
    { id: 'st-load-2', name: 'Buffer Bay 2', type: 'LOADING', x: 28, y: 12 },
  ];

  for (const s of stations) {
    if (s.type === 'PICKUP') cells[s.y][s.x] = 'PICKUP_STATION';
    else if (s.type === 'DROP') cells[s.y][s.x] = 'DROP_STATION';
    else if (s.type === 'CHARGING') cells[s.y][s.x] = 'CHARGING_STATION';
    else if (s.type === 'LOADING') cells[s.y][s.x] = 'LOADING';
  }

  return {
    width,
    height,
    cells,
    stations,
    obstacles: [],
  };
}

export function isCellTraversable(grid: WarehouseGrid, x: number, y: number): boolean {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return false;
  const cell = grid.cells[y][x];
  if (cell === 'WALL' || cell === 'SHELF' || cell === 'BLOCKED_AISLE' || cell === 'OBSTACLE') {
    return false;
  }
  // Check obstacle list
  for (const obs of grid.obstacles) {
    if (obs.x === x && obs.y === y) return false;
  }
  return true;
}

export function getMovementCost(grid: WarehouseGrid, x: number, y: number): number {
  if (!isCellTraversable(grid, x, y)) return Infinity;
  const cell = grid.cells[y][x];
  if (cell === 'RESTRICTED') return 3.0; // Higher cost to traverse restricted zones
  if (cell === 'INTERSECTION') return 1.5; // Slight cost to discourage lingering in intersections
  return 1.0;
}
