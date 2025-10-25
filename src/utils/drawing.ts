// utils/draw.ts
import type { Tool, CanvasState, AppState, Pen, FreehandEventsParams } from "../types";
import { getLightenColor } from "./helpers";
import { BrushFactory, BaseBrush } from "./brush/index";
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

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Draw grid if enabled (instant, no animation)
  if (appState.grid) drawGrid(ctx, state, canvas);
 

  ctx.save();
  applyTransform(ctx, state);
  
 // Drsaw lassi
  if( (activeTool.name == "lasso" || activeTool.name == "eraser" ) && state?.lasso && state.lasso?.length)  {
    drawLasso(ctx, state, activeTool);
  }
  
  // Draw paths & overlay
  if(state?.paths && state.paths?.length)  {
    drawPaths(ctx, state, appState, activeTool);
  }
  
  // if (activeTool.renderOverlay) {
  //   // activeTool.renderOverlay(ctx, state);
  // }
  
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


export function drawLasso(ctx: CanvasRenderingContext2D, state: CanvasState, activeTool: Tool) {
  if (  (!state.lasso || state.lasso.length < 2)) return;
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(state.lasso[0].x, state.lasso[0].y);
  for (let i = 1; i < state.lasso.length; i++) {
    ctx.lineTo(state.lasso[i].x, state.lasso[i].y);
  }
  ctx.setLineDash([5, 5]);
  let strokeStyle = "#2563EB"
  if(activeTool.name == "lasso"){
    strokeStyle = "#2563EB"
  }else if (activeTool.name == "eraser"){
    strokeStyle = "red"
  }
  
  ctx.strokeStyle = strokeStyle;
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


const drawPaths = (ctx: CanvasRenderingContext2D, state: CanvasState, appState: AppState, activeTool: Tool) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const path of state.paths) {
    const pts = path.points;
    if (pts.length < 1) continue;

    // 🟦 Draw selection highlight behind stroke
    const isSelected = state.selectedIds?.includes(path.id);
    if (activeTool.name=="lasso" && isSelected ) {
      buildSelectedPath(ctx, pts, path.pen)
    }

    // 📝 Direct rendering for better performance
    renderPathDirectly(ctx, pts, path.pen);
  }
};

// 🚀 High-performance rendering using optimized brush system
function renderPathDirectly(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], pen: Pen) {
  if (pts.length < 1) return;
  
  const brush = BrushFactory.createBrush(pen);
  renderPathWithBrush(ctx, pts, brush, pen);
}


// 🚀 Ultra-high-performance brush rendering - single call per path
function renderPathWithBrush(
  ctx: CanvasRenderingContext2D, 
  pts: { x: number; y: number }[],
  brush: BaseBrush,
  pen: Pen
) {
  if (pts.length < 1) return;

  // Create optimized params object (reused for performance)
  const brushParams: FreehandEventsParams = {
    ctx,
    points: pts,
    canvasState: {} as CanvasState,
    appState: { pen } as AppState,
    e: {} as PointerEvent
  };

  // Start the stroke
  brush.onStrokeStart(brushParams);

  // 🚀 PERFORMANCE FIX: Render entire path in single call instead of per-point
  // This eliminates the heavy loop that was causing choppy rendering
  brush.onStrokeMove(brushParams);

  // End the stroke
  brush.onStrokeEnd(brushParams);
}





function buildSelectedPath(ctx: CanvasRenderingContext2D, 
  pts: { x: number; y: number }[],
  pen: Pen,
  ){
    ctx.save();
    
    if (pen.type === "airbrush") {
      // For airbrush, draw selection around each particle
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pen.size / 4 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#2563EB";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
      }
    } else {
      // For other brushes, use brush system with selection styling
      const brush = BrushFactory.createBrush(pen);
      ctx.lineWidth = pen.size + 6;
      ctx.strokeStyle = "#2563EB";
      ctx.globalAlpha = 0.4;
      
      // Render with selection highlight using brush system
      renderPathWithBrush(ctx, pts, brush, pen);
    }
    ctx.restore();
  }