// App.tsx
// import { PenTool } from "../../tools";
import { StrokeToolBase } from "../../utils/tool/index";
import SettingsDialog from "./settings.dialog"
import { Topbar } from "../../components/topbar";
import { Sidebar } from "../../components/sidebar";
import { Toolbar } from "../../components/toolbar";
import React, { useEffect, useRef, useState } from "react";
import type { Tool, CanvasState, AppState } from "../../types";
import { draw, startDrawingLoop, stopDrawingLoop, type Getters } from "../../utils/drawing";
import { useParams } from "@tanstack/react-router";
import { CANVAS_PRESETS } from "./presets";


export default function CanvasPage() {
  const { canvasId } = useParams({ from: "/canvas/$canvasId" });
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>(new StrokeToolBase());
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
    openSettings: false,
    selectedTheme: null,
    pen: {
      type: "airbrush",
      color: "#000000",
      size: 16,
      opacity: 0.9,
    }
  });

  // Helpers to pass into draw utils so they read fresh values each frame
  const getters = {
    get canvas() {
      return drawingCanvasRef.current!;
    },
    get gridCanvas() {
      return gridCanvasRef.current!;
    },
    getState: () => canvasStateRef.current,
    getActiveTool: () => activeTool,
    getAppState: () => appState,
  };

  // Resize handling + initial one-shot draw
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current!;
    const drawingCanvas = drawingCanvasRef.current!;
    const gridCtx = gridCanvas.getContext("2d")!;
    const drawingCtx = drawingCanvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      
      // Setup grid canvas
      gridCanvas.width = gridCanvas.clientWidth * dpr;
      gridCanvas.height = gridCanvas.clientHeight * dpr;
      gridCtx.setTransform(1, 0, 0, 1, 0, 0);
      gridCtx.scale(dpr, dpr);

      // Setup drawing canvas
      drawingCanvas.width = drawingCanvas.clientWidth * dpr;
      drawingCanvas.height = drawingCanvas.clientHeight * dpr;
      drawingCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawingCtx.scale(dpr, dpr);

      // update device breakpoint
      canvasStateRef.current.device = window.innerWidth <= 768 ? "mobile" : "desktop";

      // draw a single frame (we are not in continuous loop unless user is drawing)
      draw({
        canvas: drawingCanvas,
        gridCanvas: gridCanvas,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (ro) {
      ro.observe(gridCanvas);
      ro.observe(drawingCanvas);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []); // run once

  // Load preset by canvasId when route changes
  useEffect(() => {
    if (!canvasId) return;
    const preset = CANVAS_PRESETS[canvasId];
    if (preset) {
      canvasStateRef.current = {
        ...canvasStateRef.current,
        ...preset,
        device: canvasStateRef.current.device,
      } as CanvasState;
      const drawingCanvas = drawingCanvasRef.current;
      const gridCanvas = gridCanvasRef.current;
      if (drawingCanvas && gridCanvas) {
        draw({
          canvas: drawingCanvas,
          gridCanvas: gridCanvas,
          getState: () => canvasStateRef.current,
          getActiveTool: () => activeTool,
          getAppState: () => appState,
        });
      }
    }
  }, [canvasId]);

  // Redraw one frame when appState (grid toggle, UI changes)
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    if (!drawingCanvas || !gridCanvas) return;
    draw({
      canvas: drawingCanvas,
      gridCanvas: gridCanvas,
      getState: getters.getState,
      getActiveTool: getters.getActiveTool,
      getAppState: getters.getAppState,
    });
  }, [appState]);

  // Pointer event handlers: start RAF loop on pointerdown, stop on up/cancel
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current!;
    if (!drawingCanvas) return;

    const onDown = (e: PointerEvent) => {
      activeTool.onPointerDown({ e, canvasState: canvasStateRef.current, appState, canvas: drawingCanvas });
      // start continuous draw (from down -> move -> up)
      startDrawingLoop({
        canvas: drawingCanvas,
        gridCanvas: gridCanvasRef.current!,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    const onMove = (e: PointerEvent) => {
      activeTool.onPointerMove({ e, canvasState: canvasStateRef.current, appState, canvas: drawingCanvas });
      // continuous loop is running so it will render updates
    };

    const onUp = (e: PointerEvent) => {
      activeTool.onPointerUp({ e, canvasState: canvasStateRef.current, appState, canvas: drawingCanvas });
      // stop continuous drawing after finishing stroke
      stopDrawingLoop();

      // draw final frame once to ensure final state rendered
      draw({
        canvas: drawingCanvas,
        gridCanvas: gridCanvasRef.current!,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    };

    drawingCanvas.addEventListener("pointerdown", onDown);
    drawingCanvas.addEventListener("pointermove", onMove);
    drawingCanvas.addEventListener("pointerup", onUp);
    drawingCanvas.addEventListener("pointercancel", onUp);

    return () => {
      drawingCanvas.removeEventListener("pointerdown", onDown);
      drawingCanvas.removeEventListener("pointermove", onMove);
      drawingCanvas.removeEventListener("pointerup", onUp);
      drawingCanvas.removeEventListener("pointercancel", onUp);
      stopDrawingLoop();
    };
  }, [activeTool, appState]); // activeTool in dep so tool handlers are current

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Grid canvas (background) */}
      <canvas 
        id="grid-canvas" 
        ref={gridCanvasRef} 
        style={{ 
          width: "100%", 
          height: "100%", 
          position: "absolute", 
          top: 0, 
          left: 0,
          zIndex: 1,
          background: "linear-gradient(120deg, #fff4dd 0%, #e1f0f8 50%, #f2f7fb 100%)"
        }} 
      />
      {/* Drawing canvas (transparent overlay) */}
      <canvas 
        id="drawing-canvas" 
        ref={drawingCanvasRef} 
        style={{ 
          width: "100%", 
          height: "100%", 
          position: "absolute", 
          top: 0, 
          left: 0,
          zIndex: 2,
          background: "transparent"
        }} 
      />

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
