import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Cpu,
  FastForward,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  StepForward,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { CoordinationMode } from '../../types';
import { Maximize2, Minimize2, Users } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
  coordinationMode: CoordinationMode;
  onToggleMode: () => void;
  simTime: number;
  onEmergencyStop: (active: boolean) => void;
  isEmergencyStop: boolean;
  onStartDemo: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  robotCount?: number;
  onSetRobotCount?: (count: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onSetSpeed,
  coordinationMode,
  onToggleMode,
  simTime,
  onEmergencyStop,
  isEmergencyStop,
  onStartDemo,
  isFullscreen = false,
  onToggleFullscreen,
  robotCount = 10,
  onSetRobotCount,
}) => {
  const [showConfirmEStop, setShowConfirmEStop] = useState(false);

  return (
    <header className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-200">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-black">
          <Cpu className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold tracking-wider text-base text-white font-mono">
              FLEETMIND
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/60 uppercase tracking-widest font-mono">
              Edge Fleet-AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Decentralized Autonomous Mobile Robot Coordination
          </p>
        </div>
      </div>

      {/* Center Controls: Simulation Execution */}
      <div className="flex items-center flex-wrap gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-lg shadow-inner">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isRunning ? 'Pause simulation' : 'Start simulation'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'PAUSE' : 'RUN'}</span>
        </button>

        {/* Step Button */}
        <button
          onClick={onStep}
          disabled={isRunning}
          className="px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
          title="Step forward 1 simulation tick"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span className="hidden md:inline">STEP</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 px-1 bg-slate-950/70 rounded border border-slate-800 text-xs font-mono">
          <FastForward className="w-3 h-3 text-slate-500" />
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] transition ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Reset simulation environment"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Sim Tick Counter */}
        <div className="px-2 text-xs font-mono text-slate-400 border-l border-slate-800">
          TICK: <span className="text-white font-bold">{simTime}</span>
        </div>
      </div>

      {/* Right Controls: Fleet Size, Fullscreen, Mode Toggle, Demo Mode, E-Stop */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Fleet Scaling Controls */}
        {onSetRobotCount && (
          <div className="hidden xl:flex items-center space-x-1 px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono">
            <Users className="w-3.5 h-3.5 text-cyan-400 mr-1" />
            <span className="text-slate-400 text-[11px] mr-1">FLEET:</span>
            {[6, 8, 10, 12, 16].map((cnt) => (
              <button
                key={cnt}
                onClick={() => onSetRobotCount(cnt)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  robotCount === cnt
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`Configure fleet to ${cnt} autonomous mobile robots`}
              >
                {cnt}
              </button>
            ))}
          </div>
        )}

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider flex items-center space-x-1.5 border transition ${
              isFullscreen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700/80 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen Mode' : 'View Warehouse Simulation in Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>
          </button>
        )}

        {/* Coordination Mode Toggle */}
        <button
          onClick={onToggleMode}
          className={`px-2.5 py-1.5 rounded text-xs font-mono border transition flex items-center space-x-1.5 ${
            coordinationMode === 'FLEETMIND_DECENTRALIZED'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
              : 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900/60'
          }`}
          title="Click to switch coordination mode"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {coordinationMode === 'FLEETMIND_DECENTRALIZED' ? 'MODE: EDGE-AI' : 'MODE: BASELINE'}
          </span>
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={onStartDemo}
          className="px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">DEMO FLOW</span>
        </button>

        {/* Emergency Stop Switch */}
        <button
          onClick={() => {
            if (!isEmergencyStop) {
              onEmergencyStop(true);
            } else {
              setShowConfirmEStop(true);
            }
          }}
          className={`px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider flex items-center space-x-1.5 border transition ${
            isEmergencyStop
              ? 'bg-red-600 text-white border-red-400 animate-pulse'
              : 'bg-red-950/70 text-red-400 border-red-800/80 hover:bg-red-900/70'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>{isEmergencyStop ? 'E-STOP ACTIVE' : 'E-STOP'}</span>
        </button>
      </div>

      {/* Confirmation Modal for releasing E-Stop */}
      {showConfirmEStop && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/50 rounded-xl p-5 max-w-sm w-full text-slate-200 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Release Emergency Stop?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Confirm safety clearance. Releasing will restore AMRs to IDLE state and resume
              decentralized peer coordination.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmEStop(false)}
                className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmergencyStop(false);
                  setShowConfirmEStop(false);
                }}
                className="px-3 py-1.5 rounded text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
