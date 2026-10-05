/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export const DIRECTIONS: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

export const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  RIGHT: { dx: 1, dy: 0 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
};

export const OPPOSITE_DIR: Record<Direction, Direction> = {
  UP: 'DOWN',
  RIGHT: 'LEFT',
  DOWN: 'UP',
  LEFT: 'RIGHT',
};

export type ObstacleType = 'NONE' | 'OIL' | 'BOMB' | 'RAMP';

export interface MazeCell {
  x: number;
  y: number;
  /** In-between walls on the borders of this cell */
  walls: Record<Direction, boolean>;
  obstacle: ObstacleType;
  rampDir?: Direction;
  isStart: boolean;
  isFinish: boolean;
  isPartOfSolution: boolean;
}

export interface PlayerCar {
  gridX: number;
  gridY: number;
  facing: Direction;
  isJumping: boolean;
}

export interface GameState {
  maze: MazeCell[][];
  width: number;
  height: number;
  startPos: { x: number; y: number };
  finishPos: { x: number; y: number };
  solutionPath: Array<{ x: number; y: number }>;
  optimalMoves: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  puzzleTitle?: string;
  puzzleDescription?: string;
  moves: number;
  crashes: number;
  oilSlides: number;
  rampsUsed: number;
  startTime: number;
  elapsedSeconds: number;
  isFinished: boolean;
  isCrashed: boolean;
  hasTriggeredCelebration: boolean;
  showHint: boolean;
  statusMessage: string | null;
}
