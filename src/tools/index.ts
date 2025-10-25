// ---------- Tools ----------

// ---------- Tools ----------
import type { Tool, Point, CanvasState, AppState, Freehand, ToolEventsParams } from '../types';

abstract class BaseTool implements Tool {
  name = "base";
  onPointerDown(params: ToolEventsParams) { };
  onPointerMove(params: ToolEventsParams) { };
  onPointerUp(params: ToolEventsParams) { };
  renderOverlay(params: ToolEventsParams) { }

  public toWorld(e: PointerEvent, canvasState: CanvasState): Point {
    return {
      x: (e.clientX - canvasState.offset.x) / canvasState.scale,
      y: (e.clientY - canvasState.offset.y) / canvasState.scale,
    };
  }

}


export class PenTool extends BaseTool {
  name: string = 'pen';
  private drawing = false;
  private lastTime = 0;
  private sprayInterval = 16; // ~60fps for airbrush continuous spray

  onPointerDown(params: ToolEventsParams) {
    const { e, canvasState, appState } = params;
    if (e.button !== 0) return;
    this.drawing = true;
    //this.lastTime = performance.now();

    const world = this.toWorld(e, canvasState);

    // Create current path with pen settings
    canvasState.currentPath = {
      id: canvasState.paths.length + 1,
      points: [world],
      pen: {
        ...appState.pen,
        opacity: appState.pen.opacity || (appState.pen.type === "airbrush" ? 0.3 : 1.0)
      }
    };
    canvasState.paths.push(canvasState.currentPath);
  }

  onPointerMove(params: ToolEventsParams) {
    const { e, canvasState, appState } = params;
    if (!this.drawing || !canvasState.currentPath) return;
    const world = this.toWorld(e, canvasState);
    // const currentTime = performance.now();
    /*
    // For airbrush, add points based on time interval for continuous spray
    if (appState.pen.type === "airbrush") {
      if (currentTime - this.lastTime >= this.sprayInterval) {
        canvasState.currentPath.points.push(world);
        this.lastTime = currentTime;
      }
    } else {
      */
    // For regular pen tools, add every point
    canvasState.currentPath.points.push(world);
    //}
  }

  onPointerUp(e: PointerEvent, canvasState: CanvasState) {
    console.log({ p: canvasState.paths })

    this.drawing = false;
    canvasState.currentPath = null;
  }

  renderOverlay(ctx: CanvasRenderingContext2D, canvasState: CanvasState) {
    if (!this.drawing || !canvasState.currentPath) return;

    // Only render overlay for airbrush
    return

  }
}



export class EraserTool extends BaseTool {
  name: string = 'eraser';
  startPoint: Point | null = null;

  onPointerDown(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
    if (e.button !== 0) return;

    console.log("onPointerDown   eraser", canvasState);
    const world = this.toWorld(e, canvasState);
    canvasState.lasso = [];
    canvasState.lasso.push(world);
  }


  onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
    console.log("onPointermove   eraser", canvasState);

    const world = this.toWorld(e, canvasState);
    canvasState.lasso?.push(world);

  }


  onPointerUp(e: PointerEvent, canvasState: CanvasState) {
    const lasso = canvasState.lasso;
    if (lasso && lasso.length < 2) {
      canvasState.lasso = [];
      return;
    }

    const threshold = 5; // 👈 how close the lasso must be to a point to erase it

    function distPointToSegment(
      { px, py, x1, y1, x2, y2 }:
        { px: number, py: number, x1: number, y1: number, x2: number, y2: number }
    ) {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let t = -1;
      if (lenSq !== 0) t = dot / lenSq;

      let nearestX, nearestY;
      if (t < 0) {
        nearestX = x1;
        nearestY = y1;
      } else if (t > 1) {
        nearestX = x2;
        nearestY = y2;
      } else {
        nearestX = x1 + t * C;
        nearestY = y1 + t * D;
      }

      const dx = px - nearestX;
      const dy = py - nearestY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if a stroke point is close to any lasso segment
    function isPointNearLasso(px: number, py: number) {
      for (let i = 0; i < (lasso?.length ?? 0) - 1; i++) {
        const l1 = lasso?.[i];
        const l2 = lasso?.[i + 1];
        if (distPointToSegment({ px, py, x1: l1?.x ?? 0, y1: l1?.y ?? 0, x2: l2?.x ?? 0, y2: l2?.y ?? 0 }) < threshold) {
          return true as boolean;
        }
      }
      return false;
    }

    // ✅ For each stroke, remove only touched points
    if (canvasState.paths) {
      const updatedPaths = canvasState.paths
        .map((pen: Freehand) => {
          const remainingPoints = pen.points.filter(
            (pt) => !isPointNearLasso(pt.x, pt.y)
          );

          // If no points remain, drop the whole stroke
          if (remainingPoints.length === 0) return null;

          return {
            ...pen,
            points: remainingPoints,
          } as Freehand;
        })

      const filteredPaths = updatedPaths.filter(Boolean); // remove null strokes

      canvasState.paths = filteredPaths as Freehand[];
    }
    // Clear lasso after erasing
    canvasState.lasso = [];
  }

}