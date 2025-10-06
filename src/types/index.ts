// ---------- Types ----------
type PenType =  "pencil" | "highlighter";
export type Point = {
  x: number;
  y: number;
  color: string;
  type: PenType;
  size: number ;
};

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
    currentPath: Freehand | null;
    
    // pen
    paths: Freehand[];
    
}

export interface AppState{
  grid: boolean;
  //
  pen: 
  { 
    type: PenType;
    color: string;
    size: number;
  }
  
}