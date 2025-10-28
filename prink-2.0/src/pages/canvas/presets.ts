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
    paths: [
      demoStroke(1, "#111827", 5, [
        // W
        { x: 40, y: 140 },
        { x: 52, y: 180 },
        { x: 64, y: 140 },
        { x: 76, y: 180 },
        { x: 88, y: 140 },
        { x: 100, y: 180 },
    
        // move slightly to start e
        { x: 115, y: 165 },
        { x: 125, y: 155 },
        { x: 140, y: 160 },
        { x: 135, y: 170 },
        { x: 125, y: 170 },
        { x: 150, y: 165 },
    
        // l
        { x: 160, y: 130 },
        { x: 160, y: 190 },
    
        // c
        { x: 175, y: 165 },
        { x: 190, y: 150 },
        { x: 210, y: 150 },
        { x: 225, y: 165 },
        { x: 210, y: 180 },
        { x: 190, y: 180 },
    
        // o
        { x: 240, y: 165 },
        { x: 255, y: 150 },
        { x: 275, y: 150 },
        { x: 290, y: 165 },
        { x: 275, y: 185 },
        { x: 255, y: 185 },
        { x: 240, y: 165 },
    
        // m
        { x: 305, y: 185 },
        { x: 305, y: 150 },
        { x: 320, y: 175 },
        { x: 335, y: 150 },
        { x: 350, y: 175 },
        { x: 365, y: 150 },
        { x: 380, y: 185 },
    
        // e
        { x: 395, y: 165 },
        { x: 410, y: 155 },
        { x: 425, y: 160 },
        { x: 420, y: 170 },
        { x: 410, y: 170 },
        { x: 430, y: 165 }
      ])
    ]    
  },
};


