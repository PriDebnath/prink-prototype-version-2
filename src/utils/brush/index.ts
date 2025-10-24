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
    const { ctx, from } = params;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, from, to } = params;
    ctx.strokeStyle = this.pen.color;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx } = params;
    ctx.closePath();
  }
}

// brushes/AirbrushBrush.ts
//import { BaseBrush } from "./BaseBrush";

export class AirbrushBrush extends BaseBrush {
  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, from } = params;
    // nothing special here
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, from, to } = params;
    const radius = this.pen.size;
    const gradient = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, radius);
    gradient.addColorStop(0, this.pen.color);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.globalAlpha = this.pen.opacity ?? 0.2;
    ctx.beginPath();
    ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx } = params;
    ctx.closePath();
  }
}


// brushes/EraserBrush.ts
//import { BaseBrush } from "./BaseBrush";

export class EraserBrush extends BaseBrush {
  onStrokeStart(params: FreehandEventsParams) {
    const { ctx, from } = params;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
  }

  onStrokeMove(params: FreehandEventsParams) {
    const { ctx, from, to } = params;
    ctx.lineWidth = this.pen.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  onStrokeEnd(params: FreehandEventsParams) {
    const { ctx } = params;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  }
}

export class BrushFactory {
  static createBrush(pen: Pen): BaseBrush {
    switch (pen.type) {
      case "pencil": return new PencilBrush(pen);
      case "airbrush": return new AirbrushBrush(pen);
      default: return new PencilBrush(pen); // fallback
    }
  }
}