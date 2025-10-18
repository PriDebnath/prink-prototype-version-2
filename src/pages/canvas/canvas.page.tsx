// App.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Tool, CanvasState, AppState } from "../../types";
import { PenTool } from "../../tools";
import { draw, startDrawingLoop, stopDrawingLoop } from "../../utils/drawing";
import { Topbar } from "../../components/topbar";
import { Sidebar } from "../../components/sidebar";
import { Toolbar } from "../../components/toolbar";
import SettingsDialog from "./settings.dialog"


export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>(new PenTool());
  const canvasStateRef = useRef<CanvasState>({
    device: "desktop",
    scale: 1,
    offset: { x: 0, y: 0 },
    paths: [],
    lasso: [],
    selectedIds: [],
    currentPath: null,
  });
  const [appState, setAppState] = useState<AppState>({ 
    grid: true,
    openSettings: true,
    pen: {
      type: "airbrush",
      color: "#000000",
      size: 80,
      stabilizer: 0.9,
    }
  });

  // Helpers to pass into draw utils so they read fresh values each frame
  const getters = {
    get canvas() {
      return canvasRef.current!;
    },
    getState: () => canvasStateRef.current,
    getActiveTool: () => activeTool,
    getAppState: () => appState,
  };

  // Resize handling + initial one-shot draw
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // update device breakpoint
      canvasStateRef.current.device = window.innerWidth <= 768 ? "mobile" : "desktop";

      // draw a single frame (we are not in continuous loop unless user is drawing)
      draw({
        canvas: canvasRef.current!,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    resize();

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []); // run once

  // Redraw one frame when appState (grid toggle, UI changes)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    draw({
      canvas: c,
      getState: getters.getState,
      getActiveTool: getters.getActiveTool,
      getAppState: getters.getAppState,
    });
  }, [appState]);

  // Pointer event handlers: start RAF loop on pointerdown, stop on up/cancel
  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const onDown = (e: PointerEvent) => {
      activeTool.onPointerDown(e, canvasStateRef.current, appState);
      // start continuous draw (from down -> move -> up)
      startDrawingLoop({
        canvas,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    const onMove = (e: PointerEvent) => {
      activeTool.onPointerMove(e, canvasStateRef.current, appState);
      // continuous loop is running so it will render updates
    };

    const onUp = (e: PointerEvent) => {
      activeTool.onPointerUp(e, canvasStateRef.current);
      // stop continuous drawing after finishing stroke
      stopDrawingLoop();

      // draw final frame once to ensure final state rendered
      draw({
        canvas,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      stopDrawingLoop();
    };
  }, [activeTool, appState]); // activeTool in dep so tool handlers are current

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas id="canvas" ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      <Topbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        canvasState={canvasStateRef.current}
        appState={appState}
        setAppState={setAppState}
      />

      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <Toolbar 
      activeTool={activeTool}
      setActiveTool={setActiveTool}
      canvasState={canvasStateRef.current}
        appState={appState}
        setAppState={setAppState}
    />
    { appState.openSettings && <SettingsDialog 
    appState={appState}
    setAppState={setAppState}
    
    /> }
    
    </main>
  );
}
