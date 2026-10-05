/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Direction, DIRECTION_DELTA, GameState, PlayerCar } from './types/game';
import {
  generateMaze,
  calculateResponsiveCellSize,
  DIFFICULTY_CONFIGS,
} from './lib/mazeRb';
import { sound } from './lib/audio';
import { MazeCanvas } from './components/MazeCanvas';
import { GameHeader } from './components/GameHeader';
import { VirtualPad } from './components/VirtualPad';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const [gridSize, setGridSize] = useState<number>(12);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 640
  );

  const [gameState, setGameState] = useState<GameState>(() => {
    const generated = generateMaze(12, 1);
    return {
      maze: generated.maze,
      width: generated.width,
      height: generated.height,
      startPos: generated.startPos,
      finishPos: generated.finishPos,
      solutionPath: generated.solutionPath,
      optimalMoves: generated.optimalMoves,
      difficulty: 1,
      puzzleTitle: generated.puzzleTitle,
      puzzleDescription: generated.puzzleDescription,
      moves: 0,
      oilSlides: 0,
      crashes: 0,
      rampsUsed: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isFinished: false,
      isCrashed: false,
      hasTriggeredCelebration: false,
      showHint: false,
      statusMessage: null,
    };
  });

  const cellSize = useMemo(
    () => calculateResponsiveCellSize(gridSize, windowWidth),
    [gridSize, windowWidth]
  );

  const [car, setCar] = useState<PlayerCar>(() => ({
    gridX: gameState.startPos.x,
    gridY: gameState.startPos.y,
    facing: 'RIGHT',
    isJumping: false,
  }));

  const [isOilSliding, setIsOilSliding] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  const carRef = useRef<PlayerCar>(car);
  carRef.current = car;

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const isOilSlidingRef = useRef<boolean>(isOilSliding);
  isOilSlidingRef.current = isOilSliding;

  // Active game timeouts management to avoid ghost callbacks across resets
  const activeTimeoutsRef = useRef<number[]>([]);

  const addTimeout = useCallback((cb: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      activeTimeoutsRef.current = activeTimeoutsRef.current.filter((t) => t !== id);
      cb();
    }, ms);
    activeTimeoutsRef.current.push(id);
    return id;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
    activeTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Window resize listener for responsive canvas sizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate Maze with custom size and difficulty
  const startNewMaze = useCallback(
    (sz: number, lvl: 1 | 2 | 3 | 4 | 5) => {
      clearAllTimeouts();
      const generated = generateMaze(sz, lvl);
      setGridSize(sz);
      setDifficulty(lvl);
      setGameState({
        maze: generated.maze,
        width: generated.width,
        height: generated.height,
        startPos: generated.startPos,
        finishPos: generated.finishPos,
        solutionPath: generated.solutionPath,
        optimalMoves: generated.optimalMoves,
        difficulty: lvl,
        puzzleTitle: generated.puzzleTitle,
        puzzleDescription: generated.puzzleDescription,
        moves: 0,
        oilSlides: 0,
        crashes: 0,
        rampsUsed: 0,
        startTime: Date.now(),
        elapsedSeconds: 0,
        isFinished: false,
        isCrashed: false,
        hasTriggeredCelebration: false,
        showHint: false,
        statusMessage: null,
      });

      setCar({
        gridX: generated.startPos.x,
        gridY: generated.startPos.y,
        facing: 'RIGHT',
        isJumping: false,
      });

      setIsOilSliding(false);
      isOilSlidingRef.current = false;
    },
    [clearAllTimeouts]
  );

  const handleNewMaze = useCallback(() => {
    startNewMaze(gridSize, difficulty);
  }, [gridSize, difficulty, startNewMaze]);

  const handleChangeGridSize = useCallback(
    (sz: number) => {
      startNewMaze(sz, difficulty);
    },
    [difficulty, startNewMaze]
  );

  const handleChangeDifficulty = useCallback(
    (lvl: 1 | 2 | 3 | 4 | 5) => {
      startNewMaze(gridSize, lvl);
    },
    [gridSize, startNewMaze]
  );

  const handleAdvanceDifficulty = useCallback(() => {
    const nextLvl = Math.min(5, difficulty + 1) as 1 | 2 | 3 | 4 | 5;
    startNewMaze(gridSize, nextLvl);
  }, [difficulty, gridSize, startNewMaze]);

  // Reset Car to Start
  const handleRestartCar = useCallback(() => {
    clearAllTimeouts();
    const current = gameStateRef.current;
    setGameState((prev) => ({
      ...prev,
      moves: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isFinished: false,
      isCrashed: false,
      hasTriggeredCelebration: false,
      statusMessage: null,
    }));

    setCar({
      gridX: current.startPos.x,
      gridY: current.startPos.y,
      facing: 'RIGHT',
      isJumping: false,
    });

    setIsOilSliding(false);
    isOilSlidingRef.current = false;
  }, [clearAllTimeouts]);

  // Victory celebration triggered ONCE
  const triggerVictory = useCallback(() => {
    setGameState((prev) => {
      if (prev.hasTriggeredCelebration) return prev;
      sound.playVictory();
      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#e11d48'],
      });
      return {
        ...prev,
        isFinished: true,
        hasTriggeredCelebration: true,
        statusMessage: 'GOAL REACHED',
      };
    });
  }, []);

  // Crash and reset to Start
  const triggerCrash = useCallback(
    (reason: string) => {
      sound.playCrash();
      setGameState((prev) => ({
        ...prev,
        crashes: prev.crashes + 1,
        isCrashed: true,
        statusMessage: reason,
      }));

      addTimeout(() => {
        const current = gameStateRef.current;
        setCar({
          gridX: current.startPos.x,
          gridY: current.startPos.y,
          facing: 'RIGHT',
          isJumping: false,
        });

        setGameState((prev) => ({
          ...prev,
          isCrashed: false,
        }));
      }, 550);
    },
    [addTimeout]
  );

  // Chain slide handler
  const performChainOilSlide = useCallback(
    (startX: number, startY: number, dir: Direction) => {
      setIsOilSliding(true);
      isOilSlidingRef.current = true;
      sound.playOilSlide();

      const delta = DIRECTION_DELTA[dir];
      let currentX = startX;
      let currentY = startY;

      const slideStep = () => {
        const g = gameStateRef.current;
        const currentCell = g.maze[currentY]?.[currentX];

        if (currentCell && currentCell.walls[dir]) {
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
          triggerCrash('CRASH: Slid into wall');
          return;
        }

        const nextX = currentX + delta.dx;
        const nextY = currentY + delta.dy;

        if (
          nextX < 0 ||
          nextX >= g.width ||
          nextY < 0 ||
          nextY >= g.height
        ) {
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
          triggerCrash('CRASH: Slid into perimeter');
          return;
        }

        const nextCell = g.maze[nextY]?.[nextX];
        if (!nextCell) {
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
          return;
        }

        if (nextCell.obstacle === 'BOMB') {
          // Advance car into the bomb so explosion is visible at collision point
          setCar((prev) => ({
            ...prev,
            gridX: nextX,
            gridY: nextY,
          }));
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
          triggerCrash('CRASH: Slid into bomb');
          return;
        }

        currentX = nextX;
        currentY = nextY;

        setCar((prev) => ({
          ...prev,
          gridX: currentX,
          gridY: currentY,
        }));

        if (nextCell.isFinish) {
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
          triggerVictory();
          return;
        }

        if (nextCell.obstacle === 'OIL') {
          sound.playOilSlide();
          addTimeout(slideStep, 105);
        } else {
          setIsOilSliding(false);
          isOilSlidingRef.current = false;
        }
      };

      addTimeout(slideStep, 115);
    },
    [addTimeout, triggerCrash, triggerVictory]
  );

  // Discrete Movement Handler
  const handleMove = useCallback(
    (dir: Direction) => {
      const g = gameStateRef.current;
      const c = carRef.current;

      if (g.isFinished || g.isCrashed || isOilSlidingRef.current || c.isJumping) {
        return;
      }

      const delta = DIRECTION_DELTA[dir];
      const currentCell = g.maze[c.gridY]?.[c.gridX];
      const targetX = c.gridX + delta.dx;
      const targetY = c.gridY + delta.dy;

      // 1. Check boundary
      if (
        targetX < 0 ||
        targetX >= g.width ||
        targetY < 0 ||
        targetY >= g.height
      ) {
        sound.playBump();
        setCar((prev) => ({ ...prev, facing: dir }));
        return;
      }

      // 2. Check wall
      if (currentCell && currentCell.walls[dir]) {
        if (currentCell.obstacle === 'RAMP' && currentCell.rampDir === dir) {
          sound.playJump();
          setCar((prev) => ({
            ...prev,
            gridX: targetX,
            gridY: targetY,
            facing: dir,
            isJumping: true,
          }));

          setGameState((prev) => ({
            ...prev,
            moves: prev.moves + 1,
            rampsUsed: prev.rampsUsed + 1,
            statusMessage: 'JUMPED OVER WALL',
          }));

          addTimeout(() => {
            setCar((prev) => ({ ...prev, isJumping: false }));
            const landCell = gameStateRef.current.maze[targetY]?.[targetX];
            if (!landCell) return;

            if (landCell.obstacle === 'BOMB') {
              triggerCrash('CRASH: Jumped into bomb');
            } else if (landCell.obstacle === 'OIL') {
              setGameState((prev) => ({
                ...prev,
                oilSlides: prev.oilSlides + 1,
                statusMessage: 'SLIDING ON OIL',
              }));
              performChainOilSlide(targetX, targetY, dir);
            } else if (landCell.isFinish) {
              triggerVictory();
            }
          }, 230);

          return;
        }

        sound.playBump();
        setCar((prev) => ({ ...prev, facing: dir }));
        return;
      }

      const targetCell = g.maze[targetY]?.[targetX];
      if (!targetCell) return;

      // 3. Check Bomb Collision
      if (targetCell.obstacle === 'BOMB') {
        setCar((prev) => ({
          ...prev,
          gridX: targetX,
          gridY: targetY,
          facing: dir,
        }));
        triggerCrash('CRASH: Hit a bomb');
        return;
      }

      // 4. Check Oil Slick
      if (targetCell.obstacle === 'OIL') {
        setCar((prev) => ({
          ...prev,
          gridX: targetX,
          gridY: targetY,
          facing: dir,
        }));

        setGameState((prev) => ({
          ...prev,
          moves: prev.moves + 1,
          oilSlides: prev.oilSlides + 1,
          statusMessage: 'SLIDING ON OIL',
        }));

        performChainOilSlide(targetX, targetY, dir);
        return;
      }

      // 5. Clean Step
      sound.playMove();
      setCar((prev) => ({
        ...prev,
        gridX: targetX,
        gridY: targetY,
        facing: dir,
      }));

      setGameState((prev) => ({
        ...prev,
        moves: prev.moves + 1,
        statusMessage: null,
      }));

      if (targetCell.isFinish) {
        triggerVictory();
      }
    },
    [addTimeout, performChainOilSlide, triggerCrash, triggerVictory]
  );

  // Keyboard navigation listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if an input or select is focused
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          handleMove('UP');
          break;
        case 's':
        case 'arrowdown':
          handleMove('DOWN');
          break;
        case 'a':
        case 'arrowleft':
          handleMove('LEFT');
          break;
        case 'd':
        case 'arrowright':
          handleMove('RIGHT');
          break;
        case '1':
          startNewMaze(gridSize, 1);
          break;
        case '2':
          startNewMaze(gridSize, 2);
          break;
        case '3':
          startNewMaze(gridSize, 3);
          break;
        case '4':
          startNewMaze(gridSize, 4);
          break;
        case '5':
          startNewMaze(gridSize, 5);
          break;
        case 'r':
          handleRestartCar();
          break;
        case 'h':
          setGameState((prev) => ({ ...prev, showHint: !prev.showHint }));
          break;
        case 'm':
          setIsMuted(sound.toggleMute());
          break;
        case 'n':
          handleNewMaze();
          break;
        case 'enter':
        case ' ':
          if (gameStateRef.current.isFinished) {
            if (difficulty < 5) {
              handleAdvanceDifficulty();
            } else {
              handleNewMaze();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleMove,
    handleRestartCar,
    handleNewMaze,
    handleAdvanceDifficulty,
    gridSize,
    difficulty,
    startNewMaze,
  ]);

  // Elapsed time stopwatch ticker
  useEffect(() => {
    if (gameState.isFinished) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.isFinished) return prev;
        return {
          ...prev,
          elapsedSeconds: (Date.now() - prev.startTime) / 1000,
        };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState.isFinished]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-mono selection:bg-zinc-800">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-40 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <GameHeader
            gridSize={gridSize}
            difficulty={difficulty}
            moves={gameState.moves}
            optimalMoves={gameState.optimalMoves}
            elapsedSeconds={gameState.elapsedSeconds}
            crashes={gameState.crashes}
            isMuted={isMuted}
            showHint={gameState.showHint}
            onChangeGridSize={handleChangeGridSize}
            onChangeDifficulty={handleChangeDifficulty}
            onNewMaze={handleNewMaze}
            onRestartCar={handleRestartCar}
            onToggleHint={() =>
              setGameState((prev) => ({ ...prev, showHint: !prev.showHint }))
            }
            onToggleMute={() => setIsMuted(sound.toggleMute())}
          />
        </div>
      </header>

      {/* Main Game Play Area */}
      <main className="max-w-2xl mx-auto w-full p-2.5 sm:p-4 flex flex-col items-center gap-3 flex-1 justify-center">
        {/* Crisp Monospace Labyrinth Canvas */}
        <div className="flex justify-center w-full">
          <MazeCanvas
            maze={gameState.maze}
            width={gameState.width}
            height={gameState.height}
            car={car}
            isOilSliding={isOilSliding}
            isCrashed={gameState.isCrashed}
            showHint={gameState.showHint}
            solutionPath={gameState.solutionPath}
            cellSize={cellSize}
            difficulty={difficulty}
            difficultyName={DIFFICULTY_CONFIGS[difficulty].name}
            onMove={handleMove}
          />
        </div>

        {/* Clean On-Screen D-Pad Controller */}
        <div className="flex flex-col items-center gap-1.5">
          <VirtualPad
            onMove={handleMove}
            disabled={gameState.isFinished || isOilSliding || gameState.isCrashed}
          />
          <div className="text-[11px] text-zinc-500 text-center">
            WASD / Arrows to drive · Swipe on maze
          </div>
        </div>
      </main>

      {/* Victory Modal with Difficulty Progression */}
      <VictoryModal
        isOpen={gameState.isFinished}
        gridSize={gridSize}
        difficulty={difficulty}
        moves={gameState.moves}
        optimalMoves={gameState.optimalMoves}
        elapsedSeconds={gameState.elapsedSeconds}
        oilHits={gameState.oilSlides}
        crashes={gameState.crashes}
        onNextMaze={handleNewMaze}
        onAdvanceDifficulty={handleAdvanceDifficulty}
        onReplayMaze={handleRestartCar}
      />
    </div>
  );
}
