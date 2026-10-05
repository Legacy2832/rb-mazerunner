
# RB Maze Runner: Procedural Obstacle Course

A grid-based procedural maze puzzle game built with React 19, TypeScript, and Vite. Mazes are generated using a customized Recursive Backtracking (RB) algorithm with topological path carving and guaranteed graph solvability validation.

## Technical Architecture & How It Works

### 1. Procedural Maze
The maze generator utilizes a randomized recursive backtracking algorithm to generate a perfect depth-first spanning tree:
- **Grid Initialization:** Each coordinate begins as a fully isolated cell with closed borders in all four directions.
- **Topological Carving:** Starting from the origin `(0, 0)`, the algorithm iteratively carves a continuous path by removing shared walls with random unvisited neighbors, pushing cells onto a stack and backtracking whenever it encounters a dead end to ensure all nodes are visited and border invariants are preserved.
- **Forced Puzzle Injection:** Based on the selected difficulty configuration, algorithmic requirements (such as required ramp leaps or chained oil runways) are deterministically anchored into the grid topology prior to generation, forcing the pathfinder to route around them and integrate decoy paths.

### 2. Graph Solvability & Par Calculation
- **Breadth-First Search (BFS):** After generation, a graph traversal algorithm verifies reachability from start to finish.
- **Obstacle Simulation:** The solver accounts for oil sliding momentum and ramp leap trajectories during path calculation.
- **Optimal Moves (Par):** The shortest valid path length is recorded as `optimalMoves`. Mazes that cannot be solved or that violate minimum difficulty constraints are rejected and re-seeded.

### 3. Decoupled Rendering Pipeline
To ensure smooth 60 FPS motion without triggering React DOM re-renders:
- The game board is rendered imperatively on an HTML5 2D Canvas.
- Car position and heading angle use an internal linear interpolation (`lerp`) loop run by `requestAnimationFrame`.
- React state is updated only upon logical grid transitions, separating game state changes from display frame updates.

### 4. Synthesized Audio Engine
The project contains zero external audio sample files. All sound effects are generated in real-time using the native Web Audio API:
- **Move:** Short triangle wave frequency ramp.
- **Jump:** Ascending sine wave sweep.
- **Oil Slide:** Descending sawtooth slide.
- **Wall Bump:** Low-frequency square wave impulse.
- **Crash:** Modulated noise burst and pitch drop.
- **Victory:** Multi-oscillator 4-chord triumph fanfare.
## Run Locally

Clone the project

```bash
  git clone https://github.com/Legacy2832/rb-mazerunner.git
```

Go to the project directory

```bash
  cd rb-mazerunner
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

**Github Pages**
https://legacy2832.github.io/rb-mazerunner

## Credits

Built with AI assistance.