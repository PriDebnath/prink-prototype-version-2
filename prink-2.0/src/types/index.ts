// ---------- Types ----------
import { Button, type ButtonKeys } from "../components/button";

type PenType =  "pencil" | "highlighter" | "airbrush" | "eraser";

export interface Pen {
  color: string;
  type: PenType;
  size: number;
  opacity?: number; // For airbrush opacity control
}

export interface Point  {
  x: number;
  y: number;
};

export interface ToolEventsParams {
  e: PointerEvent,
  appState: AppState,
  canvasState: CanvasState,
  canvas: HTMLCanvasElement,
}

export interface Tool {
    name: string;
    onPointerDown: (params: ToolEventsParams) => void;
    onPointerMove: (params: ToolEventsParams) => void;
    onPointerUp: (params: ToolEventsParams) => void;
    renderOverlay: (params: ToolEventsParams) => void;
}

export interface FreehandEventsParams {
  e: PointerEvent,
  points: Point[],
  canvasState: CanvasState,
  ctx: CanvasRenderingContext2D,
  appState: AppState,
}

export interface Freehand {
    id: number;
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
    // selection 
    lasso: Point[] | null;
    selectedIds: number[];
}

export interface AppState{
  grid: boolean;
  openSettings: boolean;
  //
  pen: Pen
  selectedTheme: ThemeName | null;
}


export type ThemeName = "Apricity" | "Inkflow" | "Coral Splash" | "Graphite" | "Aurora Prink" | "Sunset Paper";


export interface Theme {
  id: string;
  name: ThemeName;
  desc: string;
  colors: {
    bgs: string[];
    surface: string;
    text: string;
    accent: string;
    muted: string;
  }
}
