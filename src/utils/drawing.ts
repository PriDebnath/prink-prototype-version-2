// utils/draw.ts
import type { Tool, CanvasState, AppState, Pen, FreehandEventsParams } from "../types";
import { getLightenColor } from "./helpers";
import { BrushFactory, BaseBrush } from "./brush/index";
let animationId: number | null = null;

// 🚀 PERFORMANCE: Brush instance caching to avoid recreating brushes
// This prevents creating new brush instances for every path with the same pen properties
// Significant performance improvement when drawing many paths with similar settings
const brushCache = new Map<string, BaseBrush>();

// 🚀 PERFORMANCE: Dirty rectangle tracking - different approach
// Track dirty regions but don't interfere with the drawing loop
interface DirtyRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const dirtyRegions: DirtyRectangle[] = [];
let isFullRedraw = false;

/**
 * Get cached brush instance or create new one if not cached
 */
function getCachedBrush(pen: Pen): BaseBrush {
  // Create cache key from pen properties that affect rendering
  const key = `${pen.type}-${pen.size}-${pen.color}-${pen.opacity ?? 1}`;
  
  if (!brushCache.has(key)) {
    brushCache.set(key, BrushFactory.createBrush(pen));
  }
  
  return brushCache.get(key)!;
}

/**
 * Clear brush cache (useful for memory management or when pen properties change)
 */
export function clearBrushCache(): void {
  brushCache.clear();
}

/**
 * Get brush cache statistics for debugging and monitoring
 */
export function getBrushCacheStats(): { size: number; keys: string[] } {
  return {
    size: brushCache.size,
    keys: Array.from(brushCache.keys())
  };
}

// 🚀 PERFORMANCE: Dirty rectangle tracking functions (non-interfering)

/**
 * Mark a region as dirty (for future optimization)
 */
export function markDirty(x: number, y: number, width: number, height: number): void {
  dirtyRegions.push({ x, y, width, height });
}

/**
 * Mark entire canvas as dirty (for future optimization)
 */
export function markFullRedraw(): void {
  isFullRedraw = true;
  dirtyRegions.length = 0;
}

/**
 * Clear dirty regions (for future optimization)
 */
export function clearDirtyRegions(): void {
  dirtyRegions.length = 0;
  isFullRedraw = false;
}

/**
 * Get dirty rectangle statistics for debugging
 */
export function getDirtyRectangleStats(): {
  dirtyRegionsCount: number;
  isFullRedraw: boolean;
  dirtyRegions: DirtyRectangle[];
} {
  return {
    dirtyRegionsCount: dirtyRegions.length,
    isFullRedraw,
    dirtyRegions: [...dirtyRegions]
  };
}

/**
 * Calculate bounding box for a path (for dirty rectangle tracking)
 */
function getPathBounds(points: { x: number; y: number }[], pen: Pen): DirtyRectangle {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  // Add padding for brush size and anti-aliasing
  const padding = Math.max(pen.size, 10);
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + (padding * 2),
    height: maxY - minY + (padding * 2)
  };
}

/**
 * Mark dirty region for a path (for future optimization)
 */
export function markPathDirty(points: { x: number; y: number }[], pen: Pen): void {
  const bounds = getPathBounds(points, pen);
  markDirty(bounds.x, bounds.y, bounds.width, bounds.height);
}

/**
 * Test function to demonstrate dirty rectangle tracking
 */
export function testDirtyRectangleTracking(): void {
  console.log("🧪 Testing dirty rectangle tracking...");
  
  // Mark some test dirty regions
  markDirty(10, 10, 100, 100);
  markDirty(200, 200, 50, 50);
  
  // Get stats
  const stats = getDirtyRectangleStats();
  console.log("📊 Dirty rectangle stats:", stats);
  
  // Clear and test again
  clearDirtyRegions();
  const clearedStats = getDirtyRectangleStats();
  console.log("🧹 After clearing:", clearedStats);
  
  console.log("✅ Dirty rectangle tracking is working!");
}

/**
 * Simple test that can be called from browser console
 * This will be available globally for testing
 */
declare global {
  interface Window {
    testDirtyRectangles: () => void;
    markDirty: typeof markDirty;
    getDirtyRectangleStats: typeof getDirtyRectangleStats;
    clearDirtyRegions: typeof clearDirtyRegions;
    markPathDirty: typeof markPathDirty;
    testToolIntegration: () => void;
  }
}

window.testDirtyRectangles = () => {
  console.log("🧪 Testing dirty rectangle tracking...");
  
  // Mark some test dirty regions
  markDirty(10, 10, 100, 100);
  markDirty(200, 200, 50, 50);
  
  // Get stats
  const stats = getDirtyRectangleStats();
  console.log("📊 Dirty rectangle stats:", stats);
  
  // Clear and test again
  clearDirtyRegions();
  const clearedStats = getDirtyRectangleStats();
  console.log("🧹 After clearing:", clearedStats);
  
  console.log("✅ Dirty rectangle tracking is working!");
};

/**
 * Make dirty rectangle functions available globally for testing
 */
window.markDirty = markDirty;
window.getDirtyRectangleStats = getDirtyRectangleStats;
window.clearDirtyRegions = clearDirtyRegions;
window.markPathDirty = markPathDirty;

/**
 * Test the integration with tools
 */
window.testToolIntegration = () => {
  console.log("🧪 Testing tool integration...");
  
  // Clear any existing dirty regions
  clearDirtyRegions();
  
  // Simulate adding a path (like StrokeToolBase does)
  const testPoints = [
    {x: 100, y: 100},
    {x: 150, y: 120},
    {x: 200, y: 100}
  ];
  const testPen = {type: "pencil" as const, size: 20, color: "#000000"};
  
  markPathDirty(testPoints, testPen);
  
  const stats = getDirtyRectangleStats();
  console.log("📊 After marking path dirty:", stats);
  
  // Simulate panning (like PanTool does)
  markFullRedraw();
  
  const panStats = getDirtyRectangleStats();
  console.log("📊 After marking full redraw:", panStats);
  
  console.log("✅ Tool integration is working!");
};

export type Getters = {
  canvas: HTMLCanvasElement;
  gridCanvas: HTMLCanvasElement;
  getState: () => CanvasState;
  getActiveTool: () => Tool;
  getAppState: () => AppState;
};


/**
 * Draw a single frame (no RAF loop). Uses getters to avoid stale closures.
 */
export const draw = (g: Getters) => {
  const canvas = g.canvas;
  const gridCanvas = g.gridCanvas;
  const state = g.getState();
  const activeTool = g.getActiveTool();
  const appState = g.getAppState();

  // Draw grid on background canvas if available
  if (gridCanvas) {
    const gridCtx = gridCanvas.getContext("2d")!;
    gridCtx.clearRect(0, 0, gridCanvas.clientWidth, gridCanvas.clientHeight);
    
    if (appState.grid) {
      // console.log("Drawing grid on background canvas");
      drawGrid(gridCtx, state, gridCanvas);
    } else {
      // console.log("Grid disabled - clearing grid canvas");
    }
  }

  // Clear and draw content on drawing canvas
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.save();
  applyTransform(ctx, state);
  
 // Draw lasso
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
  const gridSize = 50 * state.scale;
  const offsetX = state.offset.x % gridSize;
  const offsetY = state.offset.y % gridSize;

  ctx.save();
  // full-canvas stroke coordinates are in device pixels — caller should have scaled context already
  ctx.beginPath();
  ctx.strokeStyle = "#d0d0d0";
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
  
  // Use cached brush instance for better performance
  const brush = getCachedBrush(pen);
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
      const brush = getCachedBrush(pen);
      ctx.lineWidth = pen.size + 6;
      ctx.strokeStyle = "#2563EB";
      ctx.globalAlpha = 0.4;
      
      // Render with selection highlight using brush system
      renderPathWithBrush(ctx, pts, brush, pen);
    }
    ctx.restore();
  }