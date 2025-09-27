// ---------- Tools ----------

  // ---------- Tools ----------
import type { Tool, Point, CanvasState } from '../types';

export { PanTool, PenTool };


// ---------- Pan Tool ----------
class PanTool implements Tool {
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
  class PenTool implements Tool {
    name: string = 'pen';
    private drawing = false;
    onPointerDown(e: PointerEvent, canvasState: CanvasState) {
      if (e.button !== 0) return;
      this.drawing = true;
      const world = PenTool.toWorld(e, canvasState);
      canvasState.currentPath = { points: [world] };
      canvasState.paths.push(canvasState.currentPath);
    }
    onPointerMove(e: PointerEvent, canvasState: CanvasState) {
      if (!this.drawing || !canvasState.currentPath) return;
      const world = PenTool.toWorld(e, canvasState);
      canvasState.currentPath.points.push(world);
    }
    onPointerUp(e: PointerEvent, canvasState: CanvasState) {
      this.drawing = false;
      canvasState.currentPath = null;
    }
    static toWorld(e: PointerEvent, canvasState: CanvasState) {
      return {
        x: (e.clientX - canvasState.offset.x) / canvasState.scale,
        y: (e.clientY - canvasState.offset.y) / canvasState.scale,
      };
    }
  }
  