// ---------- Types ----------
type PenType =  "pencil" | "highlighter";

export interface Pen {
  color: string;
  type: PenType;
  size: number ;
}

export interface Point  {
  x: number;
  y: number;
};

export interface Tool {
    name: string;
    onPointerDown: (e: PointerEvent, canvasState: CanvasState, appState: AppState) => void;
    onPointerMove: (e: PointerEvent, canvasState: CanvasState, appState: AppState) => void;
    onPointerUp: (e: PointerEvent, canvasState: CanvasState) => void;
    renderOverlay?: (ctx: CanvasRenderingContext2D, canvasState: CanvasState) => void;
}

export interface Freehand {
    points: Point[];
    pen: Pen
}

export interface CanvasState {
    device: "mobile" | "desktop";
    scale: number;
    offset: { x: number; y: number };
    currentPath: Freehand | null;
    // pen
    paths: Freehand[];
}

export interface AppState{
  grid: boolean;
  //
  pen: Pen
}