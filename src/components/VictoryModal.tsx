/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { DIFFICULTY_CONFIGS } from '../lib/mazeRb';

interface VictoryModalProps {
  isOpen: boolean;
  gridSize: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  moves: number;
  optimalMoves: number;
  elapsedSeconds: number;
  oilHits: number;
  crashes: number;
  onNextMaze: () => void;
  onAdvanceDifficulty: () => void;
  onReplayMaze: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  gridSize,
  difficulty,
  moves,
  optimalMoves,
  elapsedSeconds,
  crashes,
  onNextMaze,
  onAdvanceDifficulty,
  onReplayMaze,
}) => {
  const canAdvance = difficulty < 5;

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (canAdvance) {
          onAdvanceDifficulty();
        } else {
          onNextMaze();
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onReplayMaze();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canAdvance, onAdvanceDifficulty, onNextMaze, onReplayMaze]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const config = DIFFICULTY_CONFIGS[difficulty];
  const isParOrBetter = moves <= optimalMoves;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono"
    >
      <div className="relative w-full max-w-sm bg-black border border-zinc-700 rounded-lg shadow-2xl p-5 text-zinc-100 flex flex-col items-center text-center">
        {/* Terminal Header */}
        <div className="w-full text-left pb-2 mb-3 border-b border-zinc-800 text-[11px] text-zinc-500">
          [PROCESS COMPLETED: EXIT_SUCCESS]
        </div>

        <div className="text-emerald-400 font-bold text-lg mb-0.5 tracking-wider">
          DIFF {difficulty} [{config.name}] CLEARED
        </div>
        <div className="text-[11px] text-zinc-400 mb-4">
          Grid: {gridSize}x{gridSize} · All trajectory constraints solved
        </div>

        {/* Terminal Stats Box */}
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 mb-4 flex flex-col gap-1.5 text-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">TOTAL_MOVES:</span>
            <span className="text-zinc-100 font-bold flex items-center gap-1">
              <span>{moves}</span>
              <span className="text-zinc-500 font-normal">(PAR {optimalMoves})</span>
              {isParOrBetter && (
                <span className="text-amber-400 font-bold text-[10px] bg-amber-950/80 px-1 py-0.2 rounded border border-amber-800">
                  ★ PAR
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">ELAPSED_TIME:</span>
            <span className="text-zinc-100 font-bold">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">CRASH_RESETS:</span>
            <span className="text-rose-400 font-bold">{crashes}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onReplayMaze}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer border border-zinc-800 active:scale-95"
            title="Press [R] to retry"
          >
            <RotateCcw className="w-3 h-3" />
            <span>[RETRY (R)]</span>
          </button>

          {canAdvance ? (
            <button
              type="button"
              onClick={onAdvanceDifficulty}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Press [Enter] or [Space] to advance"
            >
              <span>[DIFF {difficulty + 1}]</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextMaze}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              title="Press [Enter] or [Space] for new map"
            >
              <span>[NEW_MAP]</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
