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
  const gridSize = 50 * state. scale;
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
    const pts = path.points;
    if (pts.length < 2) continue;

    // ✅ Pen size stays as originally chosen
    const baseWidth = path.pen.size;
    let penColor = path.pen.color;
    if (path.pen.type === "highlighter") {
      penColor = getDarkenColor(penColor);
    }

    // 🟦 Draw selection highlight behind stroke
    const isSelected = state.selectedIds?.includes(path.id);
    if (isSelected) {
      ctx.save();
      ctx.beginPath();
      buildSmoothPath(ctx, pts);
      ctx.lineWidth = baseWidth + 6;
      ctx.strokeStyle = "#2563EB";
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.restore();
    }

    // 📝 Actual stroke
    ctx.save();
    ctx.beginPath();
    buildSmoothPath(ctx, pts);

    // Optional: subtle taper using gradient (feels more organic)
    const gradient = ctx.createLinearGradient(
      pts[0].x, pts[0].y,
      pts[pts.length - 1].x, pts[pts.length - 1].y
    );
    gradient.addColorStop(0, `${penColor}`);
    gradient.addColorStop(0.1, penColor);
    gradient.addColorStop(0.9, penColor);
    gradient.addColorStop(1, `${penColor}`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = baseWidth;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
  }
};

// ✨ Catmull–Rom to Bezier smoothing
function buildSmoothPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}
