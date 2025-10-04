// ---------- Types ----------

export type Point = { x: number; y: number };

export interface Tool {
    name: string;
    onPointerDown: (e: PointerEvent, canvasState: CanvasState) => void;
    onPointerMove: (e: PointerEvent, canvasState: CanvasState) => void;
    onPointerUp: (e: PointerEvent, canvasState: CanvasState) => void;
    renderOverlay?: (ctx: CanvasRenderingContext2D, canvasState: CanvasState) => void;
}


export interface Freehand {
    points: Point[];
}


export interface CanvasState {
    device: "mobile" | "desktop";
    scale: number;
    offset: { x: number; y: number };
    paths: Freehand[];
    currentPath: Freehand | null;
}

export interface AppState{
  grid: boolean
}