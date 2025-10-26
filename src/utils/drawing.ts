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

// 🚀 PERFORMANCE: Track optimization effectiveness
let fullClears = 0;
let partialClears = 0;
let totalClears = 0;

// 🚀 PERFORMANCE: Step 4 - Track selective path redrawing effectiveness
let totalPathsRendered = 0;
let selectivePathsRendered = 0;
let fullPathRenders = 0;

// 🚀 PERFORMANCE: Track current drawing state to avoid clearing active paths
let isCurrentlyDrawing = false;
let currentDrawingPathId: number | null = null;
let drawingEndDelay = 0; // Delay before re-enabling optimization

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
 * Mark that drawing has started
 */
export function startDrawing(pathId: number): void {
  isCurrentlyDrawing = true;
  currentDrawingPathId = pathId;
}

/**
 * Mark that drawing has ended
 */
export function endDrawing(): void {
  isCurrentlyDrawing = false;
  currentDrawingPathId = null;
  drawingEndDelay = 3; // Wait 3 frames before re-enabling optimization
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

// Add optimization stats function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getOptimizationStats = () => {
  const clearEfficiency = totalClears > 0 ? Math.round((partialClears / totalClears) * 100) / 100 : 0;
  const pathEfficiency = totalPathsRendered > 0 ? Math.round((selectivePathsRendered / totalPathsRendered) * 100) / 100 : 0;
  
  return {
    // Step 3: Dirty rectangle clearing stats
    clearStats: {
      totalClears,
      fullClears,
      partialClears,
      efficiency: clearEfficiency
    },
    // Step 4: Selective path redrawing stats
    pathStats: {
      totalPathsRendered,
      selectivePathsRendered,
      fullPathRenders,
      efficiency: pathEfficiency
    },
    // Overall performance
    overallEfficiency: Math.round(((clearEfficiency + pathEfficiency) / 2) * 100) / 100
  };
};

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
 * Get paths that need to be redrawn based on dirty regions
 * Step 4: Selective path redrawing for maximum performance
 */
function getPathsToRedraw(paths: { points: { x: number; y: number }[]; pen: Pen; id: number }[], dirtyRegions: DirtyRectangle[], isFullRedraw: boolean): { points: { x: number; y: number }[]; pen: Pen; id: number }[] {
  if (isFullRedraw || dirtyRegions.length === 0) {
    return paths; // Redraw all paths
  }

  const pathsToRedraw: { points: { x: number; y: number }[]; pen: Pen; id: number }[] = [];
  
  for (const path of paths) {
    const pathBounds = getPathBounds(path.points, path.pen);
    
    // Check if path intersects with any dirty region
    const intersects = dirtyRegions.some(region => 
      !(pathBounds.x > region.x + region.width ||
        pathBounds.x + pathBounds.width < region.x ||
        pathBounds.y > region.y + region.height ||
        pathBounds.y + pathBounds.height < region.y)
    );
    
    if (intersects) {
      pathsToRedraw.push(path);
    }
  }
  
  return pathsToRedraw;
}

/**
 * Exclude dirty regions that intersect with current drawing path to prevent flickering
 */
function excludeCurrentDrawingRegions(regions: DirtyRectangle[], state: CanvasState): DirtyRectangle[] {
  if (!isCurrentlyDrawing || !state.currentPath || state.currentPath.points.length === 0) {
    return regions; // No current drawing, return all regions
  }
  
  const currentPathBounds = getPathBounds(state.currentPath.points, state.currentPath.pen);
  
  // Filter out regions that intersect with current drawing path
  return regions.filter(region => {
    // Check if region intersects with current drawing path
    const intersects = !(
      region.x > currentPathBounds.x + currentPathBounds.width ||
      region.x + region.width < currentPathBounds.x ||
      region.y > currentPathBounds.y + currentPathBounds.height ||
      region.y + region.height < currentPathBounds.y
    );
    
    return !intersects; // Return regions that DON'T intersect
  });
}

/**
 * Merge overlapping dirty regions to reduce clear operations
 */
function mergeDirtyRegions(): DirtyRectangle[] {
  if (dirtyRegions.length <= 1) return [...dirtyRegions];
  
  const merged: DirtyRectangle[] = [];
  
  for (const region of dirtyRegions) {
    let mergedWithExisting = false;
    
    for (let i = 0; i < merged.length; i++) {
      const existing = merged[i];
      
      // Check if regions overlap or are close enough to merge
      const overlap = !(
        region.x > existing.x + existing.width + 5 ||
        region.x + region.width + 5 < existing.x ||
        region.y > existing.y + existing.height + 5 ||
        region.y + region.height + 5 < existing.y
      );
      
      if (overlap) {
        // Merge regions
        const minX = Math.min(region.x, existing.x);
        const maxX = Math.max(region.x + region.width, existing.x + existing.width);
        const minY = Math.min(region.y, existing.y);
        const maxY = Math.max(region.y + region.height, existing.y + existing.height);
        
        merged[i] = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
        
        mergedWithExisting = true;
        break;
      }
    }
    
    if (!mergedWithExisting) {
      merged.push(region);
    }
  }
  
  return merged;
}

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

  // 🚀 PERFORMANCE: Conservative dirty rectangle clearing
  const ctx = canvas.getContext("2d")!;
  
  totalClears++;
  
  if (isFullRedraw || dirtyRegions.length === 0 || isCurrentlyDrawing || drawingEndDelay > 0) {
    // Full clear - safe fallback OR during active drawing OR during delay
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    fullClears++;
    
    // Countdown the delay
    if (drawingEndDelay > 0) {
      drawingEndDelay--;
    }
  } else {
    // Partial clear - merge overlapping regions and clear with padding
    const mergedRegions = mergeDirtyRegions();
    
    // 🚀 PERFORMANCE: Exclude regions that intersect with current drawing path
    const regionsToClear = excludeCurrentDrawingRegions(mergedRegions, state);
    
    for (const region of regionsToClear) {
      // Add padding to prevent flickering on semi-transparent elements
      const padding = 2;
      ctx.clearRect(
        region.x - padding, 
        region.y - padding, 
        region.width + (padding * 2), 
        region.height + (padding * 2)
      );
    }
    partialClears++;
  }
  
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
  
  // Clear dirty regions after processing
  clearDirtyRegions();
  
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

  // 🚀 PERFORMANCE: Step 4 - Selective path redrawing during non-drawing periods
  if (isCurrentlyDrawing || drawingEndDelay > 0) {
    // Step 3: Full rendering during active drawing (prevents flickering)
    fullPathRenders++;
    totalPathsRendered += state.paths.length;
    
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
  } else {
    // Step 4: Selective path redrawing - only redraw intersecting paths
    const pathsToRedraw = getPathsToRedraw(state.paths, dirtyRegions, isFullRedraw);
    selectivePathsRendered += pathsToRedraw.length;
    totalPathsRendered += state.paths.length;

    for (const path of pathsToRedraw) {
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