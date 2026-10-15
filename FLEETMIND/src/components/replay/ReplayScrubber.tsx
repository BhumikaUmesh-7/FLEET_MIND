import React, { useEffect, useState } from 'react';
import {
  FastForward,
  Film,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { ReplayFrame } from '../../types';

interface ReplayScrubberProps {
  frames: ReplayFrame[];
  onSelectFrame: (frame: ReplayFrame) => void;
  isReplaying: boolean;
  onToggleReplay: (active: boolean) => void;
}

export const ReplayScrubber: React.FC<ReplayScrubberProps> = ({
  frames,
  onSelectFrame,
  isReplaying,
  onToggleReplay,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(frames.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isReplaying) {
      setCurrentIndex(Math.max(0, frames.length - 1));
    }
  }, [frames.length, isReplaying]);

  // Replay playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < frames.length - 1) {
          const next = prev + 1;
          onSelectFrame(frames[next]);
          return next;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isPlaying, frames, onSelectFrame]);

  if (frames.length === 0) return null;

  const currentFrame = frames[currentIndex] || frames[frames.length - 1];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setCurrentIndex(idx);
    if (!isReplaying) onToggleReplay(true);
    onSelectFrame(frames[idx]);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-col space-y-2 text-xs font-mono text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Simulation Replay Scrubber</span>
          {isReplaying && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              REPLAY ACTIVE
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Tick: <span className="text-white font-bold">{currentFrame?.simTime || 0}</span> · Frame:{' '}
          <span className="text-cyan-300 font-bold">{currentIndex + 1}</span> / {frames.length}
        </div>
      </div>

      {/* Scrubber Range Slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, frames.length - 1)}
        value={currentIndex}
        onChange={handleSliderChange}
        className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
      />

      {/* Control buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              setCurrentIndex(0);
              onSelectFrame(frames[0]);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!isReplaying) onToggleReplay(true);
              setIsPlaying(!isPlaying);
            }}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center space-x-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => {
              const last = frames.length - 1;
              setCurrentIndex(last);
              onSelectFrame(frames[last]);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Latest"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {isReplaying && (
          <button
            onClick={() => {
              setIsPlaying(false);
              onToggleReplay(false);
            }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Return to Live Simulation</span>
          </button>
        )}
      </div>
    </div>
  );
};
