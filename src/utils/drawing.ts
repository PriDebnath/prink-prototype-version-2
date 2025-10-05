// utils/draw.ts
import type { Tool, CanvasState, AppState } from "../types";

let animationId: number | null = null;

type Getters = {
  canvas: HTMLCanvasElement;
  getState: () => CanvasState;
  getActiveTool: () => Tool;
  getAppState: () => AppState;
};

/**
 * Draw a single frame (no RAF loop). Uses getters to avoid stale closures.
 */
export const draw = (g: Getters) => {
  const canvas = g.canvas;
  const state = g.getState();
  const activeTool = g.getActiveTool();
  const appState = g.getAppState();
  console.log("drawiiiii")
  console.log("drawiiiii")
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid if enabled (instant, no animation)
  if (appState.grid) drawGrid(ctx, state);

  // Draw paths & overlay
  ctx.save();
  applyTransform(ctx, state);
  drawPaths(ctx, state);
  if (activeTool.renderOverlay) activeTool.renderOverlay(ctx, state);
  ctx.restore();
};

/**
 * Start continuous drawing loop (requestAnimationFrame).
 * Call this when user starts drawing (pointerdown).
 * Uses getters so current state/tool are used each frame.
 */
export const startDrawingLoop = (g: Getters) => {
  if (animationId != null) return;

  const loop = () => {
    draw(g);
    animationId = requestAnimationFrame(loop);
  };

  loop();
};

/** Stop continuous drawing loop. Call on pointerup / cancel. */
export const stopDrawingLoop = () => {
  if (animationId != null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// ----------------- helpers -----------------

const drawGrid = (ctx: CanvasRenderingContext2D, state: CanvasState) => {
  const gridSize = 50;
  const offsetX = state.offset.x % gridSize;
  const offsetY = state.offset.y % gridSize;

  ctx.save();
  // full-canvas stroke coordinates are in device pixels — caller should have scaled context already
  ctx.beginPath();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  for (let x = -gridSize + offsetX; x < ctx.canvas.width; x += gridSize) {
  
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
  
  }
  for (let y = -gridSize + offsetY; y < ctx.canvas.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width, y);
  }
  ctx.stroke();
  ctx.restore();
};

const applyTransform = (ctx: CanvasRenderingContext2D, state: CanvasState) => {
  ctx.translate(state.offset.x, state.offset.y);
  ctx.scale(state.scale, state.scale);
};

const drawPaths = (ctx: CanvasRenderingContext2D, state: CanvasState) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2 / state.scale;

  for (const path of state.paths) {
    if (path.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);

    for (let i = 1; i < path.points.length - 1; i++) {
      const midX = (path.points[i].x + path.points[i + 1].x) / 2;
      const midY = (path.points[i].y + path.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, midX, midY);
    }

    ctx.stroke();
  }
};
