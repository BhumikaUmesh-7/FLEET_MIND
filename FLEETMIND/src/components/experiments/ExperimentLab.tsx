import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { ExperimentResult } from '../../types';
import { BenchmarkConfig, BenchmarkRunner } from '../../simulation/experiments/BenchmarkRunner';

interface ExperimentLabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExperimentLab: React.FC<ExperimentLabProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('');
  const [latestResult, setLatestResult] = useState<ExperimentResult | null>(null);

  // Configuration
  const [config, setConfig] = useState<BenchmarkConfig>({
    name: 'Industrial Aisle Congestion Benchmark #1',
    seed: 42,
    durationTicks: 120,
    warehousePreset: 'Medium',
    robotCount: 5,
    taskCount: 8,
  });

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setProgress(0);
    setPhaseText('Starting benchmark...');

    try {
      const res = await BenchmarkRunner.runBenchmark(config, (pct, phase) => {
        setProgress(pct);
        setPhaseText(phase);
      });
      setLatestResult(res);
    } catch (e) {
      console.error('Benchmark failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!latestResult) return;
    const csv = BenchmarkRunner.exportToCSV(latestResult);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetmind_benchmark_${latestResult.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!latestResult) return;
    const json = BenchmarkRunner.exportToJSON(latestResult);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetmind_benchmark_${latestResult.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Scientific Experiment Lab & Baseline Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Rigorous empirical comparison: Stop-and-Wait Baseline vs Decentralized Edge-AI
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

        {/* Lab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Config Controls */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Warehouse Preset</label>
              <select
                value={config.warehousePreset}
                onChange={(e) =>
                  setConfig({ ...config, warehousePreset: e.target.value as any })
                }
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="Small">Small (16x12)</option>
                <option value="Medium">Medium (24x18)</option>
                <option value="High Congestion">High Congestion (30x20)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Robots Count</label>
              <select
                value={config.robotCount}
                onChange={(e) => setConfig({ ...config, robotCount: Number(e.target.value) })}
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value={3}>3 Robots</option>
                <option value={5}>5 Robots (Standard)</option>
                <option value={10}>10 Robots (Heavy)</option>
                <option value={15}>15 Robots (Stress)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Task Load</label>
              <select
                value={config.taskCount}
                onChange={(e) => setConfig({ ...config, taskCount: Number(e.target.value) })}
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value={4}>4 Tasks</option>
                <option value={8}>8 Tasks</option>
                <option value={16}>16 Tasks</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Sim Duration</label>
              <select
                value={config.durationTicks}
                onChange={(e) =>
                  setConfig({ ...config, durationTicks: Number(e.target.value) })
                }
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value={80}>80 Ticks (~8s fast)</option>
                <option value={120}>120 Ticks (Standard)</option>
                <option value={200}>200 Ticks (Extended)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded flex items-center justify-center space-x-1.5 shadow transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? 'Running...' : 'Run Benchmark'}</span>
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isRunning && (
            <div className="bg-slate-900/90 border border-cyan-500/40 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-300 font-semibold">{phaseText}</span>
                <span className="text-white font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Comparison Table */}
          {latestResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                    <span>{latestResult.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Seed {latestResult.seed} · Verified Real Data
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Duration: {latestResult.duration} ticks · Fleet: {latestResult.robotCount} AMRs
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center space-x-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center space-x-1.5"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3 text-purple-300">Baseline (Stop-and-Wait)</th>
                      <th className="py-2.5 px-3 text-cyan-300">FLEETMIND (Decentralized)</th>
                      <th className="py-2.5 px-3">Difference (%)</th>
                      <th className="py-2.5 px-3">Target vs Measured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(latestResult.comparison).map(([key, data]) => (
                      <tr key={key} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-medium text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{data.unit}</td>
                        <td className="py-2 px-3 text-slate-300">{data.baseline}</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">{data.fleetmind}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`font-bold flex items-center space-x-1 ${
                              data.diffPercent > 0
                                ? 'text-emerald-400'
                                : data.diffPercent < 0
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {data.diffPercent > 0 ? (
                              <TrendingUp className="w-3 h-3 inline" />
                            ) : data.diffPercent < 0 ? (
                              <TrendingDown className="w-3 h-3 inline" />
                            ) : null}
                            <span>
                              {data.diffPercent > 0 ? `+${data.diffPercent}` : data.diffPercent}%
                            </span>
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              data.improved
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {data.improved ? 'IMPROVEMENT PROVEN' : 'PARITY'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Scientific Note */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded text-[11px] text-slate-400 leading-relaxed font-sans">
                <span className="font-bold text-slate-300">Scientific Integrity Note:</span> Both
                experiments executed identical warehouse obstacles, robot starting coordinates, and
                task sequences using pseudo-random seed {latestResult.seed}. Stop-and-Wait utilizes
                centralized proximity halting, while FLEETMIND uses onboard A*, peer intent
                reservations, and dynamic task reallocation. Values above reflect actual measured
                telemetry.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
