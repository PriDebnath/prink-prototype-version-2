import React, { useRef, useEffect, useState } from "react";
import type { Tool, CanvasState } from './types';
import { PenTool, PanTool } from './tools';

// ---------- App ----------
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>(new PenTool());
  const canvasStateRef = useRef<CanvasState>({ scale: 1, offset: { x: 0, y: 0 }, paths: [], currentPath: null });

  // ---------- Render Loop ----------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      const state = canvasStateRef.current;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Draw grid with slight movement for infinite panning feel
      const gridSize = 50;
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      const offsetX = state.offset.x % gridSize;
      const offsetY = state.offset.y % gridSize;
      for (let x = -gridSize + offsetX; x < canvas.clientWidth; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.clientHeight); ctx.stroke();
      }
      for (let y = -gridSize + offsetY; y < canvas.clientHeight; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.clientWidth, y); ctx.stroke();
      }

      // Transform and draw paths
      ctx.save();
      ctx.translate(state.offset.x, state.offset.y);
      ctx.scale(state.scale, state.scale);

      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#000"; ctx.lineWidth = 2 / state.scale;
      for (const path of state.paths) {
        if (path.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length - 1; i++) {
          const midX = (path.points[i].x + path.points[i + 1].x) / 2;
          const midY = (path.points[i].y + path.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, midX, midY);
        }
        ctx.stroke();
      }

      if (activeTool.renderOverlay) activeTool.renderOverlay(ctx, canvasStateRef.current);
      ctx.restore();
      requestAnimationFrame(draw);
    };
    draw();
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
        <button onClick={() => setActiveTool(new PenTool())} style={{ padding: 8, background: activeTool instanceof PenTool ? "#333" : "#eee", color: activeTool instanceof PenTool ? "#fff" : "#333", borderRadius: 8 }}>✏️ Pen</button>
        <button onClick={() => setActiveTool(new PanTool())} style={{ padding: 8, background: activeTool instanceof PanTool ? "#333" : "#eee", color: activeTool instanceof PanTool ? "#fff" : "#333", borderRadius: 8 }}>✋ Pan</button>
      </div>
    </div>
  );
}
