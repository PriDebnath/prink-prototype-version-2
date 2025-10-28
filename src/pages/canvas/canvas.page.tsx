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
  const activeToolRef = useRef<Tool>(activeTool);
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
  const appStateRef = useRef<AppState>(appState);

  // Helpers to pass into draw utils so they read fresh values each frame
  const getters = {
    get canvas() {
      return drawingCanvasRef.current!;
    },
    get gridCanvas() {
      return gridCanvasRef.current!;
    },
    getState: () => canvasStateRef.current,
    getActiveTool: () => activeToolRef.current,
    getAppState: () => appStateRef.current,
  };

  // Keep refs in sync with latest state without re-attaching listeners
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

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

    const isDrawingRef = { current: false } as { current: boolean };
    const lastPointerEventRef = { current: null as PointerEvent | null };

    const onDown = (e: PointerEvent) => {
      const tool = activeToolRef.current;
      const currentAppState = appStateRef.current;
      isDrawingRef.current = true;
      lastPointerEventRef.current = e;
      tool.onPointerDown({ e, canvasState: canvasStateRef.current, appState: currentAppState, canvas: drawingCanvas });
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
      const tool = activeToolRef.current;
      const currentAppState = appStateRef.current;
      lastPointerEventRef.current = e;
      tool.onPointerMove({ e, canvasState: canvasStateRef.current, appState: currentAppState, canvas: drawingCanvas });
      // continuous loop is running so it will render updates
    };

    const onUp = (e: PointerEvent) => {
      const tool = activeToolRef.current;
      const currentAppState = appStateRef.current;
      isDrawingRef.current = false;
      lastPointerEventRef.current = e;
      tool.onPointerUp({ e, canvasState: canvasStateRef.current, appState: currentAppState, canvas: drawingCanvas });
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

    const finishIfDrawing = (fallbackEvent?: Event) => {
      if (!isDrawingRef.current) return;
      const tool = activeToolRef.current;
      const currentAppState = appStateRef.current;
      const lastEvent = lastPointerEventRef.current;
      const e = lastEvent ?? (typeof PointerEvent !== "undefined" ? new PointerEvent("pointerup") : (fallbackEvent as any));
      tool.onPointerUp({ e, canvasState: canvasStateRef.current, appState: currentAppState, canvas: drawingCanvas });
      stopDrawingLoop();
      draw({
        canvas: drawingCanvas,
        gridCanvas: gridCanvasRef.current!,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
      isDrawingRef.current = false;
    };

    const onLeave = (e: PointerEvent) => {
      finishIfDrawing(e);
    };

    const onWindowBlur = (e: FocusEvent) => {
      finishIfDrawing(e);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        finishIfDrawing();
      }
    };

    drawingCanvas.addEventListener("pointerdown", onDown);
    drawingCanvas.addEventListener("pointermove", onMove);
    drawingCanvas.addEventListener("pointerup", onUp);
    drawingCanvas.addEventListener("pointercancel", onUp);
    drawingCanvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      drawingCanvas.removeEventListener("pointerdown", onDown);
      drawingCanvas.removeEventListener("pointermove", onMove);
      drawingCanvas.removeEventListener("pointerup", onUp);
      drawingCanvas.removeEventListener("pointercancel", onUp);
      drawingCanvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopDrawingLoop();
    };
  }, []); // attach once; handlers read latest values from refs

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Grid canvas (background) */}
      <canvas 
        id="grid-canvas" 
        ref={gridCanvasRef} 
      />
      {/* Drawing canvas (transparent overlay) */}
      <canvas 
        id="draw-canvas" 
        ref={drawingCanvasRef} 
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
