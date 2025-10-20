import type { CanvasState, Freehand } from "../../types";

// Simple demo presets keyed by canvasId
// Extend as needed with more shapes/paths
const demoStroke = (id: number, color: string, size: number, points: { x: number; y: number }[]): Freehand => ({
  id,
  pen: { type: "pencil", color, size },
  points,
});

export const CANVAS_PRESETS: Record<string, Partial<CanvasState>> = {
  "welcome": {
    scale: 1,
    offset: { x: 0, y: 0 },
    // Draw "wellcome" with simple pen strokes
    paths: [
      // w
      demoStroke(1, "#111827", 8, [
        { x: 80, y: 200 }, { x: 90, y: 240 }, { x: 100, y: 200 }, { x: 110, y: 240 }, { x: 120, y: 200 }
      ]),
      // e
      demoStroke(2, "#111827", 8, [
        { x: 140, y: 220 }, { x: 160, y: 220 }, { x: 165, y: 210 }, { x: 160, y: 200 }, { x: 145, y: 200 }, { x: 140, y: 210 }, { x: 150, y: 220 }
      ]),
      // l
      demoStroke(3, "#111827", 8, [
        { x: 180, y: 180 }, { x: 180, y: 230 }
      ]),
      // l
      demoStroke(4, "#111827", 8, [
        { x: 200, y: 180 }, { x: 200, y: 230 }
      ]),
      // c
      demoStroke(5, "#111827", 8, [
        { x: 235, y: 210 }, { x: 225, y: 200 }, { x: 215, y: 205 }, { x: 215, y: 220 }, { x: 225, y: 225 }
      ]),
      // o
      demoStroke(6, "#111827", 8, [
        { x: 260, y: 210 }, { x: 270, y: 200 }, { x: 285, y: 210 }, { x: 275, y: 225 }, { x: 260, y: 215 }, { x: 260, y: 210 }
      ]),
      // m
      demoStroke(7, "#111827", 8, [
        { x: 305, y: 230 }, { x: 305, y: 200 }, { x: 315, y: 210 }, { x: 325, y: 200 }, { x: 325, y: 230 }
      ]),
      // e
      demoStroke(8, "#111827", 8, [
        { x: 350, y: 220 }, { x: 370, y: 220 }, { x: 375, y: 210 }, { x: 370, y: 200 }, { x: 355, y: 200 }, { x: 350, y: 210 }, { x: 360, y: 220 }
      ]),
    ],
  },
  "grid-demo": {
    scale: 1,
    offset: { x: 0, y: 0 },
    paths: [
      demoStroke(1, "#F59E0B", 8, [
        { x: 80, y: 80 },
        { x: 120, y: 120 },
        { x: 160, y: 80 },
        { x: 200, y: 120 },
        { x: 240, y: 80 },
      ]),
    ],
  },
};


