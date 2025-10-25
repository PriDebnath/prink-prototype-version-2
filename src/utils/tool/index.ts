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
        this.brush?.onStrokeStart({ e, points: [world], canvasState, ctx, appState });

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
        
        // 🚀 PERFORMANCE: Distance filtering to reduce point density
        const lastPoint = canvasState.currentPath.points[canvasState.currentPath.points.length - 1];
        if (lastPoint) {
            const dx = world.x - lastPoint.x;
            const dy = world.y - lastPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only add point if moved at least 2 pixels (reduces points by ~80%)
            if (distance < 2) return;
        }
        
        canvasState.currentPath.points.push(world);
        
        // 🚀 PERFORMANCE: Remove double rendering - let the drawing loop handle it
        // The brush will be called during the drawing loop, not here
    }

    onPointerUp(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params

        if (!this.drawing) return;
        this.drawing = false;
        const world = this.toWorld(e, canvasState);
        if (!canvasState.currentPath) return;
        
        // Add the final point if it's not already there
        if (canvasState.currentPath.points.length === 0 || 
            canvasState.currentPath.points[canvasState.currentPath.points.length - 1] !== world) {
            canvasState.currentPath.points.push(world);
        }
        
        // 🚀 PERFORMANCE: Remove brush call here - let drawing loop handle final rendering
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
      // console.log('pan tool onPointerDown', e, canvasState);
      if (e.button !== 0) return;
  
      const pointPosition = { x: e.clientX, y: e.clientY };
      this.lastPointPosition = pointPosition
      //@1 Store this pointer's initial position
      this.activePoints = this.activePoints.set(e.pointerId, pointPosition)
    }
  
    onPointerMove(params: ToolEventsParams) {
      const { e, canvasState } = params
      // console.log('pan tool onPointerMove');
      if (!this.lastPointPosition || !this.activePoints.has(e.pointerId)) return
      // console.log({ canvasState, lastPointPosition: this.lastPointPosition });
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
      // console.log('pan tool onPointerUp', e, canvasState);
  
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
  

  export class LassoTool extends BaseTool {
    name: string = 'lasso';

      dragging: boolean = false;
      startPoint: Point | null = null;
    
      onPointerDown(params: ToolEventsParams) {
        const { e, canvasState, appState } = params
        if (e.button !== 0) return;
    
        // console.log("onPointerDown   select", canvasState);
        const world = this.toWorld(e, canvasState);
        // after we get selected ids,
        // check if user clicked on selected ids or not,
        // if yes meaning user want to drag it
        if (canvasState.selectedIds && canvasState.selectedIds.length > 0) {
          const selectedPens = canvasState.paths.filter((pen) =>
            canvasState.selectedIds!.includes(pen.id)
          );
    
          // scale threshold with canvas scale (so 8px on screen remains ~8px regardless of zoom)
          const pixelThreshold = (penSize?: number) => {
            console.log({ penSize })
            const base = penSize ?? appState.pen.size ?? 24;
            const scale = canvasState.scale ?? 1;
            return base / scale;
          };
    
          // detect if clicked on any selected pen stroke
          const clickedSelectedItem = selectedPens.some((pen) => {
            console.log({ clickedSelectedItem: pen })
            return this.isPointNearStroke(world, pen.points, pixelThreshold(pen.pen.size))
          });
    
          if (clickedSelectedItem) {
            this.dragging = true;
            this.startPoint = world;
          }
    
          console.log({ selectedPens, clickedSelectedItem });
        }
    
        console.log({ dragging: this.dragging, ids: canvasState.selectedIds, canvasState });
    
        if (!this.dragging) {
          // start lasso selection
          canvasState.lasso = [];
          canvasState.lasso.push(world);
          this.startPoint = null;
        }
      }
    
      onPointerMove(params: ToolEventsParams) {
        const { e, canvasState, appState } = params
        // keep this log but it can be noisy
        // console.log("onPointerMove   select", this, canvasState);
    
        const world = this.toWorld(e, canvasState);
    
        // dragging selected shapes
        if (canvasState?.selectedIds && this.dragging && this.startPoint) {
          const dx = world.x - this.startPoint.x;
          const dy = world.y - this.startPoint.y;
          
          // 🚀 PERFORMANCE: Move selected paths directly in the array
          for (let i = 0; i < canvasState.paths.length; i++) {
            const pen = canvasState.paths[i];
            if (canvasState.selectedIds.includes(pen.id)) {
              // Move the points of this selected path
              canvasState.paths[i] = {
                ...pen,
                points: pen.points.map((p: Point) => ({ x: p.x + dx, y: p.y + dy }))
              };
            }
          }
    
          // update startPoint so next move uses delta from here
          this.startPoint = world;
          canvasState.lasso = [];
        }
    
        // otherwise, build the lasso
        else if (!this.dragging) {
          //canvasState.lasso = [];
          canvasState.lasso?.push(world);
        }
      }
    
      onPointerUp(params: ToolEventsParams) {
        const { e, canvasState } = params
        e.preventDefault?.();
        e.stopPropagation?.();
        // release pointer capture
        try {
          (e.target as Element)?.releasePointerCapture?.(e.pointerId);
        } catch (err) {
          // ignore
        }
        // console.log("onPointerUp   select", canvasState);
    
        // If we were dragging, just end drag and keep selection
        if (this.dragging) {
          this.dragging = false;
          this.startPoint = null;
          canvasState.lasso = [];
    
          return;
        }
    
        // Lasso selection
        const lasso = canvasState.lasso;
        if (!lasso || lasso.length < 3) {
          // no meaningful lasso -> nothing to do
          canvasState.lasso = [];
          return;
        }
    
        // ensure closed polygon for pointInPolygon
        if (lasso[0].x !== lasso[lasso.length - 1].x || lasso[0].y !== lasso[lasso.length - 1].y) {
          lasso.push({ ...lasso[0] });
        }
    
        const selectedIds: number[] = [];
    
        for (const pen of canvasState.paths) {
          // select if any point of the stroke lies inside the lasso polygon
          const anyPointInside = pen.points.some((pt) => this.pointInPolygon(pt, lasso));
          if (anyPointInside) selectedIds.push(pen.id);
        }
    
        canvasState.selectedIds = selectedIds;
        canvasState.lasso = [];
        this.dragging = false;
        this.startPoint = null;
      }
    
      pointInPolygon(point: Point, polygon: Point[]): boolean {
        let inside = false;
        const { x, y } = point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x, yi = polygon[i].y;
          const xj = polygon[j].x, yj = polygon[j].y;
    
          const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }
    
      private isPointNearStroke(point: Point, stroke: Point[], threshold = 5): boolean {
        if (!stroke || stroke.length < 2) return false;
        for (let i = 0; i < stroke.length - 1; i++) {
          const a = stroke[i];
          const b = stroke[i + 1];
          const dist = this.pointToSegmentDistance(point, a, b);
          if (dist <= threshold) return true;
        }
        return false;
      }
    
      private pointToSegmentDistance(p: Point, a: Point, b: Point): number {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) {
          const dxp = p.x - a.x;
          const dyp = p.y - a.y;
          return Math.sqrt(dxp * dxp + dyp * dyp);
        }
        let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = a.x + t * dx;
        const projY = a.y + t * dy;
        const dxp = p.x - projX;
        const dyp = p.y - projY;
        return Math.sqrt(dxp * dxp + dyp * dyp);
      }

      // Helper method to check if two paths overlap spatially
      private pathsOverlap(path1: Freehand, path2: Freehand): boolean {
        if (!path1.points.length || !path2.points.length) return false;
        
        // Get bounding boxes for both paths
        const getBounds = (points: Point[]) => {
          const xs = points.map(p => p.x);
          const ys = points.map(p => p.y);
          return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
          };
        };
        
        const bounds1 = getBounds(path1.points);
        const bounds2 = getBounds(path2.points);
        
        // Check if bounding boxes overlap
        return !(bounds1.maxX < bounds2.minX || 
                 bounds2.maxX < bounds1.minX || 
                 bounds1.maxY < bounds2.minY || 
                 bounds2.maxY < bounds1.minY);
      }
    }
    

