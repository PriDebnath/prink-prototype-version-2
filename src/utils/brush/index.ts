// brushes/BaseBrush.ts
import type { Point, Pen, CanvasState, FreehandEventsParams } from "../../types";
import { pointPool } from "../performance/PointPool";

export abstract class BaseBrush {
  constructor(pen: Pen) {
    this.pen = pen;
  }
  protected pen: Pen;

  // Each brush defines how it starts, continues, and ends a stroke.
  abstract onStrokeStart(params: FreehandEventsParams): void;
  abstract onStrokeMove(params: FreehandEventsParams): void;
  abstract onStrokeEnd(params: FreehandEventsParams): void;
}

// brushes/PencilBrush.ts
//import { BaseBrush } from "./BaseBrush";

export class PencilBrush extends BaseBrush {
  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length < 2) return;
    
    // 🚀 PERFORMANCE: Render entire path at once instead of incremental
    ctx.strokeStyle = this.pen.color;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = this.pen.opacity ?? 1;
    
    // Draw the entire path in one stroke
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx } = params;
    ctx.closePath();
    ctx.restore();
  }
}

// brushes/AirbrushBrush.ts
//import { BaseBrush } from "./BaseBrush";

export class AirbrushBrush extends BaseBrush {
  private lastDrawn: { x: number; y: number } | null = null;
  private minDistance = 5; // Distance threshold for airbrush particles
  
  // 🚀 PERFORMANCE: Pre-computed gradient cache
  private gradientCache = new Map<string, CanvasGradient>();

  onStrokeStart(params: FreehandEventsParams) {
    const { points } = params;
    this.lastDrawn = null;
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    ctx.save();
    
    // Process each point and fill gaps when mouse moves too far
    for (const pt of points) {
      if (this.lastDrawn) {
        const dx = pt.x - this.lastDrawn.x;
        const dy = pt.y - this.lastDrawn.y;
        const dist = Math.hypot(dx, dy);
        
        // If distance is too large, interpolate dots to fill the gap
        if (dist > this.minDistance) {
          const steps = Math.ceil(dist / this.minDistance);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = this.lastDrawn.x + dx * t;
            const y = this.lastDrawn.y + dy * t;
            // 🚀 PERFORMANCE: Use pooled point for interpolation
            const interpolatedPoint = pointPool.getPoint(x, y);
            this.drawSoftCircle({ x: interpolatedPoint.x, y: interpolatedPoint.y, pen: this.pen, ctx });
            pointPool.releasePoint(interpolatedPoint);
          }
        } else {
          // Normal case: just draw at current point
          this.drawSoftCircle({ x: pt.x, y: pt.y, pen: this.pen, ctx });
        }
      } else {
        // First point
        this.drawSoftCircle({ x: pt.x, y: pt.y, pen: this.pen, ctx });
      }
      
      this.lastDrawn = pt;
    }
    
    ctx.restore();
  }

  onStrokeEnd(params: FreehandEventsParams) {
    this.lastDrawn = null;
  }

   drawSoftCircle({ x, y, pen ,ctx}: { x: number; y: number; pen: Pen; ctx: CanvasRenderingContext2D }) {
    const { color, opacity = 0.3, size } = pen;
    
    // 🚀 PERFORMANCE: Use cached gradient instead of creating new one each time
    const gradientKey = `${color}-${opacity}-${size}`;
    let grad = this.gradientCache.get(gradientKey);
    
    if (!grad) {
      const toHex = (val: number) => Math.round(val * 255).toString(16).padStart(2, '0');
      grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
      grad.addColorStop(0, `${color}${toHex(opacity)}`); // center strong
      grad.addColorStop(1, `${color}${toHex(0)}`);       // edge fades out
      this.gradientCache.set(gradientKey, grad);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


// brushes/EraserBrush.ts
//import { BaseBrush } from "./BaseBrush";

export class EraserBrush extends BaseBrush {
  private isErasing = false;

  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    this.isErasing = true;
    
    // Show eraser preview circle
    this.showEraserPreview(ctx, points[points.length - 1]);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    // Show eraser preview at current position
    this.showEraserPreview(ctx, points[points.length - 1]);
    
    // Actually erase the content
    this.performErase(ctx, points);
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (this.isErasing) {
      this.isErasing = false;
    }
    
    // Final erase operation
    if (points.length >= 2) {
      this.performErase(ctx, points);
    }
    
    // Clean up the red preview circle by clearing the area where it was drawn
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, this.pen.size / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private showEraserPreview(ctx: CanvasRenderingContext2D, point: { x: number; y: number }) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, this.pen.size / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4444";
    ctx.globalAlpha = 0.3;
    ctx.fill();
    
    ctx.restore();
  }

  private performErase(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    
    this.renderSmoothEraserPath(ctx, points);
    
    ctx.restore();
  }

  private renderSmoothEraserPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    if (points.length === 0) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      // 🚀 PERFORMANCE: Use pooled points for eraser control points
      const cp1 = pointPool.getPoint(
        p1.x + (p2.x - p0.x) / 6,
        p1.y + (p2.y - p0.y) / 6
      );
      const cp2 = pointPool.getPoint(
        p2.x - (p3.x - p1.x) / 6,
        p2.y - (p3.y - p1.y) / 6
      );

      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
      
      // Return pooled points
      pointPool.releasePoint(cp1);
      pointPool.releasePoint(cp2);
    }

    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

// brushes/HighlighterBrush.ts
export class HighlighterBrush extends BaseBrush {
  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length < 2) return;
    
    // 🚀 PERFORMANCE: Render entire highlighter path at once
    const lightenedColor = this.getLightenColor(this.pen.color);
    ctx.strokeStyle = lightenedColor;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.3; // Semi-transparent for highlighter effect
    
    // Draw the entire path in one stroke
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx } = params;
    ctx.closePath();
    ctx.restore();
  }

  // Helper function to lighten colors (similar to getLightenColor from helpers)
  private getLightenColor(color: string): string {
    // Simple lightening by adding white
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * 0.3));
    
    const newR = lighten(r);
    const newG = lighten(g);
    const newB = lighten(b);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// brushes/SmoothBrush.ts - Uses Catmull-Rom to Bezier smoothing
export class SmoothBrush extends BaseBrush {
  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    // 🚀 PERFORMANCE: Render entire smooth path at once
    if (points.length >= 2) {
      this.renderSmoothPath(ctx, points);
    }
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx, points } = params;
    // 🚀 PERFORMANCE: Don't render again - already rendered in onStrokeMove
    // This prevents duplicate rendering
    ctx.restore();
  }

  private renderSmoothPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      // 🚀 PERFORMANCE: Use pooled points for control point calculations
      const cp1 = pointPool.getPoint(
        p1.x + (p2.x - p0.x) / 6,
        p1.y + (p2.y - p0.y) / 6
      );
      const cp2 = pointPool.getPoint(
        p2.x - (p3.x - p1.x) / 6,
        p2.y - (p3.y - p1.y) / 6
      );

      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
      
      // Return pooled points
      pointPool.releasePoint(cp1);
      pointPool.releasePoint(cp2);
    }

    ctx.strokeStyle = this.pen.color;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = this.pen.opacity ?? 1;
    ctx.stroke();
  }
}

export class BrushFactory {
  static createBrush(pen: Pen): BaseBrush {
    // 🚀 PERFORMANCE: Direct brush creation without caching overhead
    switch (pen.type) {
      case "pencil": return new SmoothBrush(pen);
      case "airbrush": return new AirbrushBrush(pen);
      case "highlighter": return new HighlighterBrush(pen);
      case "eraser": return new EraserBrush(pen);
      default: return new SmoothBrush(pen);
    }
  }
}