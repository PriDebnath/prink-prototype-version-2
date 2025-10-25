// brushes/BaseBrush.ts
import type { Point, Pen, CanvasState, FreehandEventsParams } from "../../types";

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
    
    const from = points[points.length - 2];
    const to = points[points.length - 1];
    console.log("moving in pencil brush");
    ctx.strokeStyle = this.pen.color;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = this.pen.opacity ?? 1;
    ctx.lineTo(to.x, to.y);
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
  private minDistance = 10; // Distance threshold for airbrush particles

  onStrokeStart(params: FreehandEventsParams) {
    const { points } = params;
    this.lastDrawn = null;
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length === 0) return;
    
    const to = points[points.length - 1];
    console.log("moving in airbrush brush");
    // Skip if the point is too close to the previous drawn point
    if (this.lastDrawn) {
      const dx = to.x - this.lastDrawn.x;
      const dy = to.y - this.lastDrawn.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.minDistance) {
        return;
      }
    }
    
    ctx.save();
    
    // Create radial gradient from center to edge
    const gradient = ctx.createRadialGradient(
      to.x, to.y, 0,
      to.x, to.y, this.pen.size / 2
    );
    
    const { color: penColor, opacity = 0.3 } = this.pen;

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
    ctx.beginPath();
    ctx.arc(to.x, to.y, this.pen.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Update last drawn point
    this.lastDrawn = to;
  }

  onStrokeEnd(params: FreehandEventsParams) {
    this.lastDrawn = null;
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
  }

  private showEraserPreview(ctx: CanvasRenderingContext2D, point: { x: number; y: number }) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    
    // Draw red circle preview
    ctx.beginPath();
    ctx.arc(point.x, point.y, this.pen.size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    
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

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
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
    
    const to = points[points.length - 1];
    console.log("moving in highlighter brush");
    // Use lightened color for highlighter effect
    const lightenedColor = this.getLightenColor(this.pen.color);
    ctx.strokeStyle = lightenedColor;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.3; // Semi-transparent for highlighter effect
    ctx.lineTo(to.x, to.y);
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
    console.log("moving in smooth brush");
    // Only render if we have enough points for smoothing
    if (points.length >= 2) {
      this.renderSmoothPath(ctx, points);
    }
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx, points } = params;
    if (points.length >= 2) {
      this.renderSmoothPath(ctx, points);
    }
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

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
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
    switch (pen.type) {
      case "pencil": return new SmoothBrush(pen); // Use smooth brush for pencil
      case "airbrush": return new AirbrushBrush(pen);
      case "highlighter": return new HighlighterBrush(pen);
      case "eraser": return new EraserBrush(pen);
      default: return new SmoothBrush(pen); // fallback to smooth brush
    }
  }
}