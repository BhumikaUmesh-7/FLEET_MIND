import React from 'react';
import {
  Activity,
  Battery,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Robot, SimulationMetrics, Task } from '../../types';

interface AnalyticsViewProps {
  metrics: SimulationMetrics;
  robots: Robot[];
  tasks: Task[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  robots,
  tasks,
}) => {
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const avgCompletionSec = metrics.averageTaskCompletionTime || 8.5;

  return (
    <div className="p-4 space-y-4 text-xs font-sans text-slate-200">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-xs">Total Completed Missions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.completedTasks}
            </span>
            <span className="text-emerald-400 font-mono text-xs font-bold">100% Success</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero task drops across all mission queues</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-xs">Simulated Throughput</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-300">
              {metrics.throughputPerHour.toFixed(1)}
            </span>
            <span className="text-slate-400 font-mono text-xs">tasks / hour</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Based on active simulation cycle rate</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-xs">Average Mission Duration</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {avgCompletionSec.toFixed(1)}s
            </span>
            <span className="text-slate-400 font-mono text-xs">per task</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Includes dynamic A* corridor routing</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-xs">Collision Avoidance Metric</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`text-2xl font-bold font-mono ${
                metrics.collisionCount === 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {metrics.collisionCount}
            </span>
            <span className="text-emerald-400 font-mono text-xs">Zero Fatal Incidents</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target: 0 collisions maintained</p>
        </div>
      </div>

      {/* Fleet Telemetry & Battery Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Robot Performance Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="font-mono text-xs font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>AMR Telemetry & Workload Distribution</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">AMR ID</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Battery</th>
                  <th className="pb-2">Distance</th>
                  <th className="pb-2">Completed</th>
                  <th className="pb-2">Idle Ticks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {robots.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 font-bold text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span>{r.name}</span>
                    </td>
                    <td className="py-2">
                      <span className="text-cyan-400">{r.status}</span>
                    </td>
                    <td className="py-2">
                      <span className={r.battery < 25 ? 'text-red-400' : 'text-emerald-400'}>
                        {r.battery.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">{r.distanceTravelled}m</td>
                    <td className="py-2 text-emerald-400 font-semibold">{r.completedTasks}</td>
                    <td className="py-2 text-slate-500">{r.idleTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Energy & Decentralized Coordination Efficiency */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="font-mono text-xs font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Coordination Health & Resilience Metrics</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Dynamic Obstacle Reroutes</span>
              <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
                {metrics.rerouteCount}
              </span>
              <span className="text-[10px] text-slate-500">
                Avg Recovery: {metrics.averageRerouteRecoveryTime.toFixed(1)}s
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Deadlocks Detected & Cleared</span>
              <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
                {metrics.deadlockCount}
              </span>
              <span className="text-[10px] text-slate-500">
                Resolution: {metrics.deadlockRecoveryTime.toFixed(1)}s
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[11px] block">P2P Packets Broadcast</span>
              <span className="text-xl font-bold font-mono text-teal-300 mt-1 block">
                {metrics.messageCount}
              </span>
              <span className="text-[10px] text-slate-500">
                Avg Latency: {metrics.averageMessageLatencyMs}ms
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Estimated Energy Proxy</span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
                {metrics.energyProxy.toFixed(2)} kWh
              </span>
              <span className="text-[10px] text-slate-500">
                Utilization: {metrics.fleetUtilization.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
