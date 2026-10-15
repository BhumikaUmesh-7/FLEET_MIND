import React from 'react';
import {
  Activity,
  Battery,
  Compass,
  Cpu,
  HelpCircle,
  Radio,
  RefreshCw,
  Sliders,
  Thermometer,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { Robot } from '../../types';

interface RobotDrawerProps {
  robot: Robot | null;
  onClose: () => void;
  onTriggerLowBattery: (id: string) => void;
  onToggleComm: (id: string, status: 'ONLINE' | 'DEGRADED' | 'OFFLINE') => void;
}

export const RobotDrawer: React.FC<RobotDrawerProps> = ({
  robot,
  onClose,
  onTriggerLowBattery,
  onToggleComm,
}) => {
  if (!robot) return null;

  const { decisionState, sensorState } = robot;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-[#0c101c] border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-[#090d17] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: robot.color }}
          />
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center space-x-2">
              <span>{robot.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                {robot.id}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Status: <span className="text-cyan-400 font-semibold">{robot.status}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Position / Heading</span>
            <span className="font-mono text-sm font-bold text-white">
              [{robot.position.x}, {robot.position.y}]
            </span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">
              {robot.position.heading || 0}°
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Battery State</span>
            <div className="flex items-center space-x-1.5">
              <span
                className={`font-mono text-sm font-bold ${
                  robot.battery < 25 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {robot.battery.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {sensorState.batteryVoltage.toFixed(1)}V
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Distance / Tasks</span>
            <span className="font-mono text-sm font-bold text-white">
              {robot.distanceTravelled}m
            </span>
            <span className="text-[11px] text-emerald-400 ml-2 font-mono">
              {robot.completedTasks} done
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Task / Route</span>
            <span className="font-mono text-xs font-semibold text-cyan-300 truncate block">
              {robot.currentTaskId || 'NO ACTIVE TASK'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {robot.plannedPath.length} waypoints left
            </span>
          </div>
        </div>

        {/* DECISION EXPLAINABILITY (Edge Intelligence) */}
        <div className="bg-slate-900/90 border border-cyan-900/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Edge Decision Explainability</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Autonomous</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Decision
            </span>
            <p className="text-xs font-bold text-white mt-0.5">{decisionState.decision}</p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Why (Rationale)
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800">
              {decisionState.why}
            </p>
          </div>

          {/* Inputs Factor Breakdown */}
          {decisionState.inputs && Object.keys(decisionState.inputs).length > 0 && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono mb-1">
                Evaluated Input Factors
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                {Object.entries(decisionState.inputs).map(([k, v]) => (
                  <div key={k} className="bg-slate-950/80 px-2 py-1 rounded text-slate-400">
                    <span className="text-slate-500">{k}:</span>{' '}
                    <span className="text-cyan-300 font-medium">
                      {typeof v === 'number' ? v.toFixed(1) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives & Selected Action */}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Action</span>
              <span className="text-emerald-400 font-mono font-bold">
                {decisionState.selectedAction}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Alternatives</span>
              <span className="text-slate-400 text-[10px]">
                {decisionState.alternatives.join(' · ') || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor & Telemetry Feed */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Onboard Sensor Array</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">LiDAR Forward Path:</span>
              <span
                className={`font-semibold font-mono ${
                  sensorState.forwardClear ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {sensorState.forwardClear ? 'CLEAR (3.0m)' : 'OBSTRUCTED (0.8m)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Core Temperature:</span>
              <span className="font-mono text-slate-300 font-semibold">
                {sensorState.temperatureC.toFixed(1)}°C
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">P2P Network Group:</span>
              <span className="font-mono text-cyan-400">Group {robot.networkGroup}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Connected Peers:</span>
              <span className="font-mono text-slate-300">
                {robot.neighborRobots.length} active
              </span>
            </div>
          </div>
        </div>

        {/* Operator Fault Injection Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs border-b border-slate-800 pb-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Edge Agent Manual Overrides</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onTriggerLowBattery(robot.id)}
              className="px-2.5 py-1.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold transition"
            >
              Inject Low Battery (14%)
            </button>

            {robot.communicationStatus === 'ONLINE' ? (
              <button
                onClick={() => onToggleComm(robot.id, 'OFFLINE')}
                className="px-2.5 py-1.5 rounded bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/60 text-xs font-semibold transition flex items-center justify-center space-x-1"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Sever Comm</span>
              </button>
            ) : (
              <button
                onClick={() => onToggleComm(robot.id, 'ONLINE')}
                className="px-2.5 py-1.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition flex items-center justify-center space-x-1"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Restore Comm</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
