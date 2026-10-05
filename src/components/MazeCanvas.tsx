/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Direction, MazeCell, PlayerCar } from '../types/game';

interface MazeCanvasProps {
  maze: MazeCell[][];
  width: number;
  height: number;
  car: PlayerCar;
  isOilSliding: boolean;
  isCrashed: boolean;
  showHint: boolean;
  solutionPath: Array<{ x: number; y: number }>;
  cellSize?: number;
  difficulty?: number;
  difficultyName?: string;
  onMove?: (dir: Direction) => void;
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  maze,
  width,
  height,
  car,
  isOilSliding,
  isCrashed,
  showHint,
  solutionPath,
  cellSize = 36,
  difficulty = 1,
  difficultyName = 'NOVICE',
  onMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth lerp coordinates handled internally without triggering React renders
  const animRef = useRef<{ x: number; y: number; facing: Direction }>({
    x: car.gridX,
    y: car.gridY,
    facing: car.facing,
  });

  // Touch swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Memoize solution coordinates for O(1) fast lookup
  const solSet = useMemo(
    () => new Set(solutionPath.map((p) => `${p.x},${p.y}`)),
    [solutionPath]
  );

  // Keep animRef in sync when grid teleports (reset, crash reset, new map)
  useEffect(() => {
    const dx = Math.abs(car.gridX - animRef.current.x);
    const dy = Math.abs(car.gridY - animRef.current.y);
    if (dx > 2 || dy > 2 || isCrashed) {
      animRef.current.x = car.gridX;
      animRef.current.y = car.gridY;
    }
    animRef.current.facing = car.facing;
  }, [car.gridX, car.gridY, car.facing, isCrashed]);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Update smooth lerp towards target grid position
      const anim = animRef.current;
      const dx = car.gridX - anim.x;
      const dy = car.gridY - anim.y;

      if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
        anim.x += dx * 0.38;
        anim.y += dy * 0.38;
      } else {
        anim.x = car.gridX;
        anim.y = car.gridY;
      }

      const dpr = window.devicePixelRatio || 1;
      const pixelW = width * cellSize;
      const pixelH = height * cellSize;

      if (canvas.width !== pixelW * dpr || canvas.height !== pixelH * dpr) {
        canvas.width = pixelW * dpr;
        canvas.height = pixelH * dpr;
        canvas.style.width = `${pixelW}px`;
        canvas.style.height = `${pixelH}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Pure Black Background
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, pixelW, pixelH);

      // Monospace Font scaled with cell size
      const fontSize = Math.max(10, Math.floor(cellSize * 0.52));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", "Courier New", Courier, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 2. Render Cell Contents (Floor passages, S, G, Obstacles)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = maze[y]?.[x];
          if (!cell) continue;

          const cx = x * cellSize + cellSize / 2;
          const cy = y * cellSize + cellSize / 2;
          const px = x * cellSize;
          const py = y * cellSize;
          const isPartOfSol = showHint && solSet.has(`${x},${y}`);

          // Subtle hint highlight for solution path
          if (isPartOfSol) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
            ctx.fillRect(px, py, cellSize, cellSize);
          }

          if (cell.isStart) {
            // Start: 'S'
            ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
            ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            ctx.fillStyle = '#22c55e';
            ctx.fillText('S', cx, cy);
          } else if (cell.isFinish) {
            // Goal: 'G'
            ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
            ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('G', cx, cy);
          } else if (cell.obstacle === 'BOMB') {
            // Bomb: '*'
            ctx.fillStyle = '#ef4444';
            ctx.fillText('*', cx, cy);
          } else if (cell.obstacle === 'OIL') {
            // Oil Slick: '~'
            ctx.fillStyle = '#06b6d4';
            ctx.fillText('~', cx, cy);
          } else if (cell.obstacle === 'RAMP') {
            // Ramp: directional triangle '►', '◄', '▲', '▼'
            ctx.fillStyle = '#eab308';
            let rampChar = '►';
            if (cell.rampDir === 'LEFT') rampChar = '◄';
            else if (cell.rampDir === 'UP') rampChar = '▲';
            else if (cell.rampDir === 'DOWN') rampChar = '▼';
            ctx.fillText(rampChar, cx, cy);
          } else {
            // Open Maze Passage: '·'
            ctx.fillStyle = isPartOfSol ? '#f59e0b' : '#3f3f46';
            ctx.fillText('·', cx, cy);
          }
        }
      }

      // 3. Render Maze Walls
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = cellSize <= 23 ? 2 : 2.5;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';

      // Outer Perimeter Boundary
      ctx.strokeRect(1, 1, pixelW - 2, pixelH - 2);

      // Interior Maze Walls
      ctx.beginPath();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = maze[y]?.[x];
          if (!cell) continue;

          const px = x * cellSize;
          const py = y * cellSize;

          // Vertical wall to the right of cell
          if (cell.walls.RIGHT && x < width - 1) {
            ctx.moveTo(px + cellSize, py);
            ctx.lineTo(px + cellSize, py + cellSize);
          }

          // Horizontal wall below cell
          if (cell.walls.DOWN && y < height - 1) {
            ctx.moveTo(px, py + cellSize);
            ctx.lineTo(px + cellSize, py + cellSize);
          }
        }
      }
      ctx.stroke();

      // 4. Render Player Vehicle as Inverted Monospace Character Block
      const carPx = anim.x * cellSize + cellSize / 2;
      const carPy = anim.y * cellSize + cellSize / 2;
      const pad = Math.max(2, Math.floor(cellSize * 0.1));
      const carBoxX = anim.x * cellSize + pad;
      const carBoxY = anim.y * cellSize + pad;

      ctx.fillStyle = isCrashed
        ? 'rgba(239, 68, 68, 0.95)'
        : isOilSliding
        ? 'rgba(6, 182, 212, 0.9)'
        : car.isJumping
        ? 'rgba(234, 179, 8, 0.95)'
        : '#ffffff';

      ctx.fillRect(carBoxX, carBoxY, cellSize - pad * 2, cellSize - pad * 2);

      // Directional character inside vehicle block
      ctx.fillStyle = '#000000';
      if (isCrashed) {
        ctx.fillText('X', carPx, carPy);
      } else {
        let char = '>';
        if (car.facing === 'LEFT') char = '<';
        else if (car.facing === 'UP') char = '^';
        else if (car.facing === 'DOWN') char = 'v';
        ctx.fillText(char, carPx, carPy);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [maze, width, height, car.gridX, car.gridY, car.facing, car.isJumping, isOilSliding, isCrashed, showHint, solSet, cellSize]);

  // Touch Swipe Handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !onMove) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 18;

    if (Math.hypot(dx, dy) >= threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        onMove(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        onMove(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-full">
      {/* Terminal Window Box */}
      <div className="bg-black border border-zinc-700 rounded-lg overflow-hidden shadow-2xl max-w-full">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-zinc-200 font-bold">
              CLI_MAZE // LVL {difficulty} [{difficultyName}]
            </span>
          </div>
          <div className="text-zinc-500 font-mono">
            {width}x{height}
          </div>
        </div>

        {/* Monospace Canvas with Touch Swipe */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="p-0 bg-black flex items-center justify-center overflow-hidden touch-none"
        >
          <canvas
            ref={canvasRef}
            className="block cursor-default select-none max-w-full h-auto"
          />
        </div>

        {/* CLI Symbols Legend Footer */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-2 bg-zinc-950 border-t border-zinc-800 text-[11px] font-mono select-none">
          <span className="text-zinc-300">
            <span className="bg-zinc-100 text-black px-1 py-0.5 rounded text-[10px] font-bold mr-1">&gt;</span> Car
          </span>
          <span className="text-zinc-300">
            <span className="text-zinc-100 font-extrabold mr-1">─ │</span> Wall
          </span>
          <span className="text-zinc-400">
            <span className="text-zinc-500 font-bold mr-1">·</span> Passage
          </span>
          <span className="text-cyan-400">
            <span className="font-bold mr-1">~</span> Oil
          </span>
          <span className="text-rose-400">
            <span className="font-bold mr-1">*</span> Bomb
          </span>
          <span className="text-amber-400">
            <span className="font-bold mr-1">►</span> Ramp
          </span>
          <span className="text-emerald-400">
            <span className="font-bold mr-1">S</span> Start
          </span>
          <span className="text-amber-400">
            <span className="font-bold mr-1">G</span> Goal
          </span>
        </div>
      </div>
    </div>
  );
};
