import React from 'react';
import {
  Activity,
  ArrowRight,
  Filter,
  Network,
  Radio,
  Split,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PeerMessage, Robot } from '../../types';
import { MessageBus } from '../../simulation/coordination/MessageBus';

interface CommunicationInspectorProps {
  messageBus: MessageBus;
  robots: Robot[];
  onTogglePartition: (active: boolean) => void;
  isPartitionActive: boolean;
}

export const CommunicationInspector: React.FC<CommunicationInspectorProps> = ({
  messageBus,
  robots,
  onTogglePartition,
  isPartitionActive,
}) => {
  const config = messageBus.getConfig();
  const history = messageBus.getHistory();

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-sans text-slate-200">
      {/* Network Configuration & Topology */}
      <div className="space-y-4">
        {/* Network State Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-teal-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>P2P Gossip Bus Configuration</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">Decentralized Mesh</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Simulated Latency:</span>
                <span className="text-teal-300 font-mono font-bold">
                  {config.simulatedLatencyMs} ms
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={config.simulatedLatencyMs}
                onChange={(e) =>
                  messageBus.setConfig({ simulatedLatencyMs: Number(e.target.value) })
                }
                className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Simulated Packet Loss:</span>
                <span className="text-amber-300 font-mono font-bold">
                  {(config.packetLossRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={config.packetLossRate}
                onChange={(e) =>
                  messageBus.setConfig({ packetLossRate: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onTogglePartition(!isPartitionActive)}
              className={`w-full py-2 px-3 rounded font-bold transition flex items-center justify-center space-x-2 border ${
                isPartitionActive
                  ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                  : 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>
                {isPartitionActive ? 'Heal Split-Brain Partition' : 'Simulate Network Partition'}
              </span>
            </button>
          </div>
        </div>

        {/* Fleet Network Nodes Status */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-2">
          <h4 className="font-mono text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
            AMR Radio Nodes
          </h4>
          <div className="space-y-1.5 font-mono text-xs">
            {robots.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-bold text-white">{r.name}</span>
                  <span className="text-[10px] text-slate-400">Grp {r.networkGroup}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {r.communicationStatus === 'ONLINE' ? (
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>ONLINE</span>
                    </span>
                  ) : (
                    <span className="text-red-400 text-[11px] font-semibold flex items-center space-x-1">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peer Message Stream Log */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2 text-white font-mono font-bold">
            <Radio className="w-4 h-4 text-teal-400" />
            <span>P2P Broadcast Packet Feed</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Total Logged: {history.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px] font-mono text-xs">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded border flex items-start justify-between ${
                msg.status === 'DROPPED'
                  ? 'bg-red-950/40 border-red-800/80 text-red-200'
                  : msg.status === 'DELAYED'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] text-slate-400">Tick {msg.simTime}</span>
                  <span className="font-bold text-cyan-300">{msg.fromRobotId}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 inline" />
                  <span className="font-bold text-slate-200">{msg.toRobotId}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-teal-300 font-semibold">
                    {msg.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-md">
                  {JSON.stringify(msg.payload)}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    msg.status === 'DROPPED'
                      ? 'bg-red-900 text-red-300'
                      : msg.status === 'DELAYED'
                      ? 'bg-amber-900 text-amber-300'
                      : 'bg-emerald-950 text-emerald-400'
                  }`}
                >
                  {msg.status}
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">{msg.latencyMs}ms</span>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              No P2P packets transmitted yet. Start simulation to observe gossip mesh.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
