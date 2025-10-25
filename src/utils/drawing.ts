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
  //console.log("drawing", state)

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Draw grid if enabled (instant, no animation)
  if (appState.grid) drawGrid(ctx, state, canvas);
 

  ctx.save();
  applyTransform(ctx, state);
  
 // Drsaw lassi
  if( (activeTool.name == "lasso" || activeTool.name == "eraser" ) && state?.lasso && state.lasso?.length)  {
    console.log("drawing lasso")
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

// 🚀 High-performance direct rendering (bypasses brush system)
function renderPathDirectly(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], pen: Pen) {
  if (pts.length < 1) return;

  ctx.save();
  
  switch (pen.type) {
    case "pencil":
      // Direct smooth path rendering
      buildSmoothPath(ctx, pts, pen);
      break;
      
    case "airbrush":
      // Direct airbrush rendering
      buildAirbrushPath(ctx, pts, pen);
      break;
      
    case "highlighter":
      // Direct highlighter rendering
      buildHighlighterPath(ctx, pts, pen);
      break;
      
    case "eraser":
      // Direct eraser rendering
      buildEraserPath(ctx, pts, pen);
      break;
      
    default:
      // Fallback to smooth path
      buildSmoothPath(ctx, pts, pen);
  }
  
  ctx.restore();
}

// 🎨 Direct rendering functions (high performance)
function buildHighlighterPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], pen: Pen) {
  if (pts.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  
  // Use lightened color for highlighter effect
  const lightenedColor = getLightenColor(pen.color);
  ctx.strokeStyle = lightenedColor;
  ctx.lineWidth = pen.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.3; // Semi-transparent for highlighter effect
  
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

function buildEraserPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], pen: Pen) {
  if (pts.length < 2) return;
  
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  // Smooth eraser path using Catmull-Rom to Bezier
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

  ctx.lineWidth = pen.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

// 🎨 Render path using improved brush system
function renderPathWithBrush(
  ctx: CanvasRenderingContext2D, 
  pts: { x: number; y: number }[],
  brush: BaseBrush,
  pen: Pen
) {
  if (pts.length < 1) return;

  // Create params for brush system with full points array
  const createBrushParams = (points: { x: number; y: number }[]): FreehandEventsParams => ({
    ctx,
    points,
    canvasState: {} as CanvasState,
    appState: { pen } as AppState,
    e: {} as PointerEvent
  });

  // Start the stroke
  brush.onStrokeStart(createBrushParams([pts[0]]));

  // For airbrush, render each point individually with distance optimization
  if (pen.type === "airbrush") {
    const minDistance = 10;
    let lastDrawn: { x: number; y: number } | null = null;
    const filteredPts: { x: number; y: number }[] = [];
    
    for (const pt of pts) {
      if (lastDrawn) {
        const dx = pt.x - lastDrawn.x;
        const dy = pt.y - lastDrawn.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) continue;
      }
      
      filteredPts.push(pt);
      brush.onStrokeMove(createBrushParams(filteredPts));
      lastDrawn = pt;
    }
  } else if (pen.type === "eraser") {
    // For eraser, render the entire path at once to avoid multiple calls
    brush.onStrokeMove(createBrushParams(pts));
  } else {
    // For other brushes, render as connected path
    for (let i = 1; i < pts.length; i++) {
      brush.onStrokeMove(createBrushParams(pts.slice(0, i + 1)));
    }
  }

  // End the stroke
  brush.onStrokeEnd(createBrushParams(pts));
}

// ✨ Catmull–Rom to Bezier smoothing
function buildSmoothPath(ctx: CanvasRenderingContext2D, 
  pts: { x: number; y: number }[],
  pen: Pen,
) {
  
    ctx.save();
    ctx.beginPath();
    
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

    ctx.strokeStyle = pen.color;
    
    ctx.lineWidth = pen.size;
    ctx.globalAlpha = pen.opacity ?? 1;
    ctx.stroke();
    ctx.restore();
}


function sliceSkip(arr: { x: number; y: number }[], skip = 1) {
  return arr.filter((_, index) => index % (skip + 1) === 0);
}


  function buildAirbrushPath(ctx: CanvasRenderingContext2D, 
    pts: { x: number; y: number }[],
    pen: Pen,
    ){
    // Render airbrush with radial gradient for soft edges
      const minDistance = 10; // 👈 adjustable distance threshold (in px)
      let lastDrawn = null;
      const slicedPts = sliceSkip(pts, 1)
      for (const pt of pts) {
        // Skip if the point is too close to the previous drawn point
       if (lastDrawn) {
         const dx = pt.x - lastDrawn.x;
        const dy = pt.y - lastDrawn.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
         if (distance < minDistance) {
           continue;
         }
       }
       
        ctx.save();
        // Create radial gradient from center to edge
        const gradient = ctx.createRadialGradient(
          pt.x, pt.y, 0,
          pt.x, pt.y, pen.size / 2
        );
        
        const { color: penColor, opacity = 0.3 } = pen;

        // Helper: convert opacity (0–1) to 2-digit hex
       const toHex = (val: number) => Math.round(val * 255).toString(16).padStart(2, '0');

       // Define gradient stops more finely for smoother transition
       const stops = [
          { offset: 0,    alpha: opacity },
          { offset: 0.2,  alpha: opacity * 0.8 },
          { offset: 0.4,  alpha: opacity * 0.5 },
          { offset: 0.6,  alpha: opacity * 0.3 },
          { offset: 0.8,  alpha: opacity * 0.15 },
          { offset: 1,    alpha: 0 },
        ];

        // Add all stops to the gradient
        for (const { offset, alpha } of stops) {
          gradient.addColorStop(offset, `${penColor}${toHex(alpha)}`);
        }
   
       ctx.fillStyle = gradient;
       // ctx.fillStyle = penColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pen.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Update last drawn point
        lastDrawn = pt;
    }

}


function buildSelectedPath(ctx: CanvasRenderingContext2D, 
  pts: { x: number; y: number }[],
  pen: Pen,
  ){
    ctx.save();
    ctx.beginPath();
    
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