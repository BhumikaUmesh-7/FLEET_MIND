import React from 'react';
import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  RefreshCw,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import { Robot, SimulationMetrics, Task } from '../../types';

interface KPIRowProps {
  metrics: SimulationMetrics;
  robots: Robot[];
  tasks: Task[];
}

export const KPIRow: React.FC<KPIRowProps> = ({ metrics, robots, tasks }) => {
  const activeRobotsCount = robots.filter((r) => r.status === 'MOVING').length;
  const activeTasksCount = tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const avgBattery = robots.length > 0 ? robots.reduce((acc, r) => acc + r.battery, 0) / robots.length : 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-2 p-3 bg-[#080c14] border-b border-slate-800/80">
      {/* 1. Active Robots */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Active AMRs</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-white">{activeRobotsCount}</span>
          <span className="text-[11px] text-slate-400 font-mono">/ {robots.length}</span>
        </div>
      </div>

      {/* 2. Active Tasks */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Active Tasks</span>
          <Truck className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-white">{activeTasksCount}</span>
          <span className="text-[11px] text-slate-400 font-mono">queued: {tasks.filter(t => t.status === 'PENDING').length}</span>
        </div>
      </div>

      {/* 3. Completed Tasks */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Completed</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-emerald-400">
            {tasks.filter((t) => t.status === 'COMPLETED').length}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">units</span>
        </div>
      </div>

      {/* 4. Throughput */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Throughput</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-amber-300">
            {metrics.throughputPerHour.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">tsk/hr</span>
        </div>
      </div>

      {/* 5. Collisions */}
      <div className={`p-2.5 rounded-lg flex flex-col justify-between border ${
        metrics.collisionCount > 0
          ? 'bg-red-950/40 border-red-700/80 text-red-300'
          : 'bg-slate-900/60 border-slate-800/90 text-slate-300'
      }`}>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium">Collisions</span>
          <ShieldCheck className={`w-3.5 h-3.5 ${metrics.collisionCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className={`text-lg font-bold font-mono ${metrics.collisionCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {metrics.collisionCount}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Target: 0</span>
        </div>
      </div>

      {/* 6. Deadlocks */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Deadlocks</span>
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-purple-300">{metrics.deadlockCount}</span>
          <span className="text-[10px] text-slate-400 font-mono">resolved</span>
        </div>
      </div>

      {/* 7. Dynamic Task Reassignments */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Task Failover</span>
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-cyan-300">{metrics.taskReassignmentCount}</span>
          <span className="text-[10px] text-slate-400 font-mono">reassigned</span>
        </div>
      </div>

      {/* 8. P2P Comm Latency */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">P2P Latency</span>
          <Network className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-teal-300">
            {metrics.averageMessageLatencyMs}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">ms</span>
        </div>
      </div>

      {/* 9. Average Battery */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Avg Battery</span>
          <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className={`text-lg font-bold font-mono ${avgBattery < 30 ? 'text-red-400' : 'text-emerald-300'}`}>
            {avgBattery.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">LiFePO4</span>
        </div>
      </div>

      {/* 10. Fleet Utilization */}
      <div className="bg-slate-900/60 border border-slate-800/90 p-2.5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-medium">Utilization</span>
          <Layers className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline space-x-1.5">
          <span className="text-lg font-bold font-mono text-blue-300">
            {metrics.fleetUtilization.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{metrics.energyProxy.toFixed(1)} kWh</span>
        </div>
      </div>
    </div>
  );
};
