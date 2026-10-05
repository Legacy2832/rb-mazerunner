/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DIFFICULTY_CONFIGS, AVAILABLE_GRID_SIZES } from '../lib/mazeRb';

interface GameHeaderProps {
  gridSize: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  moves: number;
  optimalMoves: number;
  elapsedSeconds: number;
  crashes: number;
  isMuted: boolean;
  showHint: boolean;
  statusMessage: string | null;
  onChangeGridSize: (size: number) => void;
  onChangeDifficulty: (lvl: 1 | 2 | 3 | 4 | 5) => void;
  onNewMaze: () => void;
  onRestartCar: () => void;
  onToggleHint: () => void;
  onToggleMute: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gridSize,
  difficulty,
  moves,
  optimalMoves,
  elapsedSeconds,
  crashes,
  isMuted,
  showHint,
  statusMessage,
  onChangeGridSize,
  onChangeDifficulty,
  onNewMaze,
  onRestartCar,
  onToggleHint,
  onToggleMute,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="flex flex-col gap-2 w-full bg-black text-zinc-100 font-mono">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">&gt;_</span>
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">
            CLI_MAZE_RUNNER.SH
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onNewMaze}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer active:scale-95"
            title="Generate New Map [N]"
          >
            <span>[NEW]</span>
          </button>

          <button
            type="button"
            onClick={onRestartCar}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer active:scale-95"
            title="Reset to Start [R]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>[RESET]</span>
          </button>

          <button
            type="button"
            onClick={onToggleHint}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer active:scale-95 ${
              showHint
                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title="Toggle Optimal Path Hint [H]"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showHint ? '[PATH:ON]' : '[PATH]'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer active:scale-95"
            title={isMuted ? 'Unmute Sound [M]' : 'Mute Sound [M]'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-300" />}
          </button>
        </div>
      </div>

      {/* Control Strip: Grid Size Dropdown & Difficulty Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 py-0.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Grid Size Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-bold">GRID:</span>
            <select
              value={gridSize}
              onChange={(e) => onChangeGridSize(Number(e.target.value))}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 text-xs rounded px-2 py-0.5 font-bold cursor-pointer transition-colors focus:outline-none focus:border-emerald-500"
            >
              {AVAILABLE_GRID_SIZES.map((sz) => (
                <option key={sz} value={sz} className="bg-zinc-950 text-zinc-100">
                  {sz}x{sz} {sz === 8 ? '(Small)' : sz === 12 ? '(Standard)' : sz === 16 ? '(Large)' : sz === 20 ? '(Colossal)' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-zinc-700">|</span>

          {/* Difficulty 1-5 Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-bold">DIFF:</span>
            {([1, 2, 3, 4, 5] as const).map((lvl) => {
              const isSelected = lvl === difficulty;
              return (
                <button
                  key={lvl}
                  onClick={() => onChangeDifficulty(lvl)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  LV.{lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3">
          <div>
            MOVES: <span className="text-zinc-100 font-bold">{moves}</span>
            <span className="text-zinc-500 text-[10px] ml-1">(PAR {optimalMoves})</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div>
            TIME: <span className="text-zinc-100 font-bold">{formatTime(elapsedSeconds)}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div>
            CRASHES: <span className="text-rose-400 font-bold">{crashes}</span>
          </div>
        </div>
      </div>

      {/* Clean Status Message */}
      {statusMessage && (
        <div className="text-xs text-amber-400 font-medium">
          &gt; {statusMessage}
        </div>
      )}
    </div>
  );
};
