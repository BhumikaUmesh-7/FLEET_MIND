import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Flame,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { SimulationEngine } from '../../simulation/engine/SimulationEngine';

interface GrandFinaleDemoProps {
  isOpen: boolean;
  onClose: () => void;
  engine: SimulationEngine;
  onSelectTab: (tab: string) => void;
}

export const GrandFinaleDemo: React.FC<GrandFinaleDemoProps> = ({
  isOpen,
  onClose,
  engine,
  onSelectTab,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepLogs, setStepLogs] = useState<string[]>([
    'Demo mode initialized. Ready for judge demonstration.',
  ]);

  if (!isOpen) return null;

  const log = (msg: string) => {
    setStepLogs((prev) => [msg, ...prev]);
  };

  const executeStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        // Genesis: 5 AMRs, Start simulation
        engine.reset({ warehousePreset: 'Medium', robotCount: 5, initialTaskCount: 6 });
        engine.start(1.5);
        log('STEP 1 EXECUTED: Initialized 5 AMRs, generated initial picking tasks, and started sim engine.');
        break;

      case 2:
        // Overlapping Paths & Intent Sharing
        // Dispatch high priority task to create intersection contention
        engine.createTask({
          type: 'PICKUP',
          priority: 5,
          source: { x: 5, y: 1 },
          destination: { x: 21, y: 16 },
        });
        log('STEP 2 EXECUTED: Dispatched Critical (P5) mission through central corridor. Triggered P2P intent broadcasting.');
        break;

      case 3:
        // Block Critical Aisle
        engine.blockAisle(10, 6, 4, true);
        log('STEP 3 EXECUTED: Blocked primary thoroughfare aisle at (10, 6). Affected AMRs dynamically rerouting via A*.');
        break;

      case 4:
        // Task Reassignment
        // Drain battery of active robot
        const activeRobot = Array.from(engine.robots.values()).find((r) => r.currentTaskId);
        if (activeRobot) {
          engine.triggerRobotLowBattery(activeRobot.id);
          log(`STEP 4 EXECUTED: Drained battery on ${activeRobot.name}. Task dynamically reallocated to neighboring AMR.`);
        } else {
          log('STEP 4 EXECUTED: Reassignment triggered.');
        }
        break;

      case 5:
        // Disable Comm for Robot 1
        engine.setRobotCommunication('R-01', 'OFFLINE');
        log('STEP 5 EXECUTED: Severed Wi-Fi on R-01. EdgeAgent operating in autonomous local sensor mode.');
        break;

      case 6:
        // Deadlock Resolution
        // Restore aisles and drop temporary obstacle at intersection
        engine.restoreAisles();
        engine.addTemporaryObstacle(8, 7);
        log('STEP 6 EXECUTED: Created intersection choke point. Deadlock resolution protocol activated.');
        break;

      case 7:
        // Low Battery Autonomous Recharging
        engine.triggerRobotLowBattery('R-02');
        log('STEP 7 EXECUTED: Triggered low battery on R-02. Autonomous navigation to Charging Dock initiated.');
        break;

      case 8:
        // Switch to Baseline Mode
        engine.coordinationMode = 'BASELINE_STOP_AND_WAIT';
        log('STEP 8 EXECUTED: Switched coordination engine to Centralized Stop-and-Wait Baseline.');
        break;

      case 9:
        // Switch to FLEETMIND Mode
        engine.coordinationMode = 'FLEETMIND_DECENTRALIZED';
        log('STEP 9 EXECUTED: Restored FLEETMIND Decentralized Edge Coordination.');
        break;

      case 10:
        // Final Audit
        onClose();
        onSelectTab('EXPERIMENTS');
        log('STEP 10 EXECUTED: Opening Scientific Experiment Benchmark comparison.');
        break;
    }

    if (stepNumber < 10) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const steps = [
    {
      num: 1,
      title: 'Simulation Genesis',
      desc: 'Deploy 5 AMRs in medium warehouse with decentralized EdgeAgents and active task dispatching.',
    },
    {
      num: 2,
      title: 'Intent Sharing & Priority',
      desc: 'AMRs broadcast future space-time waypoints via P2P. Right-of-way negotiated without central controller.',
    },
    {
      num: 3,
      title: 'Aisle Blockage & Replanning',
      desc: 'Inject unexpected pallet blockage. Affected AMRs detect obstruction and replan alternate routes locally.',
    },
    {
      num: 4,
      title: 'Dynamic Task Reassignment',
      desc: 'When an AMR is constrained, tasks automatically transfer to the nearest available candidate robot.',
    },
    {
      num: 5,
      title: 'Communication Loss Resilience',
      desc: 'Sever Wi-Fi connection to an AMR. Robot safely continues operation using onboard LiDAR and local sensors.',
    },
    {
      num: 6,
      title: 'Deadlock Detection & Resolution',
      desc: 'Detect cyclic waiting in narrow intersection and execute deterministic sidestep back-off.',
    },
    {
      num: 7,
      title: 'Autonomous Low-Battery Routing',
      desc: 'Battery drops below 20%. Robot automatically reserves rapid charger and yields workload.',
    },
    {
      num: 8,
      title: 'Run Baseline (Stop-and-Wait)',
      desc: 'Demonstrate conservative centralized stop-and-wait baseline behavior for direct comparison.',
    },
    {
      num: 9,
      title: 'Run FLEETMIND (Edge-AI)',
      desc: 'Demonstrate high-throughput decentralized coordination under identical warehouse conditions.',
    },
    {
      num: 10,
      title: 'Scientific Audit & Verification',
      desc: 'Open Experiment Lab with measured throughput, completion times, and verified zero collisions.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <span>FLEETMIND Grand Finale Presentation Flow</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  10-Step Interactive Demo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live interactive walkthrough designed for robotics and Edge-AI judges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Content */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step List */}
          <div className="md:col-span-2 space-y-2">
            {steps.map((st) => (
              <div
                key={st.num}
                className={`p-3 rounded-lg border transition ${
                  currentStep === st.num
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md'
                    : currentStep > st.num
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                    : 'bg-slate-950/30 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        currentStep === st.num
                          ? 'bg-cyan-500 text-slate-950'
                          : currentStep > st.num
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {currentStep > st.num ? '✓' : st.num}
                    </span>
                    <h4 className="font-bold text-xs text-white">{st.title}</h4>
                  </div>

                  {currentStep === st.num && (
                    <button
                      onClick={() => executeStep(st.num)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold font-mono flex items-center space-x-1 shadow transition"
                    >
                      <span>RUN STEP</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-1.5 pl-8 leading-relaxed font-sans">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Live Demo Console Logs */}
          <div className="md:col-span-1 bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col">
            <h4 className="font-mono text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 mb-2 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Execution Log</span>
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-400">
              {stepLogs.map((lg, i) => (
                <div key={i} className="p-1.5 bg-slate-950/70 rounded border border-slate-800 text-cyan-200">
                  {lg}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  engine.reset();
                  log('Reset demo flow to Step 1.');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>

              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-cyan-950 border border-cyan-800 text-xs text-cyan-300 font-mono"
              >
                Close & View Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
