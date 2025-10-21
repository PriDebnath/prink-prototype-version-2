// ---------- Tools ----------

// ---------- Tools ----------
import type { Tool, Point, CanvasState, AppState, Freehand } from '../types';

abstract class BaseTool implements Tool {
  name = "base";
  onPointerDown(e: PointerEvent, canvasState: CanvasState, appState: AppState) { };
  onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) { };
  onPointerUp(e: PointerEvent, canvasState: CanvasState) { };
  renderOverlay(ctx: CanvasRenderingContext2D, canvasState: CanvasState) { }

  public toWorld(e: PointerEvent, canvasState: CanvasState): Point {
    return {
      x: (e.clientX - canvasState.offset.x) / canvasState.scale,
      y: (e.clientY - canvasState.offset.y) / canvasState.scale,
    };
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

  onPointerDown(e: PointerEvent, canvasState: CanvasState) {
    console.log('pan tool onPointerDown', e, canvasState);
    if (e.button !== 0) return;

    const pointPosition = { x: e.clientX, y: e.clientY };
    this.lastPointPosition = pointPosition
    //@1 Store this pointer's initial position
    this.activePoints = this.activePoints.set(e.pointerId, pointPosition)
  }

  onPointerMove(e: PointerEvent, canvasState: CanvasState) {
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

  onPointerUp(e: PointerEvent, canvasState: CanvasState) {
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

export class PenTool extends BaseTool {
  name: string = 'pen';
  private drawing = false;
  private lastTime = 0;
  private sprayInterval = 16; // ~60fps for airbrush continuous spray

  onPointerDown(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
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

  onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
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


export class LassoTool extends BaseTool {
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

  onPointerMove(e: PointerEvent, canvasState: CanvasState, appState: AppState) {
    // keep this log but it can be noisy
    // console.log("onPointerMove   select", this, canvasState);

    const world = this.toWorld(e, canvasState);

    // dragging selected shapes
    if (canvasState?.selectedIds && this.dragging && this.startPoint) {
      const dx = world.x - this.startPoint.x;
      const dy = world.y - this.startPoint.y;
      console.log({ dy, dx })
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
      canvasState.lasso = [];
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
    console.log("onPointerUp   select", canvasState);

    // If we were dragging, just end drag and keep selection
    if (this.dragging) {
      this.dragging = false;
      this.startPoint = null;
      console.log("was dragf")
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