import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { Position, Station, Task, TaskType, WarehouseGrid } from '../../types';

interface TaskOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  grid: WarehouseGrid;
  onCreateTask: (params: {
    type: TaskType;
    priority: number;
    source: Position;
    destination: Position;
  }) => void;
}

export const TaskOperationsModal: React.FC<TaskOperationsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  grid,
  onCreateTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form State
  const [taskType, setTaskType] = useState<TaskType>('PICKUP');
  const [priority, setPriority] = useState<number>(3);
  const [sourceStationId, setSourceStationId] = useState<string>(
    grid.stations[0]?.id || ''
  );
  const [destStationId, setDestStationId] = useState<string>(
    grid.stations[1]?.id || ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const src = grid.stations.find((s) => s.id === sourceStationId);
    const dest = grid.stations.find((s) => s.id === destStationId);

    if (!src || !dest) return;

    onCreateTask({
      type: taskType,
      priority,
      source: { x: src.x, y: src.y },
      destination: { x: dest.x, y: dest.y },
    });

    setShowCreateForm(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (
      searchQuery &&
      !t.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(t.assignedRobotId || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <Truck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Task Operations Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Live mission dispatcher, lifecycle queue, and dynamic reassignment
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? 'Cancel Creation' : 'New Task'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Creation Form (Collapsible) */}
        {showCreateForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="PICKUP">PICKUP</option>
                <option value="DELIVERY">DELIVERY</option>
                <option value="INSPECTION">INSPECTION</option>
                <option value="RETURN_TO_BASE">RETURN_TO_BASE</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priority (1-5)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Standard</option>
                <option value={3}>3 - Elevated</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Source Station</label>
              <select
                value={sourceStationId}
                onChange={(e) => setSourceStationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                {grid.stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type}) [{s.x},{s.y}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Destination</label>
              <select
                value={destStationId}
                onChange={(e) => setDestStationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                {grid.stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type}) [{s.x},{s.y}]
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition"
              >
                Dispatch Task to Fleet
              </button>
            </div>
          </form>
        )}

        {/* Filters Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Status:</span>
            {['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  filterStatus === st
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search Task ID / Robot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Task Queue Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-2">Task ID</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Assigned AMR</th>
                <th className="pb-2">Source → Dest</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Reassignments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 font-bold text-white">{t.id}</td>
                  <td className="py-2.5 text-slate-300">{t.type}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.priority >= 4
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      P{t.priority}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {t.assignedRobotId ? (
                      <span className="text-cyan-400 font-semibold">{t.assignedRobotId}</span>
                    ) : (
                      <span className="text-slate-500">Unassigned</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px]">
                    [{t.source.x},{t.source.y}] → [{t.destination.x},{t.destination.y}]
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : t.status === 'ASSIGNED'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : t.status === 'BLOCKED'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{t.reassignmentCount}</td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No tasks match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
