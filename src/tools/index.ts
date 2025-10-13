// ---------- Tools ----------

  // ---------- Tools ----------
import type { Tool, Point, CanvasState , AppState} from '../types';

abstract class BaseTool implements Tool{
    name = "base";
    onPointerDown (e: PointerEvent, canvasState: CanvasState, appState: AppState){};
    onPointerMove (e: PointerEvent, canvasState: CanvasState, appState: AppState){};
    onPointerUp (e: PointerEvent, canvasState: CanvasState) {};
    renderOverlay (ctx: CanvasRenderingContext2D, canvasState: CanvasState){}

   public toWorld(e: PointerEvent, canvasState: CanvasState): Point {
    return {
      x: (e.clientX - canvasState.offset.x) / canvasState.scale,
      y: (e.clientY - canvasState.offset.y) / canvasState.scale,
    };
}

}

// ---------- Pan Tool ----------
export class PanTool extends BaseTool {
    name: string = 'pan';
    private isPanning = false;
    private last: Point | null = null;
    onPointerDown(e: PointerEvent, canvasState: CanvasState) {
      console.log('pan tool onPointerDown', e, canvasState);
      if (e.button !== 0) return;
      this.isPanning = true;
      this.last = { x: e.clientX, y: e.clientY };
    }
    onPointerMove(e: PointerEvent, canvasState: CanvasState) {
      console.log('pan tool onPointerMove', e, canvasState);
      if (!this.isPanning || !this.last) return;
      const dx = e.clientX - this.last.x;
      const dy = e.clientY - this.last.y;
      canvasState.offset.x += dx;
      canvasState.offset.y += dy;
      this.last = { x: e.clientX, y: e.clientY };
    }
    onPointerUp(e: PointerEvent, canvasState: CanvasState) {
      console.log('pan tool onPointerUp', e, canvasState);
      this.isPanning = false;
      this.last = null;
    }
  }
  
  // ---------- Pen Tool ----------
export  class PenTool extends BaseTool {
    name: string = 'pen';
    private drawing = false;
    onPointerDown(e: PointerEvent, canvasState: CanvasState,appState: AppState) {
      if (e.button !== 0) return;
      this.drawing = true;
      const world = this.toWorld(e, canvasState, );
      //  Making a currently changes object 
      //and pushing it to store,
      //later what change you will make in onMove will be store in this current item
      canvasState.currentPath = { 
        id: canvasState.paths.length+1,
        points: [world],
        pen: { ...appState.pen }
      };
      canvasState.paths.push(canvasState.currentPath);// 
  
    }
    
    onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
      if (!this.drawing || !canvasState.currentPath) return;
      const world = this.toWorld(e, canvasState);
      
      //console.log("moving", {pen: appState.pen})  
      const appPen = appState.pen
      //console.log({appPen})
      const pen = {
        ...world,
        ...appPen
      }
      //console.log({pen})
      canvasState.currentPath.points.push(world);
    }
    onPointerUp(e: PointerEvent, canvasState: CanvasState) {
      this.drawing = false;
      canvasState.currentPath = null;
    }
  }
  
  
export class SelectTool extends BaseTool {
  name: string = 'lasso';
  dragging: boolean = false;
  startPoint: Point | null = null;

  onPointerDown(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
    if (e.button !== 0) return;

    console.log("onPointerDown   select", canvasState);
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
        console.log({penSize})
        const base = penSize ?? appState.pen.size ?? 24;
        const scale = canvasState.scale ?? 1;
        return base / scale;
      };

      // detect if clicked on any selected pen stroke
      const clickedSelectedItem = selectedPens.some((pen) =>{
        console.log({clickedSelectedItem: pen})
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

  onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
    // keep this log but it can be noisy
    // console.log("onPointerMove   select", this, canvasState);

    const world = this.toWorld(e, canvasState);

    // dragging selected shapes
    if (canvasState?.selectedIds && this.dragging && this.startPoint) {
      const dx = world.x - this.startPoint.x;
      const dy = world.y - this.startPoint.y;
      console.log({dy, dx})
      // move only selected shapes by delta
      const moved = canvasState.paths.map((pen) => {
        if (canvasState.selectedIds!.includes(pen.id)) {
          const movedPoints = pen.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
          return { ...pen, points: movedPoints };
        }
        return pen;
      });

      canvasState.paths = moved;

      // update startPoint so next move uses delta from here
      this.startPoint = world;
    }

    // otherwise, build the lasso
    else if (!this.dragging) {
      //canvasState.lasso = [];
      canvasState.lasso?.push(world);
    }
  }

  onPointerUp(e: PointerEvent, canvasState: CanvasState) {
    e.preventDefault?.();
    e.stopPropagation?.();

    // release pointer capture
    try {
      (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore
    }

    console.log("onPointerUp   select");

    // If we were dragging, just end drag and keep selection
    if (this.dragging) {
      this.dragging = false;
      this.startPoint = null;
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
}
