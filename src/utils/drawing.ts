// utils/draw.ts
import type { Tool, CanvasState, AppState } from "../types";
import { getDarkenColor } from "./helpers"
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
  //console.log("drawing", state)

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Draw grid if enabled (instant, no animation)
  if (appState.grid) drawGrid(ctx, state, canvas);
 

  ctx.save();
  applyTransform(ctx, state);
  
 // Drsaw lassi
  if(state?.lasso && state.lasso?.length)  {
    drawLasso(ctx, state);
  }
  
  // Draw paths & overlay
  if(state?.paths && state.paths?.length)  {
    drawPaths(ctx, state, appState);
  }
  
  if (activeTool.renderOverlay) {
    activeTool.renderOverlay(ctx, state);
  }
  
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

const drawLasso2 = (ctx: CanvasRenderingContext2D, state: CanvasState, canvas: HTMLCanvasElement) => {
  
  ctx.save();
  // full-canvas stroke coordinates are in device pixels — caller should have scaled context already
  ctx.beginPath();
  ctx.strokeStyle = "#2563EB";
  ctx.lineWidth = 2;
 // console .log({l: state.lasso})
  
  ctx.setLineDash([5, 5]);
  state.lasso?.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  
  ctx.stroke();
  ctx.setLineDash([]); // reset

}

export function drawLasso(ctx: CanvasRenderingContext2D, state: CanvasState) {
  if (!state.lasso || state.lasso.length < 2) return;
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(state.lasso[0].x, state.lasso[0].y);
  for (let i = 1; i < state.lasso.length; i++) {
    ctx.lineTo(state.lasso[i].x, state.lasso[i].y);
  }
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}



const drawGrid = (ctx: CanvasRenderingContext2D, state: CanvasState, canvas: HTMLCanvasElement) => {
  const gridSize = 50;
  const offsetX = state.offset.x % gridSize;
  const offsetY = state.offset.y % gridSize;

  ctx.save();
  // full-canvas stroke coordinates are in device pixels — caller should have scaled context already
  ctx.beginPath();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  for (let x = -gridSize + offsetX; x < canvas.clientWidth; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.clientHeight);

  }
  for (let y = -gridSize + offsetY; y < canvas.clientHeight; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.clientWidth, y);
  }
  ctx.stroke();
  ctx.restore();
};

const applyTransform = (ctx: CanvasRenderingContext2D, state: CanvasState) => {
  ctx.translate(state.offset.x, state.offset.y);
  ctx.scale(state.scale, state.scale);
};

const drawPaths = (ctx: CanvasRenderingContext2D, state: CanvasState, appState: AppState) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const path of state.paths) {
    if (path.points.length < 2) continue;

    // Precompute the stroke path
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length - 1; i++) {
      const point = path.points[i];
      const next = path.points[i + 1];
      const midX = (point.x + next.x) / 2;
      const midY = (point.y + next.y) / 2;
      ctx.quadraticCurveTo(point.x, point.y, midX, midY);
    }

    const baseWidth = path.pen.size / state.scale;
    let penColor = path.pen.color;
    if (path.pen.type === "highlighter") {
      penColor = getDarkenColor(penColor);
    }

    // 🟦 1. Draw selection highlight BEHIND
    const isSelected = state.selectedIds?.includes(path.id);
    if (isSelected) {
      // Drawing a bigger shape behind main shape
      ctx.save();
      ctx.lineWidth = baseWidth + 6;              // thicker outline
     //ctx.strokeStyle = "#2563EB";                // blue outline
      //ctx.globalAlpha = 0.6;                      // slightly transparent
      ctx.stroke();
      ctx.restore();
    }

    // 📝 2. Draw actual stroke ON TOP
    ctx.lineWidth = baseWidth;
    ctx.strokeStyle = penColor;
    ctx.stroke();
  }
};
