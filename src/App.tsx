import { useRef, useEffect, useState } from "react";
import type { Tool, CanvasState } from './types';
import { PenTool, PanTool } from './tools';
import { draw } from './utils/drawing';

// ---------- App ----------
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>(new PenTool());
  const canvasStateRef = useRef<CanvasState>({ scale: 1, offset: { x: 0, y: 0 }, paths: [], currentPath: null });

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

  // ---------- Resize ----------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, background: "rgba(255,255,255,0.9)", padding: "6px 10px", borderRadius: 12 }}>
        <button
          onClick={() => setActiveTool(new PenTool())}
          style={{
            padding: 8,
            background: activeTool.name === 'pen' ? "#333" : "#eee",
            color: activeTool.name === 'pen' ? "#fff" : "#333",
            borderRadius: 8
          }}>✏️ Pen
        </button>
        <button
          onClick={() => setActiveTool(new PanTool())}
          style={{
            padding: 8,
            background: activeTool.name === 'pan' ? "#333" : "#eee",
            color: activeTool.name === 'pan' ? "#fff" : "#333",
            borderRadius: 8
          }}>✋ Pan
        </button>
      </div>
    </div>
  );
}
