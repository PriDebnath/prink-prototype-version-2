import {
    BrushFactory,
    BaseBrush
} from "../brush/index";
import type {
    Tool,
    Point,
    CanvasState,
    AppState,
    Freehand,
    ToolEventsParams
} from '../../types';


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

export class StrokeToolBase extends BaseTool {
    name: string = 'pen';
    private drawing = false;
    private brush: BaseBrush | null = null;

    onPointerDown(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params
        if (e.button !== 0) return;
        this.drawing = true;

        const world = this.toWorld(e, canvasState);
        this.brush = BrushFactory.createBrush(appState.pen);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeStart({ e, from: world, to: world, canvasState, ctx, appState });

        canvasState.currentPath = {
            id: canvasState.paths.length + 1,
            points: [world],
            pen: appState.pen,
        };
        canvasState.paths.push(canvasState.currentPath);
    }

    onPointerMove(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params

        if (!this.drawing || !canvasState.currentPath) return;
        const world = this.toWorld(e, canvasState);
        canvasState.currentPath.points.push(world);
        
        const last = canvasState.currentPath.points.at(-1)!;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeMove({ e, from: last, to: world, canvasState, ctx, appState });
    }

    onPointerUp(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params

        if (!this.drawing) return;
        this.drawing = false;
        const world = this.toWorld(e, canvasState);
        const last = canvasState.currentPath?.points.at(-1);
        if (!last) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeEnd({ e, from: last, to: world, canvasState, ctx, appState });
        this.brush = null;
        canvasState.currentPath = null;
    }
}

export class PanTool extends BaseTool {
    name: string = 'pan';
    // for pan
    private lastPointPosition: Point | null = null;
    /*
    * Each finger (or mouse button) is assign ed a unique pointerId by the browser.
    * That same ID persists through the entire interaction:
    * 🟡 pointerdown  →  🟠 pointermove (0..many times)  →  🔴 pointerup
    */
    private activePoints: Map<number, Point> = new Map(); // Tracks all active fingers/pointers
    private lastDistance: number | null = null;          // Last distance between two touch points (for zoom)
    private newDistance: number | null = null;           // Current distance (for zoom comparison)
    private lastCanvasScale: number = 0
  
    onPointerDown(params: ToolEventsParams) {
      const { e, canvasState } = params
      console.log('pan tool onPointerDown', e, canvasState);
      if (e.button !== 0) return;
  
      const pointPosition = { x: e.clientX, y: e.clientY };
      this.lastPointPosition = pointPosition
      //@1 Store this pointer's initial position
      this.activePoints = this.activePoints.set(e.pointerId, pointPosition)
    }
  
    onPointerMove(params: ToolEventsParams) {
      const { e, canvasState } = params
      console.log('pan tool onPointerMove');
      if (!this.lastPointPosition || !this.activePoints.has(e.pointerId)) return
      console.log({ canvasState, lastPointPosition: this.lastPointPosition });
      //@2 Update this pointer's current position
      const pointPosition = { x: e.clientX, y: e.clientY };
      this.activePoints.set(e.pointerId, pointPosition);
      // determine if panning/zooming
      if (this.activePoints?.size >= 2) {
        this.handlePinchZoom(this.activePoints, canvasState)
      } else if (this.lastPointPosition) {
        this.handlePan(this.lastPointPosition, pointPosition, canvasState)
      }
    }
  
    onPointerUp(params: ToolEventsParams) {
      const { e, canvasState } = params
      console.log('pan tool onPointerUp', e, canvasState);
  
      this.lastDistance = null;
      this.lastPointPosition = null;
      //@3 delete activePoint 
      this.activePoints.delete(e.pointerId)
    }
  
    handlePinchZoom(activePoints: Map<number, Point>, canvasState: CanvasState) {
      if (activePoints?.size < 2) return
      const [firstPoint, secondPoint] = [...activePoints.values()]
      const newDistance = this.getDistance(firstPoint, secondPoint)
      const midpoint = this.getMidpoint(firstPoint, secondPoint)
      if (this.lastDistance) {
        this.newDistance = newDistance
        this.mobileZoom({
          lastDistance: this.lastDistance,
          newDistance: this.newDistance, canvasState,
          midpoint,
          oldScale: this.lastCanvasScale
        })
      } else {
        this.lastDistance = newDistance
        this.lastCanvasScale = canvasState.scale
      }
    }
  
    handlePan(lastPointPosition: Point, currentPointPosition: Point, canvasState: CanvasState) {
      const movedX = currentPointPosition.x - lastPointPosition.x
      const movedY = currentPointPosition.y - lastPointPosition.y
  
      canvasState.offset.x += movedX
      canvasState.offset.y += movedY
  
      this.lastPointPosition = currentPointPosition
    }
  
  
    getDistance(p1: Point, p2: Point) {
      // 1️⃣ Find the difference between x-coordinates
      const dx = p2.x - p1.x;
  
      // 2️⃣ Find the difference between y-coordinates
      const dy = p2.y - p1.y;
  
      // 3️⃣ Square both differences
      const dxSquared = dx * dx;
      const dySquared = dy * dy;
  
      // 4️⃣ Add them together
      const sum = dxSquared + dySquared;
  
      // 5️⃣ Take the square root to get the final distance
      const distance = Math.sqrt(sum);
  
      return distance;
    }
  
    getMidpoint(p1: Point, p2: Point) {
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; // Midpoint
    }
  
    mobileZoom({ lastDistance,
      newDistance,
      canvasState,
      midpoint,
      oldScale }: {
        lastDistance: number,
        newDistance: number,
        canvasState: CanvasState,
        midpoint: Point,
        oldScale: number
      }) {
      const scaleFactor = newDistance / lastDistance
      const newScale = scaleFactor * oldScale
  
      const clampedNewScale = Math.max(0.1, Math.min(5, newScale));
  
      // Convert the screen midpoint (between two fingers) into world coordinates
      // This ensures zooming is centered around the fingers, not the top-left corner
      const worldX = (midpoint.x - canvasState.offset.x) / canvasState.scale;
      const worldY = (midpoint.y - canvasState.offset.y) / canvasState.scale;
  
      // Adjust pan so that after zooming, the midpoint stays fixed under the fingers
      // Without this step, zoom would always be from (0,0) instead of the pinch point
      canvasState.offset.x = midpoint.x - worldX * clampedNewScale;
      canvasState.offset.y = midpoint.y - worldY * clampedNewScale;
  
      canvasState.scale = clampedNewScale
  
      console.log({
        scaleFactor,
        newScale,
        clampedNewScale,
        lastDistance,
        newDistance
      })
  
    }
  
  }
  