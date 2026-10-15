import React, { useState } from 'react';
import {
  Download,
  Layers,
  RotateCcw,
  Settings,
  Upload,
  Warehouse,
  X,
} from 'lucide-react';
import { SimulationEngine } from '../../simulation/engine/SimulationEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: SimulationEngine;
  onApplySettings: (preset: 'Small' | 'Medium' | 'High Congestion', count: number) => void;
  mapLayers: {
    showTrails: boolean;
    showRoutes: boolean;
    showP2PLinks: boolean;
    showConflicts: boolean;
  };
  onToggleLayer: (layer: keyof SettingsModalProps['mapLayers']) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  engine,
  onApplySettings,
  mapLayers,
  onToggleLayer,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'Small' | 'Medium' | 'High Congestion'>(
    engine.warehousePresetName as any
  );
  const [robotCount, setRobotCount] = useState<number>(engine.robots.size);

  if (!isOpen) return null;

  const handleSave = () => {
    onApplySettings(selectedPreset, robotCount);
    onClose();
  };

  const handleExportConfig = () => {
    const configData = {
      preset: engine.warehousePresetName,
      robotCount: engine.robots.size,
      width: engine.grid.width,
      height: engine.grid.height,
      stations: engine.grid.stations,
      obstacles: engine.grid.obstacles,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetmind_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl max-w-xl w-full p-5 flex flex-col shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-mono">
              System Configuration & Map Layers
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Preset Selection */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Warehouse Environment Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
            >
              <option value="Small">Small (16x12) - Fast evaluation</option>
              <option value="Medium">Medium (24x18) - Industrial warehouse layout</option>
              <option value="High Congestion">
                High Congestion (30x20) - Dense racks & tight intersections
              </option>
            </select>
          </div>

          {/* Fleet Count */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Fleet Size (AMRs)
            </label>
            <select
              value={robotCount}
              onChange={(e) => setRobotCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
            >
              <option value={3}>3 AMRs</option>
              <option value={5}>5 AMRs (Standard Fleet R-01..R-05)</option>
              <option value={10}>10 AMRs (Heavy Traffic)</option>
              <option value={15}>15 AMRs (High Congestion Stress)</option>
              <option value={25}>25 AMRs (Large Facility Scale)</option>
            </select>
          </div>

          {/* Map Layer Toggles */}
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block font-mono">
              2D Canvas Rendering Layers
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapLayers.showRoutes}
                  onChange={() => onToggleLayer('showRoutes')}
                  className="accent-cyan-500 rounded"
                />
                <span>Planned A* Routes</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapLayers.showTrails}
                  onChange={() => onToggleLayer('showTrails')}
                  className="accent-cyan-500 rounded"
                />
                <span>Trajectory Trails</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapLayers.showP2PLinks}
                  onChange={() => onToggleLayer('showP2PLinks')}
                  className="accent-cyan-500 rounded"
                />
                <span>P2P Gossip Mesh Links</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapLayers.showConflicts}
                  onChange={() => onToggleLayer('showConflicts')}
                  className="accent-cyan-500 rounded"
                />
                <span>Conflict & Deadlock Circles</span>
              </label>
            </div>
          </div>

          {/* Import/Export */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleExportConfig}
              className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-medium flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Config (JSON)</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow"
          >
            Apply & Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
