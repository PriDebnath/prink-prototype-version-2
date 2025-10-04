import { useRef, useEffect, useState } from "react";
import type { Tool, CanvasState, AppState } from './types';
import { PenTool, PanTool, GridTool } from './tools';
import { draw } from './utils/drawing';
import { Button } from "./components/button";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { Topbar } from "./components/topbar";

// ---------- App ----------
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>(new PenTool());
  const canvasStateRef = useRef<CanvasState>({ device: "desktop", scale: 1, offset: { x: 0, y: 0 }, paths: [], currentPath: null, grid: true });
  const [ appState, setAppState] = useState<AppState>({grid: true})
  // ---------- Render Loop ----------
  useEffect(() => {
    const canvas = canvasRef.current!;
    draw({
      canvas,
      state: canvasStateRef.current,
      activeTool,
    });
  }, [activeTool]);

  // ---------- Pointer Events ----------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const handlePointerDown = (e: PointerEvent) => activeTool.onPointerDown(e, canvasStateRef.current);
    const handlePointerMove = (e: PointerEvent) => activeTool.onPointerMove(e, canvasStateRef.current);
    const handlePointerUp = (e: PointerEvent) => activeTool.onPointerUp(e, canvasStateRef.current);
    const handlePointerCancel = (e: PointerEvent) => activeTool.onPointerUp(e, canvasStateRef.current);
const handlePointerCan6ycel = (e: PointerEvent) => activeTool.onPointerUp(e, canvasStateRef.current);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [activeTool]);

  // -------------------- Resize --------------------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;

      // Match canvas internal resolution to its CSS size * DPR
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scaling
      ctx.scale(dpr, dpr);

      // Update "device" breakpoint state
      const device = window.innerWidth <= 768 ? "mobile" : "desktop";
      canvasStateRef.current.device = device;
    };

    // Prefer ResizeObserver
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      // Fallback for older browsers
      (window as Window).addEventListener("resize", resize);
    }

    resize(); // run once on mount

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize as () => void);
    };
  }, []);


  return (
    <main  >

      <canvas id="canvas" ref={canvasRef}  />

      <Topbar activeTool={activeTool} setActiveTool={setActiveTool} canvasState={canvasStateRef.current} appState={appState} setAppState={setAppState }    />
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />

      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} />

 

    </main>
  );
}
