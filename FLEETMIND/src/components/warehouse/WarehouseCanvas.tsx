import React, { useEffect, useRef, useState } from 'react';
import { Conflict, Position, Robot, WarehouseGrid } from '../../types';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface WarehouseCanvasProps {
  grid: WarehouseGrid;
  robots: Robot[];
  selectedRobotId: string | null;
  onSelectRobot: (id: string | null) => void;
  activeConflicts: Conflict[];
  onCellClick?: (pos: Position) => void;
  showTrails?: boolean;
  showRoutes?: boolean;
  showP2PLinks?: boolean;
  showConflicts?: boolean;
  showHeatmap?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  grid,
  robots,
  selectedRobotId,
  onSelectRobot,
  activeConflicts,
  onCellClick,
  showTrails = true,
  showRoutes = true,
  showP2PLinks = true,
  showConflicts = true,
  showHeatmap = false,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  const cellSize = 32;

  const prevDimRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Fit view automatically based on container dimensions
  const applyFitView = (containerW: number, containerH: number) => {
    if (containerW <= 0 || containerH <= 0) return;
    const mapW = grid.width * cellSize;
    const mapH = grid.height * cellSize;

    const scale = Math.max(0.4, Math.min((containerW - 32) / mapW, (containerH - 32) / mapH, 1.8));
    const targetX = Math.max(16, (containerW - mapW * scale) / 2);
    const targetY = Math.max(16, (containerH - mapH * scale) / 2);

    setZoom((prev) => (Math.abs(prev - scale) > 0.005 ? scale : prev));
    setOffset((prev) =>
      Math.abs(prev.x - targetX) > 1 || Math.abs(prev.y - targetY) > 1
        ? { x: targetX, y: targetY }
        : prev
    );
  };

  const handleResetView = () => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 550;
    prevDimRef.current = { w, h };
    applyFitView(w, h);
  };

  // Observe container resizing (fullscreen toggles, split pane collapses, browser window adjustments)
  useEffect(() => {
    if (!containerRef.current) return;
    let animId: number | null = null;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        if (
          Math.abs(width - prevDimRef.current.w) > 4 ||
          Math.abs(height - prevDimRef.current.h) > 4
        ) {
          if (animId) cancelAnimationFrame(animId);
          animId = requestAnimationFrame(() => {
            prevDimRef.current = { w: width, h: height };
            applyFitView(width, height);
          });
        }
      }
    });

    ro.observe(containerRef.current);
    return () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [grid.width, grid.height, isFullscreen]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear background
    ctx.fillStyle = '#0a0d14'; // Industrial dark base
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Grid Cells
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.cells[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Background color based on cell type
        switch (cell) {
          case 'WALL':
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(px, py, cellSize, cellSize);
            break;

          case 'SHELF':
            ctx.fillStyle = '#111827';
            ctx.fillRect(px, py, cellSize, cellSize);
            // Draw rack lines
            ctx.fillStyle = '#374151';
            ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
            break;

          case 'INTERSECTION':
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px, py, cellSize, cellSize);
            // Draw subtle intersection cross
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(px + cellSize / 2, py + 4);
            ctx.lineTo(px + cellSize / 2, py + cellSize - 4);
            ctx.moveTo(px + 4, py + cellSize / 2);
            ctx.lineTo(px + cellSize - 4, py + cellSize / 2);
            ctx.stroke();
            break;

          case 'RESTRICTED':
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(px, py, cellSize, cellSize);
            // Hazard diagonal stripes
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py + cellSize);
            ctx.lineTo(px + cellSize, py);
            ctx.stroke();
            break;

          case 'BLOCKED_AISLE':
          case 'OBSTACLE':
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(px, py, cellSize, cellSize);
            // Red warning hatch
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + cellSize - 4, py + cellSize - 4);
            ctx.moveTo(px + cellSize - 4, py + 4);
            ctx.lineTo(px + 4, py + cellSize - 4);
            ctx.stroke();
            break;

          case 'PICKUP_STATION':
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            break;

          case 'DROP_STATION':
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            break;

          case 'CHARGING_STATION':
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            break;

          case 'LOADING':
            ctx.fillStyle = '#083344';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            break;

          default:
            // Standard Aisle
            ctx.fillStyle = '#090d16';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#172033';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px, py, cellSize, cellSize);
            break;
        }

        // Draw temporary obstacles from grid.obstacles
        for (const obs of grid.obstacles) {
          if (obs.x === x && obs.y === y) {
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
          }
        }
      }
    }

    // 2. Draw Station Glyphs and Labels
    for (const st of grid.stations) {
      const sx = st.x * cellSize + cellSize / 2;
      const sy = st.y * cellSize + cellSize / 2;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (st.type === 'PICKUP') {
        ctx.fillStyle = '#34d399';
        ctx.fillText('IN', sx, sy);
      } else if (st.type === 'DROP') {
        ctx.fillStyle = '#818cf8';
        ctx.fillText('OUT', sx, sy);
      } else if (st.type === 'CHARGING') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⚡', sx, sy);
      } else if (st.type === 'LOADING') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('BAY', sx, sy);
      }
    }

    // 3. Draw Peer Communication Links (Gossip mesh)
    if (showP2PLinks) {
      ctx.lineWidth = 1;
      for (let i = 0; i < robots.length; i++) {
        for (let j = i + 1; j < robots.length; j++) {
          const r1 = robots[i];
          const r2 = robots[j];
          if (
            r1.communicationStatus === 'ONLINE' &&
            r2.communicationStatus === 'ONLINE' &&
            r1.networkGroup === r2.networkGroup
          ) {
            const x1 = r1.position.x * cellSize + cellSize / 2;
            const y1 = r1.position.y * cellSize + cellSize / 2;
            const x2 = r2.position.x * cellSize + cellSize / 2;
            const y2 = r2.position.y * cellSize + cellSize / 2;

            ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // 4. Draw Trajectory Trails
    if (showTrails) {
      for (const robot of robots) {
        if (robot.trajectory && robot.trajectory.length > 1) {
          ctx.strokeStyle = `${robot.color}44`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          robot.trajectory.forEach((pt, idx) => {
            const cx = pt.x * cellSize + cellSize / 2;
            const cy = pt.y * cellSize + cellSize / 2;
            if (idx === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
          });
          ctx.stroke();
        }
      }
    }

    // 5. Draw Planned Paths (Routes)
    if (showRoutes) {
      for (const robot of robots) {
        if (robot.plannedPath && robot.plannedPath.length > 0) {
          const isSelected = robot.id === selectedRobotId;
          ctx.strokeStyle = isSelected ? '#ffffff' : `${robot.color}99`;
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.setLineDash(isSelected ? [4, 2] : [3, 3]);

          ctx.beginPath();
          const startX = robot.position.x * cellSize + cellSize / 2;
          const startY = robot.position.y * cellSize + cellSize / 2;
          ctx.moveTo(startX, startY);

          for (const wp of robot.plannedPath) {
            ctx.lineTo(wp.x * cellSize + cellSize / 2, wp.y * cellSize + cellSize / 2);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Target endpoint marker
          if (robot.target) {
            const tx = robot.target.x * cellSize + cellSize / 2;
            const ty = robot.target.y * cellSize + cellSize / 2;
            ctx.strokeStyle = robot.color;
            ctx.fillStyle = `${robot.color}33`;
            ctx.beginPath();
            ctx.arc(tx, ty, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }

    // 6. Draw Active Conflicts & Deadlock Alerts
    if (showConflicts) {
      for (const conf of activeConflicts) {
        const cx = conf.location.x * cellSize + cellSize / 2;
        const cy = conf.location.y * cellSize + cellSize / 2;

        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('CONFLICT', cx, cy - 18);
      }
    }

    // 7. Draw Robots
    for (const robot of robots) {
      const rx = robot.position.x * cellSize + cellSize / 2;
      const ry = robot.position.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.42;
      const isSelected = robot.id === selectedRobotId;

      // Selection halo
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, ry, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Robot chassis
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border colored by robot identifier
      ctx.strokeStyle = robot.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Status indicator ring inside
      let statusColor = '#10b981'; // Green for MOVING / IDLE
      if (robot.status === 'WAITING' || robot.status === 'AVOIDING') statusColor = '#f59e0b'; // Amber
      else if (robot.status === 'BLOCKED' || robot.status === 'EMERGENCY_STOP' || robot.status === 'ERROR')
        statusColor = '#ef4444'; // Red
      else if (robot.status === 'LOW_BATTERY') statusColor = '#f97316';
      else if (robot.status === 'CHARGING') statusColor = '#3b82f6';
      else if (robot.status === 'OFFLINE') statusColor = '#64748b';

      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Heading indicator arrow
      const headingRad = ((robot.position.heading || 0) * Math.PI) / 180;
      const hx = rx + Math.cos(headingRad) * (radius - 2);
      const hy = ry + Math.sin(headingRad) * (radius - 2);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Label: ID
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(robot.id, rx, ry - radius - 3);

      // Battery level mini-bar
      const barW = 18;
      const barH = 3;
      const bx = rx - barW / 2;
      const by = ry + radius + 4;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = robot.battery > 30 ? '#10b981' : '#ef4444';
      ctx.fillRect(bx, by, barW * (robot.battery / 100), barH);
    }

    // 8. Hover Highlight
    if (hoveredCell && hoveredCell.x < grid.width && hoveredCell.y < grid.height) {
      const hx = hoveredCell.x * cellSize;
      const hy = hoveredCell.y * cellSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx, hy, cellSize, cellSize);
    }

    ctx.restore();
  }, [
    grid,
    robots,
    selectedRobotId,
    activeConflicts,
    zoom,
    offset,
    hoveredCell,
    showTrails,
    showRoutes,
    showP2PLinks,
    showConflicts,
    showHeatmap,
  ]);

  // Pointer interactions for pan & select
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Calculate hovered cell
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellX = Math.floor((mouseX - offset.x) / (cellSize * zoom));
    const cellY = Math.floor((mouseY - offset.y) / (cellSize * zoom));

    if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
      setHoveredCell({ x: cellX, y: cellY });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);

    // If drag was very small, treat as click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellX = Math.floor((mouseX - offset.x) / (cellSize * zoom));
    const cellY = Math.floor((mouseY - offset.y) / (cellSize * zoom));

    if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
      // Check if robot was clicked
      const clickedRobot = robots.find((r) => r.position.x === cellX && r.position.y === cellY);
      if (clickedRobot) {
        onSelectRobot(clickedRobot.id === selectedRobotId ? null : clickedRobot.id);
      } else {
        if (onCellClick) {
          onCellClick({ x: cellX, y: cellY });
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[480px] bg-[#070a11] overflow-hidden select-none border border-slate-800 rounded-lg">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating Controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-slate-900/95 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          title="Fit to View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
        <span className="font-mono text-[11px] text-slate-400 min-w-[36px] text-center">{(zoom * 100).toFixed(0)}%</span>

        {onToggleFullscreen && (
          <>
            <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
            <button
              onClick={onToggleFullscreen}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded transition font-medium text-xs ${
                isFullscreen
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'hover:text-cyan-400 hover:bg-slate-800 text-slate-300'
              }`}
              title={isFullscreen ? 'Exit Full Screen' : 'View Simulation in Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="font-mono text-[11px] font-bold tracking-wide">
                {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Top Left Live Warehouse Overlay Badge */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-900/90 border border-slate-800/90 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl backdrop-blur-md pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-bold">{robots.length} AMRs Active</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">{grid.width}×{grid.height} Layout</span>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-400 font-medium">Decentralized P2P</span>
      </div>

      {/* Bottom coordinate badge */}
      {hoveredCell && (
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-xs font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
          Cell: [{hoveredCell.x}, {hoveredCell.y}] ·{' '}
          <span className="text-cyan-400 font-medium">
            {grid.cells[hoveredCell.y]?.[hoveredCell.x] || 'EMPTY'}
          </span>
        </div>
      )}
    </div>
  );
};
