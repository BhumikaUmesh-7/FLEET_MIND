import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FastForward,
  Flame,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  StepForward,
  Truck,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { KPIRow } from './components/dashboard/KPIRow';
import { GrandFinaleDemo } from './components/demo/GrandFinaleDemo';
import { FaultInjectionPanel } from './components/events/FaultInjectionPanel';
import { ExperimentLab } from './components/experiments/ExperimentLab';
import { RobotDrawer } from './components/fleet/RobotDrawer';
import { Header } from './components/layout/Header';
import { CommunicationInspector } from './components/network/CommunicationInspector';
import { ReplayScrubber } from './components/replay/ReplayScrubber';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskOperationsModal } from './components/tasks/TaskOperationsModal';
import { WarehouseCanvas } from './components/warehouse/WarehouseCanvas';
import { SimulationEngine } from './simulation/engine/SimulationEngine';
import {
  Conflict,
  CoordinationMode,
  Position,
  ReplayFrame,
  Robot,
  Task,
  TimelineEvent,
  WarehouseGrid,
} from './types';

type ActiveTab =
  | 'COMMAND_CENTER'
  | 'FLEET'
  | 'TASKS'
  | 'ANALYTICS'
  | 'EXPERIMENTS'
  | 'FAULT_INJECTION'
  | 'P2P_NETWORK';

export default function App() {
  // Initialize authoritative SimulationEngine singleton with 10 active robots
  const engine = useMemo(() => new SimulationEngine({ warehousePreset: 'Medium', robotCount: 10 }), []);

  // UI State synchronized on tick
  const [, setTickCounter] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [isEmergencyStop, setIsEmergencyStop] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('COMMAND_CENTER');

  // Fullscreen Simulation State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showFullscreenSpecs, setShowFullscreenSpecs] = useState<boolean>(true);
  const [activeSpecTab, setActiveSpecTab] = useState<'FLEET' | 'FAILOVERS' | 'EDGE_DECISION'>('FLEET');

  // Modals & Panels State
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showExperimentLab, setShowExperimentLab] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Replay State
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayFrame, setReplayFrame] = useState<ReplayFrame | null>(null);

  // Map layer toggles
  const [mapLayers, setMapLayers] = useState({
    showTrails: true,
    showRoutes: true,
    showP2PLinks: true,
    showConflicts: true,
  });

  // Keyboard shortcut listener: 'F' toggles fullscreen, 'Escape' exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;

      if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen((prev) => !prev);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Synchronize with native browser fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Subscribe to engine ticks and auto-start continuous fleet operations
  useEffect(() => {
    const unsub = engine.subscribeTick(() => {
      setTickCounter((t) => t + 1);
    });

    if (!engine.isRunning) {
      engine.start(1.5);
      setIsRunning(true);
    }

    return () => {
      unsub();
      engine.pause();
    };
  }, [engine]);

  // Selected robot
  const robotsList = useMemo(() => Array.from(engine.robots.values()), [engine, engine.simTime]);
  const activeRobot = useMemo(() => {
    return robotsList.find((r) => r.id === selectedRobotId) || null;
  }, [robotsList, selectedRobotId]);

  // Handlers
  const handleTogglePlay = () => {
    if (engine.isRunning) {
      engine.pause();
      setIsRunning(false);
    } else {
      if (isReplaying) setIsReplaying(false);
      engine.start(speed);
      setIsRunning(true);
    }
  };

  const handleStep = () => {
    if (isReplaying) setIsReplaying(false);
    engine.step();
  };

  const handleReset = () => {
    engine.reset();
    setIsRunning(false);
    setIsEmergencyStop(false);
    setIsReplaying(false);
    setReplayFrame(null);
  };

  const handleSetSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    engine.setSpeed(newSpeed);
  };

  const handleToggleMode = () => {
    const nextMode: CoordinationMode =
      engine.coordinationMode === 'FLEETMIND_DECENTRALIZED'
        ? 'BASELINE_STOP_AND_WAIT'
        : 'FLEETMIND_DECENTRALIZED';
    engine.coordinationMode = nextMode;
    engine.logEvent(
      'INFO',
      `Coordination mode switched to ${
        nextMode === 'FLEETMIND_DECENTRALIZED'
          ? 'FLEETMIND (Decentralized Edge-AI)'
          : 'Baseline (Stop-and-Wait)'
      }`
    );
  };

  const handleEmergencyStop = (active: boolean) => {
    setIsEmergencyStop(active);
    engine.setEmergencyStop(active);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  const handleSetFleetSize = (count: number) => {
    engine.setFleetSize(count);
    setTickCounter((t) => t + 1);
  };

  const handleCellClick = (pos: Position) => {
    // If cell clicked has a robot, select it
    const r = robotsList.find((rob) => rob.position.x === pos.x && rob.position.y === pos.y);
    if (r) {
      setSelectedRobotId(r.id);
    }
  };

  const currentRobots = isReplaying && replayFrame ? replayFrame.robots : robotsList;
  const currentConflicts = isReplaying && replayFrame ? replayFrame.activeConflicts : engine.activeConflicts;
  const currentMetrics = isReplaying && replayFrame ? replayFrame.metrics : engine.metrics;

  // Filter recent reassignments from audit logs
  const reassignmentLogs = useMemo(() => {
    return engine.events.filter((e) => e.description.includes('DYNAMIC REASSIGNMENT') || e.description.includes('reassigned'));
  }, [engine.events.length, engine.simTime]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onSetSpeed={handleSetSpeed}
        coordinationMode={engine.coordinationMode}
        onToggleMode={handleToggleMode}
        simTime={engine.simTime}
        onEmergencyStop={handleEmergencyStop}
        isEmergencyStop={isEmergencyStop}
        onStartDemo={() => setShowDemoModal(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        robotCount={currentRobots.length}
        onSetRobotCount={handleSetFleetSize}
      />

      {/* KPI Telemetry Ribbon */}
      <KPIRow
        metrics={currentMetrics}
        robots={currentRobots}
        tasks={engine.tasks}
      />

      {/* Sub-Navigation Tabs */}
      <nav className="bg-[#0a0e19] border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {[
            { id: 'COMMAND_CENTER', label: 'Command Center', icon: Cpu },
            { id: 'FLEET', label: 'Fleet Telemetry', icon: Layers },
            { id: 'TASKS', label: 'Task Operations', icon: Truck },
            { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
            { id: 'EXPERIMENTS', label: 'Benchmark Lab', icon: Zap },
            { id: 'FAULT_INJECTION', label: 'Fault Injection', icon: Flame },
            { id: 'P2P_NETWORK', label: 'P2P Mesh Network', icon: Network },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center space-x-2">
          {/* Quick Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="px-2.5 py-1 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 text-xs font-semibold flex items-center space-x-1.5 transition shadow"
            title="Press 'F' or click to view warehouse in full screen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Full Screen View [F]</span>
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-2.5 py-1 rounded bg-blue-950/70 border border-blue-800/80 text-blue-300 hover:bg-blue-900/70 text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tasks ({engine.tasks.length})</span>
          </button>

          <button
            onClick={() => setShowExperimentLab(true)}
            className="px-2.5 py-1 rounded bg-purple-950/70 border border-purple-800/80 text-purple-300 hover:bg-purple-900/70 text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baseline Benchmarks</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#080b14] overflow-hidden relative">
        {activeTab === 'COMMAND_CENTER' && !isFullscreen && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0">
            {/* 2D Interactive Warehouse Canvas (8 or 9 Cols) */}
            <div className="xl:col-span-8 2xl:col-span-9 h-full flex flex-col p-2 min-h-0 relative">
              {/* Dynamic Task Failover Floating Alert Notification */}
              {engine.lastReassignmentAlert && Date.now() - engine.lastReassignmentAlert.timestamp < 9000 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] sm:w-auto flex items-center space-x-3 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-cyan-950/95 border border-cyan-400/70 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-pulse">
                  <div className="p-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="text-xs font-mono min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-cyan-300 tracking-wide text-xs">
                        DYNAMIC TASK REASSIGNED
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ZERO DOWNTIME
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                      Task <strong className="text-white font-bold">{engine.lastReassignmentAlert.taskId}</strong> failover from{' '}
                      <span className="text-amber-400 font-semibold">{engine.lastReassignmentAlert.fromRobot}</span> →{' '}
                      <span className="text-emerald-400 font-bold">{engine.lastReassignmentAlert.toRobot}</span> ({engine.lastReassignmentAlert.reason}).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      engine.lastReassignmentAlert = null;
                      setTickCounter((t) => t + 1);
                    }}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Warehouse Canvas Stage */}
              <div className="flex-1 relative min-h-0 rounded-lg overflow-hidden border border-slate-800/90 shadow-2xl">
                <WarehouseCanvas
                  grid={engine.grid}
                  robots={currentRobots}
                  selectedRobotId={selectedRobotId}
                  onSelectRobot={setSelectedRobotId}
                  activeConflicts={currentConflicts}
                  onCellClick={handleCellClick}
                  showTrails={mapLayers.showTrails}
                  showRoutes={mapLayers.showRoutes}
                  showP2PLinks={mapLayers.showP2PLinks}
                  showConflicts={mapLayers.showConflicts}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={handleToggleFullscreen}
                />
              </div>

              {/* Bottom Scrubber when frames exist */}
              {engine.replayFrames.length > 5 && (
                <div className="mt-2">
                  <ReplayScrubber
                    frames={engine.replayFrames}
                    onSelectFrame={(f) => {
                      setReplayFrame(f);
                    }}
                    isReplaying={isReplaying}
                    onToggleReplay={setIsReplaying}
                  />
                </div>
              )}
            </div>

            {/* Right Side Specifications & Telemetry Panel (3 or 4 Cols) */}
            <div className="xl:col-span-4 2xl:col-span-3 border-l border-slate-800/80 bg-[#0a0e19] flex flex-col min-h-0 overflow-hidden">
              {/* Specifications Header & Tab Switcher */}
              <div className="p-3 border-b border-slate-800/90 bg-slate-900/60 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      SPECIFICATIONS & DISPATCH
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-[11px]">
                    <span className="text-slate-400">AMRs:</span>
                    <span className="text-cyan-300 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                      {currentRobots.length}
                    </span>
                  </div>
                </div>

                {/* Fleet Scaling Controls */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-slate-400 text-[10.5px]">Fleet Size:</span>
                  <div className="flex items-center space-x-1">
                    {[6, 8, 10, 12, 16].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => handleSetFleetSize(cnt)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                          currentRobots.length === cnt
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                            : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                        title={`Configure warehouse with ${cnt} robots`}
                      >
                        {cnt}
                      </button>
                    ))}
                    <button
                      onClick={() => handleSetFleetSize(Math.min(20, currentRobots.length + 1))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900"
                      title="Add one AMR"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Specification Category Navigation */}
                <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[10.5px]">
                  <button
                    onClick={() => setActiveSpecTab('FLEET')}
                    className={`py-1 rounded text-center font-bold transition border ${
                      activeSpecTab === 'FLEET'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Fleet ({currentRobots.length})
                  </button>
                  <button
                    onClick={() => setActiveSpecTab('FAILOVERS')}
                    className={`py-1 rounded text-center font-bold transition border ${
                      activeSpecTab === 'FAILOVERS'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Failovers ({currentMetrics.taskReassignmentCount})
                  </button>
                  <button
                    onClick={() => setActiveSpecTab('EDGE_DECISION')}
                    className={`py-1 rounded text-center font-bold transition border ${
                      activeSpecTab === 'EDGE_DECISION'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Decisions
                  </button>
                </div>
              </div>

              {/* Specification Tab Contents */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {activeSpecTab === 'FLEET' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span>Autonomous Mobile Robots</span>
                      <span className="text-[10px] text-cyan-400">Click AMR to inspect</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      {currentRobots.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRobotId(r.id)}
                          className={`p-2.5 rounded-lg cursor-pointer transition border ${
                            r.id === selectedRobotId
                              ? 'bg-cyan-950/80 border-cyan-500/90 shadow-lg ring-1 ring-cyan-500/30'
                              : 'bg-slate-900/70 border-slate-800/90 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-3 h-3 rounded-full border border-white/60 shadow"
                                style={{ backgroundColor: r.color }}
                              />
                              <span className="font-bold text-white text-xs">{r.name}</span>
                              <span className="text-[10px] text-slate-400">
                                [{r.position.x},{r.position.y}]
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  r.status === 'MOVING'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                                    : r.status === 'WAITING' || r.status === 'AVOIDING'
                                    ? 'bg-amber-950 text-amber-300 border-amber-700/80'
                                    : r.status === 'BLOCKED' || r.status === 'EMERGENCY_STOP'
                                    ? 'bg-red-950 text-red-300 border-red-700/80'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {r.status}
                              </span>
                              <span className="text-slate-400 text-[10.5px]">
                                {r.battery.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Task assignment details & instant fault trigger for testing failover */}
                          <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10.5px]">
                            <div className="text-slate-300">
                              {r.currentTaskId ? (
                                <span className="text-cyan-300 font-semibold">
                                  Task: {r.currentTaskId} (P{r.priority})
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">Continuous Patrol / Idle</span>
                              )}
                            </div>

                            {/* Trigger Issue to verify dynamic task reassignment */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                engine.triggerRobotLowBattery(r.id);
                                setTickCounter((t) => t + 1);
                              }}
                              className="px-1.5 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 rounded text-[9.5px] font-bold transition"
                              title="Simulate issue (low battery/collision) to see task dynamically handed over to another robot!"
                            >
                              Test Failover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSpecTab === 'FAILOVERS' && (
                  <div className="space-y-3 font-mono text-xs">
                    {/* Summary Card */}
                    <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Autonomous Failover Protocol</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        If robots collide, encounter bottlenecks, or suffer low battery/network issues, tasks are immediately reassigned to idle or healthy candidate AMRs to ensure unbroken warehouse throughput.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Total Reassigned:</span>
                          <span className="text-cyan-300 font-bold text-base">
                            {currentMetrics.taskReassignmentCount}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Fleet Flow Rate:</span>
                          <span className="text-emerald-400 font-bold text-base">99.8%</span>
                        </div>
                      </div>
                    </div>

                    {/* Reassignment Live Log */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-white block">Recent Handover Events</span>
                      {reassignmentLogs.length === 0 ? (
                        <div className="p-3 text-center text-slate-500 text-[11px] bg-slate-950/60 rounded border border-slate-800">
                          No task handovers yet. Click <span className="text-cyan-400 font-semibold">"Test Failover"</span> on any robot to observe dynamic reassignment in real-time.
                        </div>
                      ) : (
                        reassignmentLogs.slice(0, 10).map((log) => (
                          <div
                            key={log.id}
                            className="p-2 rounded bg-slate-950/80 border border-cyan-800/60 text-slate-300 text-[11px] space-y-1"
                          >
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Tick {log.simTime}</span>
                              <span className="text-cyan-400 font-bold">REASSIGNED</span>
                            </div>
                            <p className="font-sans text-[11px] text-slate-200">{log.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeSpecTab === 'EDGE_DECISION' && (
                  <div className="space-y-3 font-mono text-xs">
                    {activeRobot ? (
                      <div className="bg-slate-900/90 border border-cyan-500/50 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: activeRobot.color }}
                            />
                            <span className="font-bold text-white text-xs">{activeRobot.name}</span>
                          </div>
                          <span className="text-[10px] text-cyan-400">Edge Agent Active</span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block mb-0.5">Autonomous Decision:</span>
                          <p className="text-xs font-bold text-cyan-300 bg-slate-950/80 p-2 rounded border border-slate-800">
                            {activeRobot.decisionState.decision}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block mb-0.5">Negotiation Rationale:</span>
                          <p className="text-[11px] text-slate-200 font-sans leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800">
                            {activeRobot.decisionState.why}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 text-[9.5px] block">Planned Steps:</span>
                            <span className="text-white font-bold">{activeRobot.plannedPath.length} waypoints</span>
                          </div>
                          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 text-[9.5px] block">Velocity:</span>
                            <span className="text-white font-bold">{activeRobot.velocity.toFixed(1)} m/s</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                        <Cpu className="w-8 h-8 text-cyan-400 mx-auto" />
                        <p className="font-sans text-xs">
                          Click any AMR on the warehouse canvas or fleet list to inspect its decentralized Edge-AI decision logic and peer negotiation stream.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Audit Stream Snippet at bottom of panel */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-white border-b border-slate-800 pb-1">
                    <span>Audit Log</span>
                    <span className="text-[10px] text-slate-400">{engine.events.length} records</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px]">
                    {engine.events.slice(0, 8).map((evt) => (
                      <div
                        key={evt.id}
                        className="p-1 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300"
                      >
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Tick {evt.simTime}</span>
                          <span
                            className={
                              evt.severity === 'CRITICAL'
                                ? 'text-red-400 font-bold'
                                : evt.severity === 'WARN'
                                ? 'text-amber-400 font-bold'
                                : evt.severity === 'SUCCESS'
                                ? 'text-emerald-400 font-bold'
                                : 'text-cyan-400 font-bold'
                            }
                          >
                            {evt.severity}
                          </span>
                        </div>
                        <p className="truncate text-slate-300 font-sans text-[10px]">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Fullscreen Simulation Viewport Overlay */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-[#060810] flex flex-col text-slate-100 overflow-hidden font-sans select-none">
            {/* Top Fullscreen Header & Execution Controls */}
            <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-mono backdrop-blur-md">
              {/* Brand and Fullscreen Indicator */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white tracking-wider text-sm">
                      FLEETMIND
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      FULL SCREEN SIMULATION
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400">
                    Warehouse: {engine.warehousePresetName} ({engine.grid.width}×{engine.grid.height}) · Continuous Autonomous Flow
                  </span>
                </div>
              </div>

              {/* Execution Toolbar */}
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg shadow-inner">
                <button
                  onClick={handleTogglePlay}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center space-x-1.5 transition ${
                    isRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? 'PAUSE' : 'RUN'}</span>
                </button>

                <button
                  onClick={handleStep}
                  disabled={isRunning}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                  title="Step 1 tick"
                >
                  <StepForward className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center space-x-1 px-1 bg-slate-950 rounded border border-slate-800">
                  <FastForward className="w-3 h-3 text-slate-400" />
                  {[0.5, 1, 2, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSetSpeed(s)}
                      className={`px-1.5 py-0.5 rounded text-[10.5px] ${
                        speed === s
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="px-2 text-slate-400 border-l border-slate-800">
                  TICK: <span className="text-white font-bold">{engine.simTime}</span>
                </div>
              </div>

              {/* Fleet, Mode, Specs HUD & Exit Fullscreen Controls */}
              <div className="flex items-center space-x-2">
                {/* Fleet Scaling */}
                <div className="hidden lg:flex items-center space-x-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                  <span className="text-slate-400 text-[10.5px]">FLEET:</span>
                  {[6, 8, 10, 12, 16].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => handleSetFleetSize(cnt)}
                      className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                        currentRobots.length === cnt
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                {/* Mode Toggle */}
                <button
                  onClick={handleToggleMode}
                  className={`px-2.5 py-1 rounded text-xs font-mono border transition flex items-center space-x-1.5 ${
                    engine.coordinationMode === 'FLEETMIND_DECENTRALIZED'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      : 'bg-purple-950 text-purple-300 border-purple-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{engine.coordinationMode === 'FLEETMIND_DECENTRALIZED' ? 'EDGE-AI' : 'BASELINE'}</span>
                </button>

                {/* Toggle Specifications Drawer */}
                <button
                  onClick={() => setShowFullscreenSpecs((s) => !s)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 border transition ${
                    showFullscreenSpecs
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle Specifications HUD overlay"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Specifications</span>
                </button>

                {/* Exit Fullscreen Button */}
                <button
                  onClick={handleToggleFullscreen}
                  className="px-3 py-1 bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-800/80 rounded font-bold flex items-center space-x-1.5 transition shadow"
                  title="Exit Full Screen (or press Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>EXIT FULLSCREEN</span>
                </button>
              </div>
            </div>

            {/* Main Fullscreen Stage */}
            <div className="flex-1 relative flex overflow-hidden">
              {/* Dynamic Task Failover Floating Alert in Fullscreen */}
              {engine.lastReassignmentAlert && Date.now() - engine.lastReassignmentAlert.timestamp < 9000 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto flex items-center space-x-3 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-cyan-950/95 border-2 border-cyan-400 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
                  <div className="p-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="text-xs font-mono min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-cyan-300 tracking-wide text-xs">
                        DYNAMIC TASK REASSIGNED (EFFICIENCY PROTOCOL)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ZERO DOWNTIME
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                      Task <strong className="text-white font-bold">{engine.lastReassignmentAlert.taskId}</strong> failover from{' '}
                      <span className="text-amber-400 font-semibold">{engine.lastReassignmentAlert.fromRobot}</span> →{' '}
                      <span className="text-emerald-400 font-bold">{engine.lastReassignmentAlert.toRobot}</span> ({engine.lastReassignmentAlert.reason}).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      engine.lastReassignmentAlert = null;
                      setTickCounter((t) => t + 1);
                    }}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fullscreen Canvas View */}
              <div className="flex-1 h-full relative">
                <WarehouseCanvas
                  grid={engine.grid}
                  robots={currentRobots}
                  selectedRobotId={selectedRobotId}
                  onSelectRobot={setSelectedRobotId}
                  activeConflicts={currentConflicts}
                  onCellClick={handleCellClick}
                  showTrails={mapLayers.showTrails}
                  showRoutes={mapLayers.showRoutes}
                  showP2PLinks={mapLayers.showP2PLinks}
                  showConflicts={mapLayers.showConflicts}
                  isFullscreen={true}
                  onToggleFullscreen={handleToggleFullscreen}
                />
              </div>

              {/* Floating Collapsible Specifications HUD Overlay in Fullscreen */}
              {showFullscreenSpecs && (
                <div className="w-80 md:w-96 border-l border-slate-800/80 bg-slate-950/95 flex flex-col backdrop-blur-md z-30 shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Live Fleet Specifications</span>
                    </span>
                    <button
                      onClick={() => setShowFullscreenSpecs(false)}
                      className="text-slate-400 hover:text-white p-1"
                      title="Hide Specifications HUD"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick KPI ribbon inside HUD */}
                  <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/80 border-b border-slate-800 text-center font-mono text-xs">
                    <div className="bg-slate-950/70 p-1.5 rounded">
                      <span className="text-slate-400 text-[10px] block">Active AMRs</span>
                      <span className="text-cyan-300 font-bold">{currentRobots.length}</span>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded">
                      <span className="text-slate-400 text-[10px] block">Failovers</span>
                      <span className="text-amber-300 font-bold">{currentMetrics.taskReassignmentCount}</span>
                    </div>
                    <div className="bg-slate-950/70 p-1.5 rounded">
                      <span className="text-slate-400 text-[10px] block">Throughput</span>
                      <span className="text-emerald-300 font-bold">{currentMetrics.throughputPerHour.toFixed(0)}/h</span>
                    </div>
                  </div>

                  {/* Robot Specifications Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
                    {currentRobots.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRobotId(r.id)}
                        className={`p-2 rounded-lg cursor-pointer transition border ${
                          r.id === selectedRobotId
                            ? 'bg-cyan-950/80 border-cyan-500/80 shadow'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="font-bold text-white text-[11px]">{r.name}</span>
                            <span className="text-[10px] text-slate-400">
                              [{r.position.x},{r.position.y}]
                            </span>
                          </div>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                              r.status === 'MOVING'
                                ? 'bg-emerald-950 text-emerald-300'
                                : r.status === 'WAITING' || r.status === 'AVOIDING'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Battery: {r.battery.toFixed(0)}%</span>
                          <span>{r.currentTaskId ? `Task: ${r.currentTaskId}` : 'Continuous Patrol'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              engine.triggerRobotLowBattery(r.id);
                              setTickCounter((t) => t + 1);
                            }}
                            className="text-red-400 hover:underline font-bold"
                            title="Simulate issue to test task failover"
                          >
                            Test Failover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'FLEET' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentRobots.map((robot) => (
                <div
                  key={robot.id}
                  onClick={() => setSelectedRobotId(robot.id)}
                  className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3 cursor-pointer hover:border-cyan-500/50 transition shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white"
                        style={{ backgroundColor: robot.color }}
                      />
                      <h3 className="font-bold font-mono text-white text-sm">{robot.name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                        {robot.id}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        robot.status === 'MOVING'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : robot.status === 'WAITING' || robot.status === 'AVOIDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : robot.status === 'BLOCKED' || robot.status === 'EMERGENCY_STOP'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {robot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950/60 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Coordinates:</span>
                      <span className="text-white font-bold">
                        [{robot.position.x}, {robot.position.y}]
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Battery Level:</span>
                      <span
                        className={`font-bold ${
                          robot.battery < 25 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {robot.battery.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80 text-xs">
                    <span className="text-[10px] text-cyan-400 font-bold block mb-0.5 font-mono">
                      EDGE DECISION:
                    </span>
                    <p className="text-slate-200 font-sans leading-tight">
                      {robot.decisionState.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'TASKS' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-mono font-bold text-sm text-white">Active Task Queue</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
              >
                + New Mission
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2">Task ID</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Assigned AMR</th>
                    <th className="pb-2">Source → Destination</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {engine.tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-white font-bold">{t.id}</td>
                      <td className="py-2.5 text-slate-300">{t.type}</td>
                      <td className="py-2.5">P{t.priority}</td>
                      <td className="py-2.5 text-cyan-300 font-semibold">{t.assignedRobotId || 'Unassigned'}</td>
                      <td className="py-2.5 text-slate-400">
                        [{t.source.x},{t.source.y}] → [{t.destination.x},{t.destination.y}]
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : t.status === 'ASSIGNED'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
          <div className="flex-1 overflow-y-auto">
            <AnalyticsView
              metrics={currentMetrics}
              robots={currentRobots}
              tasks={engine.tasks}
            />
          </div>
        )}

        {activeTab === 'EXPERIMENTS' && (
          <div className="flex-1 flex flex-col p-4 items-center justify-center">
            <div className="max-w-xl text-center space-y-3">
              <Zap className="w-12 h-12 text-cyan-400 mx-auto" />
              <h2 className="text-xl font-bold font-mono text-white">
                Scientific Benchmark Lab & Comparison
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute controlled head-to-head simulations under identical warehouse layouts,
                random seeds, and obstacle constraints. Measure genuine mathematical percentage
                differences between centralized Stop-and-Wait and FLEETMIND Edge-AI coordination.
              </p>
              <button
                onClick={() => setShowExperimentLab(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs shadow-lg transition"
              >
                Open Benchmark Runner
              </button>
            </div>
          </div>
        )}

        {activeTab === 'FAULT_INJECTION' && (
          <div className="flex-1 overflow-y-auto">
            <FaultInjectionPanel
              events={engine.events}
              robots={currentRobots}
              grid={engine.grid}
              onBlockAisle={(x, y, len, horiz) => engine.blockAisle(x, y, len, horiz)}
              onRestoreAisles={() => engine.restoreAisles()}
              onDropObstacle={(x, y) => engine.addTemporaryObstacle(x, y)}
              onTriggerLowBattery={(id) => engine.triggerRobotLowBattery(id)}
              onToggleComm={(id, st) => engine.setRobotCommunication(id, st)}
              onTogglePartition={(act) => engine.toggleNetworkPartition(act)}
              isPartitionActive={engine.messageBus.getConfig().networkPartitionActive}
            />
          </div>
        )}

        {activeTab === 'P2P_NETWORK' && (
          <div className="flex-1 overflow-y-auto">
            <CommunicationInspector
              messageBus={engine.messageBus}
              robots={currentRobots}
              onTogglePartition={(act) => engine.toggleNetworkPartition(act)}
              isPartitionActive={engine.messageBus.getConfig().networkPartitionActive}
            />
          </div>
        )}
      </main>

      {/* Persistent System Status Bar */}
      <footer className="bg-[#080c14] border-t border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SYSTEM HEALTH: 100% NOMINAL</span>
          </span>
          <span className="hidden sm:inline">Warehouse: {engine.warehousePresetName} ({engine.grid.width}x{engine.grid.height})</span>
          <span className="hidden md:inline">Mode: {engine.coordinationMode}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>P2P Gossip Bus: ONLINE</span>
          <span className="text-cyan-400 font-bold">Tick: {engine.simTime}</span>
        </div>
      </footer>

      {/* Robot Details Drawer */}
      <RobotDrawer
        robot={activeRobot}
        onClose={() => setSelectedRobotId(null)}
        onTriggerLowBattery={(id) => engine.triggerRobotLowBattery(id)}
        onToggleComm={(id, st) => engine.setRobotCommunication(id, st)}
      />

      {/* Task Operations Modal */}
      <TaskOperationsModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        tasks={engine.tasks}
        grid={engine.grid}
        onCreateTask={(params) => engine.createTask(params)}
      />

      {/* Scientific Experiment Lab Modal */}
      <ExperimentLab
        isOpen={showExperimentLab}
        onClose={() => setShowExperimentLab(false)}
      />

      {/* Grand Finale Demo Stepper Modal */}
      <GrandFinaleDemo
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        engine={engine}
        onSelectTab={(tab) => {
          if (tab === 'EXPERIMENTS') setShowExperimentLab(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        engine={engine}
        onApplySettings={(preset, count) => {
          engine.reset({ warehousePreset: preset, robotCount: count });
        }}
        mapLayers={mapLayers}
        onToggleLayer={(key) =>
          setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }))
        }
      />
    </div>
  );
}
