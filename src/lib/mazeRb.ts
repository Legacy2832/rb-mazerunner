/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Direction,
  DIRECTIONS,
  DIRECTION_DELTA,
  MazeCell,
  OPPOSITE_DIR,
} from '../types/game';

export const AVAILABLE_GRID_SIZES = [8, 10, 12, 14, 16, 18, 20] as const;
export type GridSize = (typeof AVAILABLE_GRID_SIZES)[number];

export interface GridObstacleFloor {
  minBombs: number;
  minOil: number;
  minRamps: number;
}

/**
 * Strict minimum obstacle floor per grid size to prevent barren labyrinths.
 */
export const MIN_OBSTACLES_BY_GRID_SIZE: Record<number, GridObstacleFloor> = {
  8: { minBombs: 4, minOil: 3, minRamps: 0 },
  10: { minBombs: 7, minOil: 5, minRamps: 0 },
  12: { minBombs: 11, minOil: 7, minRamps: 0 },
  14: { minBombs: 15, minOil: 10, minRamps: 0 },
  16: { minBombs: 21, minOil: 14, minRamps: 0 },
  18: { minBombs: 28, minOil: 18, minRamps: 0 },
  20: { minBombs: 36, minOil: 23, minRamps: 0 },
};

export interface DifficultyConfig {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  puzzleTitle: string;
  puzzleDescription: string;
  bombRatio: number;
  oilRatio: number;
  requiredRampLeaps: number;
  requiredOilCrossroads: number;
  requiresChainedRunway: boolean;
}

/**
 * CUMULATIVE FORCED PUZZLES:
 * - Level 1: Forced Oil Crossroad #1
 * - Level 2: Level 1 + Forced Interior Wall Leap #1
 * - Level 3: Level 2 + Forced Oil Crossroad #2 (Dual Crossroads)
 * - Level 4: Level 3 + Forced Chained Oil Runway
 * - Level 5: ALL PUZZLES (Dual Wall Leaps + Dual Crossroads + Chained Runway)
 */
export const DIFFICULTY_CONFIGS: Record<1 | 2 | 3 | 4 | 5, DifficultyConfig> = {
  1: {
    level: 1,
    name: 'NOVICE',
    puzzleTitle: 'CROSSROAD SLIP',
    puzzleDescription: 'Mandatory Oil Crossroad: take the loop to enter perpendicularly',
    bombRatio: 0.05,
    oilRatio: 0.04,
    requiredRampLeaps: 0,
    requiredOilCrossroads: 1,
    requiresChainedRunway: false,
  },
  2: {
    level: 2,
    name: 'ADEPT',
    puzzleTitle: 'CROSSROAD + WALL LEAP',
    puzzleDescription: 'Cumulative: Forced Oil Crossroad + Forced Wall Leap [»]',
    bombRatio: 0.07,
    oilRatio: 0.05,
    requiredRampLeaps: 1,
    requiredOilCrossroads: 1,
    requiresChainedRunway: false,
  },
  3: {
    level: 3,
    name: 'EXPERT',
    puzzleTitle: 'DUAL CROSSINGS + WALL LEAP',
    puzzleDescription: 'Cumulative: Dual Oil Crossroads + Forced Wall Leap [»]',
    bombRatio: 0.09,
    oilRatio: 0.065,
    requiredRampLeaps: 1,
    requiredOilCrossroads: 2,
    requiresChainedRunway: false,
  },
  4: {
    level: 4,
    name: 'MASTER',
    puzzleTitle: 'CHAIN RUNWAY + DUAL CROSSINGS + LEAP',
    puzzleDescription: 'Cumulative: Chained Oil Runway + Dual Crossroads + Wall Leap',
    bombRatio: 0.11,
    oilRatio: 0.08,
    requiredRampLeaps: 1,
    requiredOilCrossroads: 2,
    requiresChainedRunway: true,
  },
  5: {
    level: 5,
    name: 'NIGHTMARE',
    puzzleTitle: 'ALL PUZZLES GAUNTLET',
    puzzleDescription: 'Cumulative: Dual Wall Leaps + Dual Crossroads + Chained Runway (Must pass ALL)',
    bombRatio: 0.13,
    oilRatio: 0.095,
    requiredRampLeaps: 2,
    requiredOilCrossroads: 2,
    requiresChainedRunway: true,
  },
};

/**
 * Calculates optimal responsive monospace canvas cell size to fit cleanly on screen
 */
export function calculateResponsiveCellSize(gridSize: number, viewportWidth: number = 640): number {
  // Max available width for maze: viewportWidth - padding/borders (approx 36px), capped at 440px
  const maxAvailable = Math.min(viewportWidth - 36, 440);
  const calculated = Math.floor(maxAvailable / gridSize);
  return Math.max(16, Math.min(48, calculated));
}

export function calculateCellSize(gridSize: number): number {
  return calculateResponsiveCellSize(gridSize, 640);
}

/**
 * Generates an authentic classic maze with CUMULATIVE forced puzzles.
 * verified to be solvable with optimalMoves >= gridSize.
 */
export function generateMaze(
  gridSize: number,
  difficulty: 1 | 2 | 3 | 4 | 5
): {
  maze: MazeCell[][];
  width: number;
  height: number;
  startPos: { x: number; y: number };
  finishPos: { x: number; y: number };
  solutionPath: Array<{ x: number; y: number }>;
  optimalMoves: number;
  cellSize: number;
  puzzleTitle: string;
  puzzleDescription: string;
} {
  const w = gridSize;
  const h = gridSize;
  const startPos = { x: 0, y: 0 };
  const finishPos = { x: w - 1, y: h - 1 };
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Try generating the cumulative puzzle maze
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = buildCumulativeLabyrinth(
      w,
      h,
      difficulty,
      startPos,
      finishPos
    );
    if (candidate && candidate.solutionPath.length >= Math.floor(w * 1.1)) {
      return {
        ...candidate,
        puzzleTitle: config.puzzleTitle,
        puzzleDescription: config.puzzleDescription,
      };
    }
  }

  // Guaranteed valid fallback: builds DFS maze with incrementally verified obstacles
  const fallback = buildGuaranteedSolvableLabyrinth(w, h, difficulty, startPos, finishPos);
  return {
    ...fallback,
    puzzleTitle: config.puzzleTitle,
    puzzleDescription: config.puzzleDescription,
  };
}

export function generateMazeByDifficulty(difficulty: 1 | 2 | 3 | 4 | 5) {
  return generateMaze(12, difficulty);
}

/**
 * Builds an authentic, organic labyrinth with cumulatively stacked forced puzzles
 */
function buildCumulativeLabyrinth(
  w: number,
  h: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
  startPos: { x: number; y: number },
  finishPos: { x: number; y: number }
): {
  maze: MazeCell[][];
  width: number;
  height: number;
  startPos: { x: number; y: number };
  finishPos: { x: number; y: number };
  solutionPath: Array<{ x: number; y: number }>;
  optimalMoves: number;
  cellSize: number;
} | null {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const cellSize = calculateCellSize(w);

  const floor = MIN_OBSTACLES_BY_GRID_SIZE[w] || {
    minBombs: Math.max(4, Math.floor(w * h * 0.05)),
    minOil: Math.max(3, Math.floor(w * h * 0.035)),
    minRamps: 0,
  };

  const effectiveRamps = w <= 8 ? Math.min(1, config.requiredRampLeaps) : config.requiredRampLeaps;
  const targetBombs = Math.max(floor.minBombs, Math.round(w * h * config.bombRatio));
  const targetOil = Math.max(floor.minOil, Math.round(w * h * config.oilRatio));
  const targetRamps = Math.max(floor.minRamps, effectiveRamps);

  // 1. Initialize grid with all walls active
  const maze: MazeCell[][] = [];
  for (let y = 0; y < h; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < w; x++) {
      row.push({
        x,
        y,
        walls: { UP: true, RIGHT: true, DOWN: true, LEFT: true },
        obstacle: 'NONE',
        isStart: x === startPos.x && y === startPos.y,
        isFinish: x === finishPos.x && y === finishPos.y,
        isPartOfSolution: false,
      });
    }
    maze.push(row);
  }

  const removeWall = (x1: number, y1: number, dir: Direction) => {
    const delta = DIRECTION_DELTA[dir];
    const x2 = x1 + delta.dx;
    const y2 = y1 + delta.dy;
    if (x1 >= 0 && x1 < w && y1 >= 0 && y1 < h) {
      maze[y1][x1].walls[dir] = false;
    }
    if (x2 >= 0 && x2 < w && y2 >= 0 && y2 < h) {
      maze[y2][x2].walls[OPPOSITE_DIR[dir]] = false;
    }
  };

  const addWall = (x1: number, y1: number, dir: Direction) => {
    const delta = DIRECTION_DELTA[dir];
    const x2 = x1 + delta.dx;
    const y2 = y1 + delta.dy;
    if (x1 >= 0 && x1 < w && y1 >= 0 && y1 < h) {
      maze[y1][x1].walls[dir] = true;
    }
    if (x2 >= 0 && x2 < w && y2 >= 0 && y2 < h) {
      maze[y2][x2].walls[OPPOSITE_DIR[dir]] = true;
    }
  };

  // 2. Full-Grid Randomized Recursive Backtracker (Spanning Tree)
  const visited = new Set<string>();
  const stack: Array<{ x: number; y: number }> = [];

  let current = { x: 0, y: 0 };
  visited.add(`0,0`);
  stack.push(current);

  let prevDir: Direction | null = null;

  while (stack.length > 0) {
    current = stack[stack.length - 1];
    const neighbors: Array<{ dir: Direction; x: number; y: number }> = [];

    for (const dir of DIRECTIONS) {
      const delta = DIRECTION_DELTA[dir];
      const nx = current.x + delta.dx;
      const ny = current.y + delta.dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited.has(`${nx},${ny}`)) {
        neighbors.push({ dir, x: nx, y: ny });
      }
    }

    if (neighbors.length > 0) {
      neighbors.sort((a, b) => {
        const turnA = prevDir && a.dir !== prevDir ? 0.38 : 0;
        const turnB = prevDir && b.dir !== prevDir ? 0.38 : 0;
        return Math.random() + turnB - (Math.random() + turnA);
      });

      const chosen = neighbors[0];
      removeWall(current.x, current.y, chosen.dir);
      visited.add(`${chosen.x},${chosen.y}`);
      stack.push({ x: chosen.x, y: chosen.y });
      prevDir = chosen.dir;
    } else {
      stack.pop();
      prevDir = null;
    }
  }

  // 3. Carve small loops for natural bifurcations
  const loopCount = Math.min(5, Math.floor(w * 0.22));
  for (let i = 0; i < loopCount; i++) {
    const rx = Math.floor(Math.random() * (w - 2)) + 1;
    const ry = Math.floor(Math.random() * (h - 2)) + 1;
    const rDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    removeWall(rx, ry, rDir);
  }

  // --------------------------------------------------------------------------
  // CUMULATIVE STEP A: FORCED RAMP LEAP(S)
  // --------------------------------------------------------------------------
  if (effectiveRamps >= 1) {
    const ramp1 = addOrganicForcedRamp(maze, w, h, startPos, finishPos, addWall, 0.12, 0.50);
    if (!ramp1) return null;

    if (effectiveRamps >= 2) {
      // For the second ramp, find a candidate in the latter half of the path
      const ramp2 = addOrganicForcedRamp(maze, w, h, startPos, finishPos, addWall, 0.48, 0.90);
      if (!ramp2) return null;
    }

    // Verify that ground walking is completely blocked (ramp is strictly mandatory)
    const groundSol = solveMazeBFS(maze, startPos, finishPos, w, h, false);
    if (groundSol !== null) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // CUMULATIVE STEP B: FORCED OIL CROSSROAD(S)
  // --------------------------------------------------------------------------
  let oilPlaced = 0;
  if (config.requiredOilCrossroads >= 1) {
    const solveRes = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (!solveRes || solveRes.path.length < 8) return null;
    let path = solveRes.path;

    const targetCross = config.requiredOilCrossroads;
    let crossPlaced = 0;

    const stepInterval = Math.max(3, Math.floor(path.length / (targetCross + 1)));

    for (let c = 0; c < targetCross; c++) {
      const ptIdx = Math.min(path.length - 3, (c + 1) * stepInterval);
      const pt = path[ptIdx];
      const cell = maze[pt.y][pt.x];

      if (cell.obstacle === 'NONE') {
        let openCount = 0;
        if (!cell.walls.UP) openCount++;
        if (!cell.walls.DOWN) openCount++;
        if (!cell.walls.LEFT) openCount++;
        if (!cell.walls.RIGHT) openCount++;

        if (openCount < 3) {
          for (const dir of DIRECTIONS) {
            if (cell.walls[dir]) {
              const d = DIRECTION_DELTA[dir];
              const nx = pt.x + d.dx;
              const ny = pt.y + d.dy;
              if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
                removeWall(pt.x, pt.y, dir);
                break;
              }
            }
          }
        }

        cell.obstacle = 'OIL';
        const verified = solveMazeBFS(maze, startPos, finishPos, w, h, true);
        if (verified && verified.path.length >= Math.floor(w * 1.1)) {
          path = verified.path;
          crossPlaced++;
          oilPlaced++;
        } else {
          cell.obstacle = 'NONE';
        }
      }
    }

    if (crossPlaced < targetCross) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // CUMULATIVE STEP C: FORCED CHAINED OIL RUNWAY (Difficulty >= 4)
  // --------------------------------------------------------------------------
  if (config.requiresChainedRunway) {
    const currentSol = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (!currentSol || currentSol.path.length < 10) return null;
    const currentPath = currentSol.path;

    let runwayPlaced = false;
    for (let i = 2; i < currentPath.length - 4; i++) {
      const c1 = currentPath[i];
      const c2 = currentPath[i + 1];

      const isStraightX = c1.y === c2.y && Math.abs(c1.x - c2.x) === 1;
      const isStraightY = c1.x === c2.x && Math.abs(c1.y - c2.y) === 1;

      if (
        (isStraightX || isStraightY) &&
        maze[c1.y][c1.x].obstacle === 'NONE' &&
        maze[c2.y][c2.x].obstacle === 'NONE'
      ) {
        maze[c1.y][c1.x].obstacle = 'OIL';
        maze[c2.y][c2.x].obstacle = 'OIL';
        const testSol = solveMazeBFS(maze, startPos, finishPos, w, h, true);
        if (testSol && testSol.path.length >= Math.floor(w * 1.1)) {
          runwayPlaced = true;
          oilPlaced += 2;
          break;
        } else {
          maze[c1.y][c1.x].obstacle = 'NONE';
          maze[c2.y][c2.x].obstacle = 'NONE';
        }
      }
    }

    if (!runwayPlaced) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // FILL REMAINING OIL & BOMBS (INCREMENTALLY VERIFIED BY BFS)
  // --------------------------------------------------------------------------
  let currentSol = solveMazeBFS(maze, startPos, finishPos, w, h, true);
  if (!currentSol || currentSol.path.length < Math.floor(w * 1.1)) {
    return null;
  }
  let currentSolution = currentSol.path;

  // Place remaining oil slicks in non-path or side corridors
  const nonPathCells: Array<{ x: number; y: number }> = [];
  const solSet = new Set(currentSolution.map((p) => `${p.x},${p.y}`));

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if ((x === startPos.x && y === startPos.y) || (x === finishPos.x && y === finishPos.y)) {
        continue;
      }
      if (maze[y][x].obstacle === 'NONE' && !solSet.has(`${x},${y}`)) {
        nonPathCells.push({ x, y });
      }
    }
  }

  nonPathCells.sort(() => Math.random() - 0.5);
  for (const pt of nonPathCells) {
    if (oilPlaced >= targetOil) break;

    maze[pt.y][pt.x].obstacle = 'OIL';
    const testSol = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (testSol && testSol.path.length >= Math.floor(w * 1.1)) {
      oilPlaced++;
      currentSolution = testSol.path;
    } else {
      maze[pt.y][pt.x].obstacle = 'NONE';
    }
  }

  // Find dead ends and corners strictly outside solution path for bombs
  const deadEnds: Array<{ x: number; y: number }> = [];
  const alcoves: Array<{ x: number; y: number }> = [];
  const activeSolSet = new Set(currentSolution.map((p) => `${p.x},${p.y}`));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((x === startPos.x && y === startPos.y) || (x === finishPos.x && y === finishPos.y)) {
        continue;
      }
      if (maze[y][x].obstacle !== 'NONE' || activeSolSet.has(`${x},${y}`)) {
        continue;
      }

      let wallCount = 0;
      if (x === 0 || maze[y][x].walls.LEFT) wallCount++;
      if (x === w - 1 || maze[y][x].walls.RIGHT) wallCount++;
      if (y === 0 || maze[y][x].walls.UP) wallCount++;
      if (y === h - 1 || maze[y][x].walls.DOWN) wallCount++;

      if (wallCount >= 3) {
        deadEnds.push({ x, y });
      } else if (wallCount === 2) {
        alcoves.push({ x, y });
      }
    }
  }

  deadEnds.sort(() => Math.random() - 0.5);
  alcoves.sort(() => Math.random() - 0.5);

  let bombsPlaced = 0;
  for (const pt of deadEnds) {
    if (bombsPlaced >= targetBombs) break;
    maze[pt.y][pt.x].obstacle = 'BOMB';
    bombsPlaced++;
  }

  for (const pt of alcoves) {
    if (bombsPlaced >= targetBombs) break;
    maze[pt.y][pt.x].obstacle = 'BOMB';
    const testSol = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (testSol && testSol.path.length >= Math.floor(w * 1.1)) {
      bombsPlaced++;
      currentSolution = testSol.path;
    } else {
      maze[pt.y][pt.x].obstacle = 'NONE';
    }
  }

  // Place additional ramps if needed
  let rampsPlaced = effectiveRamps;
  if (rampsPlaced < targetRamps && currentSolution.length > 10) {
    for (let i = 4; i < currentSolution.length - 4 && rampsPlaced < targetRamps; i += 4) {
      const pt = currentSolution[i];
      if (maze[pt.y][pt.x].obstacle === 'NONE') {
        for (const dir of DIRECTIONS) {
          if (maze[pt.y][pt.x].walls[dir]) {
            const d = DIRECTION_DELTA[dir];
            const lx = pt.x + d.dx;
            const ly = pt.y + d.dy;
            if (
              lx >= 0 &&
              lx < w &&
              ly >= 0 &&
              ly < h &&
              maze[ly][lx].obstacle === 'NONE'
            ) {
              maze[pt.y][pt.x].obstacle = 'RAMP';
              maze[pt.y][pt.x].rampDir = dir;
              const test = solveMazeBFS(maze, startPos, finishPos, w, h, true);
              if (test && test.path.length >= Math.floor(w * 1.1)) {
                rampsPlaced++;
                currentSolution = test.path;
                break;
              } else {
                maze[pt.y][pt.x].obstacle = 'NONE';
                maze[pt.y][pt.x].rampDir = undefined;
              }
            }
          }
        }
      }
    }
  }

  // Final rigorous BFS check
  const finalSolution = solveMazeBFS(maze, startPos, finishPos, w, h, true);
  if (!finalSolution || finalSolution.path.length < Math.floor(w * 1.1)) {
    return null;
  }

  for (const pt of finalSolution.path) {
    maze[pt.y][pt.x].isPartOfSolution = true;
  }

  return {
    maze,
    width: w,
    height: h,
    startPos,
    finishPos,
    solutionPath: finalSolution.path,
    optimalMoves: finalSolution.optimalMoves,
    cellSize,
  };
}

/**
 * Creates an organic forced ramp jump within a normalized segment of the path [minFrac, maxFrac].
 * Uses allowRamps = true so multiple ramps can be cumulatively placed!
 */
function addOrganicForcedRamp(
  maze: MazeCell[][],
  w: number,
  h: number,
  startPos: { x: number; y: number },
  finishPos: { x: number; y: number },
  addWall: (x1: number, y1: number, dir: Direction) => void,
  minFrac: number = 0.1,
  maxFrac: number = 0.9
): boolean {
  // CRITICAL FIX: allow existing ramps so consecutive ramps can be placed!
  const pathRes = solveMazeBFS(maze, startPos, finishPos, w, h, true);
  if (!pathRes || pathRes.path.length < 8) return false;
  const path = pathRes.path;

  const pathIndexMap = new Map<string, number>();
  path.forEach((pt, idx) => pathIndexMap.set(`${pt.x},${pt.y}`, idx));

  const startIdx = Math.max(1, Math.floor(path.length * minFrac));
  const endIdx = Math.min(path.length - 3, Math.floor(path.length * maxFrac));

  interface Candidate {
    ax: number;
    ay: number;
    bx: number;
    by: number;
    dir: Direction;
    idxA: number;
    idxB: number;
  }
  const candidates: Candidate[] = [];

  for (let i = startIdx; i <= endIdx; i++) {
    const a = path[i];
    if (maze[a.y][a.x].obstacle !== 'NONE') continue;

    for (const dir of DIRECTIONS) {
      if (maze[a.y][a.x].walls[dir]) {
        const delta = DIRECTION_DELTA[dir];
        const bx = a.x + delta.dx;
        const by = a.y + delta.dy;
        if (bx >= 0 && bx < w && by >= 0 && by < h && maze[by][bx].obstacle === 'NONE') {
          const idxB = pathIndexMap.get(`${bx},${by}`);
          // Cell B must be further down the path
          if (idxB !== undefined && idxB >= i + 4) {
            candidates.push({ ax: a.x, ay: a.y, bx, by, dir, idxA: i, idxB });
          }
        }
      }
    }
  }

  if (candidates.length === 0) return false;

  candidates.sort((c1, c2) => (c2.idxB - c2.idxA) - (c1.idxB - c1.idxA));

  for (const chosen of candidates.slice(0, 6)) {
    maze[chosen.ay][chosen.ax].obstacle = 'RAMP';
    maze[chosen.ay][chosen.ax].rampDir = chosen.dir;

    // Cut a door in the detour between A and B
    const midIdx = Math.floor((chosen.idxA + chosen.idxB) / 2);
    const p1 = path[midIdx];
    const p2 = path[midIdx + 1];

    let cutDir: Direction | null = null;
    for (const d of DIRECTIONS) {
      const delta = DIRECTION_DELTA[d];
      if (p1.x + delta.dx === p2.x && p1.y + delta.dy === p2.y) {
        cutDir = d;
        break;
      }
    }

    if (!cutDir) {
      maze[chosen.ay][chosen.ax].obstacle = 'NONE';
      maze[chosen.ay][chosen.ax].rampDir = undefined;
      continue;
    }

    addWall(p1.x, p1.y, cutDir);

    // Verify:
    // With ramps -> MUST be solvable!
    const withRamp = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (withRamp !== null && withRamp.path.length >= Math.floor(w * 1.1)) {
      return true; // Successfully placed and verified
    }

    // Revert if failed
    maze[chosen.ay][chosen.ax].obstacle = 'NONE';
    maze[chosen.ay][chosen.ax].rampDir = undefined;
    const delta = DIRECTION_DELTA[cutDir];
    maze[p1.y][p1.x].walls[cutDir] = false;
    maze[p2.y][p2.x].walls[OPPOSITE_DIR[cutDir]] = false;
  }

  return false;
}

/**
 * Guaranteed solvable labyrinth fallback:
 * Mathematically guaranteed to return a true BFS-verified path of length >= w.
 * Never returns [startPos, finishPos]!
 */
function buildGuaranteedSolvableLabyrinth(
  w: number,
  h: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
  startPos: { x: number; y: number },
  finishPos: { x: number; y: number }
): {
  maze: MazeCell[][];
  width: number;
  height: number;
  startPos: { x: number; y: number };
  finishPos: { x: number; y: number };
  solutionPath: Array<{ x: number; y: number }>;
  optimalMoves: number;
  cellSize: number;
} {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const cellSize = calculateCellSize(w);

  while (true) {
    const maze: MazeCell[][] = [];
    for (let y = 0; y < h; y++) {
      const row: MazeCell[] = [];
      for (let x = 0; x < w; x++) {
        row.push({
          x,
          y,
          walls: { UP: true, RIGHT: true, DOWN: true, LEFT: true },
          obstacle: 'NONE',
          isStart: x === startPos.x && y === startPos.y,
          isFinish: x === finishPos.x && y === finishPos.y,
          isPartOfSolution: false,
        });
      }
      maze.push(row);
    }

    // DFS Spanning Tree
    const visited = new Set<string>();
    const stack: Array<{ x: number; y: number }> = [];
    visited.add(`0,0`);
    stack.push({ x: 0, y: 0 });

    while (stack.length > 0) {
      const curr = stack[stack.length - 1];
      const neighbors: Array<{ dir: Direction; x: number; y: number }> = [];

      for (const dir of DIRECTIONS) {
        const d = DIRECTION_DELTA[dir];
        const nx = curr.x + d.dx;
        const ny = curr.y + d.dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited.has(`${nx},${ny}`)) {
          neighbors.push({ dir, x: nx, y: ny });
        }
      }

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        maze[curr.y][curr.x].walls[chosen.dir] = false;
        maze[chosen.y][chosen.x].walls[OPPOSITE_DIR[chosen.dir]] = false;
        visited.add(`${chosen.x},${chosen.y}`);
        stack.push({ x: chosen.x, y: chosen.y });
      } else {
        stack.pop();
      }
    }

    // Place ramp along path if difficulty requires ramps
    if (config.requiredRampLeaps >= 1) {
      addOrganicForcedRamp(
        maze,
        w,
        h,
        startPos,
        finishPos,
        (x1, y1, dir) => {
          const delta = DIRECTION_DELTA[dir];
          const x2 = x1 + delta.dx;
          const y2 = y1 + delta.dy;
          if (x1 >= 0 && x1 < w && y1 >= 0 && y1 < h) {
            maze[y1][x1].walls[dir] = true;
          }
          if (x2 >= 0 && x2 < w && y2 >= 0 && y2 < h) {
            maze[y2][x2].walls[OPPOSITE_DIR[dir]] = true;
          }
        },
        0.15,
        0.85
      );
    }

    const initialRes = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (!initialRes || initialRes.path.length < w) continue;
    const initialSol = initialRes.path;

    const solSet = new Set(initialSol.map((p) => `${p.x},${p.y}`));

    // Place bombs ONLY in dead ends strictly outside solution path
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!solSet.has(`${x},${y}`)) {
          let wallCount = 0;
          if (maze[y][x].walls.UP) wallCount++;
          if (maze[y][x].walls.DOWN) wallCount++;
          if (maze[y][x].walls.LEFT) wallCount++;
          if (maze[y][x].walls.RIGHT) wallCount++;
          if (wallCount >= 3 && Math.random() < 0.4) {
            maze[y][x].obstacle = 'BOMB';
          }
        }
      }
    }

    // Place oil in 1-2 crossroad junctions on path with BFS test
    for (let i = 2; i < initialSol.length - 2; i += 4) {
      const pt = initialSol[i];
      maze[pt.y][pt.x].obstacle = 'OIL';
      const test = solveMazeBFS(maze, startPos, finishPos, w, h, true);
      if (!test || test.path.length < w) {
        maze[pt.y][pt.x].obstacle = 'NONE';
      }
    }

    const verified = solveMazeBFS(maze, startPos, finishPos, w, h, true);
    if (verified && verified.path.length >= w) {
      for (const pt of verified.path) {
        maze[pt.y][pt.x].isPartOfSolution = true;
      }

      return {
        maze,
        width: w,
        height: h,
        startPos,
        finishPos,
        solutionPath: verified.path,
        optimalMoves: verified.optimalMoves,
        cellSize,
      };
    }
  }
}

export interface MazeSolveResult {
  path: Array<{ x: number; y: number }>;
  optimalMoves: number;
}

/**
 * BFS Solver checking walls, ramps, and oil sliding
 * @param allowRamps if false, ramp jumps are disabled (used to prove that a ramp is strictly required)
 */
function solveMazeBFS(
  maze: MazeCell[][],
  start: { x: number; y: number },
  finish: { x: number; y: number },
  width: number,
  height: number,
  allowRamps: boolean = true
): MazeSolveResult | null {
  interface QueueNode {
    x: number;
    y: number;
    path: Array<{ x: number; y: number }>;
    moves: number;
  }

  const queue: QueueNode[] = [{ x: start.x, y: start.y, path: [start], moves: 0 }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { x, y, path, moves } = queue.shift()!;
    if (x === finish.x && y === finish.y) {
      return { path, optimalMoves: moves };
    }

    const currentCell = maze[y][x];

    for (const dir of DIRECTIONS) {
      const d = DIRECTION_DELTA[dir];
      const tx = x + d.dx;
      const ty = y + d.dy;

      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;

      const hasWall = currentCell.walls[dir];
      if (hasWall) {
        const canJumpRamp =
          allowRamps &&
          currentCell.obstacle === 'RAMP' &&
          currentCell.rampDir === dir;
        if (!canJumpRamp) continue;
      }

      const targetCell = maze[ty][tx];
      if (targetCell.obstacle === 'BOMB') continue;

      if (targetCell.obstacle === 'OIL') {
        let currSlideX = tx;
        let currSlideY = ty;
        let crashed = false;

        while (true) {
          const slideCell = maze[currSlideY][currSlideX];
          if (slideCell.walls[dir]) {
            crashed = true;
            break;
          }

          const nextSlideX = currSlideX + d.dx;
          const nextSlideY = currSlideY + d.dy;

          if (
            nextSlideX < 0 ||
            nextSlideX >= width ||
            nextSlideY < 0 ||
            nextSlideY >= height
          ) {
            crashed = true;
            break;
          }

          const nextCell = maze[nextSlideY][nextSlideX];
          if (nextCell.obstacle === 'BOMB') {
            crashed = true;
            break;
          }

          currSlideX = nextSlideX;
          currSlideY = nextSlideY;

          if (nextCell.obstacle !== 'OIL') {
            break;
          }
        }

        if (!crashed) {
          const key = `${currSlideX},${currSlideY}`;
          if (!visited.has(key)) {
            visited.add(key);
            // Collect all intermediate sliding cells so the path is completely contiguous
            const slideSteps: Array<{ x: number; y: number }> = [{ x: tx, y: ty }];
            let sx = tx;
            let sy = ty;
            while (sx !== currSlideX || sy !== currSlideY) {
              sx += d.dx;
              sy += d.dy;
              slideSteps.push({ x: sx, y: sy });
            }

            queue.push({
              x: currSlideX,
              y: currSlideY,
              path: [...path, ...slideSteps],
              moves: moves + 1,
            });
          }
        }
        continue;
      }

      const key = `${tx},${ty}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          x: tx,
          y: ty,
          path: [...path, { x: tx, y: ty }],
          moves: moves + 1,
        });
      }
    }
  }

  return null;
}
