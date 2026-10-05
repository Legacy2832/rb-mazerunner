/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Direction } from '../types/game';

interface VirtualPadProps {
  onMove: (dir: Direction) => void;
  disabled?: boolean;
}

export const VirtualPad: React.FC<VirtualPadProps> = ({ onMove, disabled = false }) => {
  const handlePress = (dir: Direction) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) {
      onMove(dir);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none touch-none font-mono">
      {/* Up */}
      <button
        type="button"
        onPointerDown={handlePress('UP')}
        disabled={disabled}
        className="w-11 h-11 rounded-md bg-zinc-900 active:bg-zinc-700 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-base font-bold shadow-md active:scale-90 disabled:opacity-30 transition-all cursor-pointer"
        aria-label="Move Up"
      >
        ▲
      </button>

      {/* Left, Down, Right */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={handlePress('LEFT')}
          disabled={disabled}
          className="w-11 h-11 rounded-md bg-zinc-900 active:bg-zinc-700 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-base font-bold shadow-md active:scale-90 disabled:opacity-30 transition-all cursor-pointer"
          aria-label="Move Left"
        >
          ◀
        </button>

        <button
          type="button"
          onPointerDown={handlePress('DOWN')}
          disabled={disabled}
          className="w-11 h-11 rounded-md bg-zinc-900 active:bg-zinc-700 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-base font-bold shadow-md active:scale-90 disabled:opacity-30 transition-all cursor-pointer"
          aria-label="Move Down"
        >
          ▼
        </button>

        <button
          type="button"
          onPointerDown={handlePress('RIGHT')}
          disabled={disabled}
          className="w-11 h-11 rounded-md bg-zinc-900 active:bg-zinc-700 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 text-base font-bold shadow-md active:scale-90 disabled:opacity-30 transition-all cursor-pointer"
          aria-label="Move Right"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
