import React, { useState } from 'react';
import {
  AlertTriangle,
  BatteryLow,
  CheckCircle,
  Clock,
  Filter,
  Flame,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Split,
  WifiOff,
} from 'lucide-react';
import { Robot, TimelineEvent, WarehouseGrid } from '../../types';

interface FaultInjectionPanelProps {
  events: TimelineEvent[];
  robots: Robot[];
  grid: WarehouseGrid;
  onBlockAisle: (x: number, y: number, len: number, horizontal: boolean) => void;
  onRestoreAisles: () => void;
  onDropObstacle: (x: number, y: number) => void;
  onTriggerLowBattery: (robotId: string) => void;
  onToggleComm: (robotId: string, status: 'ONLINE' | 'DEGRADED' | 'OFFLINE') => void;
  onTogglePartition: (active: boolean) => void;
  isPartitionActive: boolean;
}

export const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({
  events,
  robots,
  grid,
  onBlockAisle,
  onRestoreAisles,
  onDropObstacle,
  onTriggerLowBattery,
  onToggleComm,
  onTogglePartition,
  isPartitionActive,
}) => {
  const [selectedRobotId, setSelectedRobotId] = useState<string>(robots[0]?.id || 'R-01');
  const [blockX, setBlockX] = useState<number>(8);
  const [blockY, setBlockY] = useState<number>(5);
  const [blockLen, setBlockLen] = useState<number>(3);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 text-xs">
      {/* Left: Fault Injection Controls */}
      <div className="lg:col-span-1 space-y-4">
        {/* Aisle Blockage Control */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4" />
              <span>Aisle Blockage Injection</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start X</label>
              <input
                type="number"
                min={1}
                max={grid.width - 2}
                value={blockX}
                onChange={(e) => setBlockX(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start Y</label>
              <input
                type="number"
                min={1}
                max={grid.height - 2}
                value={blockY}
                onChange={(e) => setBlockY(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Length</label>
              <input
                type="number"
                min={1}
                max={6}
                value={blockLen}
                onChange={(e) => setBlockLen(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => onBlockAisle(blockX, blockY, blockLen, true)}
              className="flex-1 py-1.5 px-2 bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-300 font-semibold rounded transition"
            >
              Block Horizontal Aisle
            </button>
            <button
              onClick={() => onBlockAisle(blockX, blockY, blockLen, false)}
              className="flex-1 py-1.5 px-2 bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-300 font-semibold rounded transition"
            >
              Block Vertical Aisle
            </button>
          </div>

          <button
            onClick={onRestoreAisles}
            className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded transition flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All Aisles & Clear Hazards</span>
          </button>
        </div>

        {/* Robot Hardware & Comm Faults */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span>Target Robot Fault Injection</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Select Target AMR</label>
            <select
              value={selectedRobotId}
              onChange={(e) => setSelectedRobotId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
            >
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id}) · Bat: {r.battery.toFixed(0)}% · {r.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onTriggerLowBattery(selectedRobotId)}
              className="py-1.5 px-2 bg-amber-950/60 border border-amber-800/80 hover:bg-amber-900 text-amber-300 font-semibold rounded transition flex items-center justify-center space-x-1.5"
            >
              <BatteryLow className="w-3.5 h-3.5" />
              <span>Drain Battery</span>
            </button>

            <button
              onClick={() => onToggleComm(selectedRobotId, 'OFFLINE')}
              className="py-1.5 px-2 bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 font-semibold rounded transition flex items-center justify-center space-x-1.5"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Sever Comm</span>
            </button>
          </div>
        </div>

        {/* Network Partition Simulation */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Split className="w-4 h-4" />
              <span>Fleet Network Partition</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Simulates a split-brain Wi-Fi network partition dividing robots into Group 1 (R-01..R-03)
            and Group 2 (R-04..R-05). Cross-group P2P packets are dropped.
          </p>

          <button
            onClick={() => onTogglePartition(!isPartitionActive)}
            className={`w-full py-2 px-3 rounded font-bold transition flex items-center justify-center space-x-2 border ${
              isPartitionActive
                ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                : 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>{isPartitionActive ? 'Heal Network Partition' : 'Inject Network Partition'}</span>
          </button>
        </div>
      </div>

      {/* Right: Live Audit & Event Timeline */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2 text-white font-mono font-bold">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Event Timeline & Audit Stream</span>
          </div>

          <div className="flex items-center space-x-1 text-[11px]">
            {['ALL', 'CRITICAL', 'WARN', 'SUCCESS', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded font-mono transition ${
                  severityFilter === sev
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded border flex items-start space-x-2.5 font-mono text-xs ${
                evt.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-800/80 text-red-200'
                  : evt.severity === 'WARN'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : evt.severity === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="mt-0.5">
                {evt.severity === 'CRITICAL' ? (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                ) : evt.severity === 'WARN' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : evt.severity === 'SUCCESS' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Radio className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Tick {evt.simTime}</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-sans leading-tight text-slate-200">{evt.description}</p>
                {evt.robotId && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-cyan-300">
                    {evt.robotId}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="py-12 text-center text-slate-500 font-mono">
              No events recorded for severity filter '{severityFilter}'.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
