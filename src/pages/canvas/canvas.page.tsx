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

  // Drawing lifecycle refs used by React handlers
  const isDrawingRef = useRef(false);
  const lastPointerEventRef = useRef<PointerEvent | null>(null);

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
        getState: () => canvasStateRef.current,
        getActiveTool: () => activeToolRef.current,
        getAppState: () => appStateRef.current,
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
      getState: () => canvasStateRef.current,
      getActiveTool: () => activeToolRef.current,
      getAppState: () => appStateRef.current,
    });
  }, [appState]);

  // Pointer event handlers: start RAF loop on pointerdown, stop on up/cancel
  // Window/tab lifecycle listeners remain outside React canvas handlers
  useEffect(() => {
    const finishIfDrawing = () => {
      if (!isDrawingRef.current) return;
      const canvas = drawingCanvasRef.current!;
      const lastEvent = lastPointerEventRef.current;
      const e = lastEvent ?? (typeof PointerEvent !== "undefined" ? new PointerEvent("pointerup") : undefined as unknown as PointerEvent);
      activeToolRef.current.onPointerUp({
        e,
        canvasState: canvasStateRef.current,
        appState: appStateRef.current,
        canvas,
      });
      isDrawingRef.current = false;
      stopDrawingLoop();
      draw({
        canvas,
        gridCanvas: gridCanvasRef.current!,
        getState: () => canvasStateRef.current,
        getActiveTool: () => activeToolRef.current,
        getAppState: () => appStateRef.current,
      });
    };

    const onWindowBlur = () => {
      finishIfDrawing();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        finishIfDrawing();
      }
    };

    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopDrawingLoop();
    };
  }, []);

  // React-based canvas handlers reading from refs
  const handlePointerDown = React.useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current!;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch { void 0; }
    isDrawingRef.current = true;
    lastPointerEventRef.current = e.nativeEvent;
    activeToolRef.current.onPointerDown({
      e: e.nativeEvent,
      canvasState: canvasStateRef.current,
      appState: appStateRef.current,
      canvas,
    });
    startDrawingLoop({
      canvas,
      gridCanvas: gridCanvasRef.current!,
      getState: () => canvasStateRef.current,
      getActiveTool: () => activeToolRef.current,
      getAppState: () => appStateRef.current,
    });
  }, []);

  const handlePointerMove = React.useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    lastPointerEventRef.current = e.nativeEvent;
    activeToolRef.current.onPointerMove({
      e: e.nativeEvent,
      canvasState: canvasStateRef.current,
      appState: appStateRef.current,
      canvas: drawingCanvasRef.current!,
    });
  }, []);

  const finishStroke = React.useCallback((pe?: PointerEvent | Event) => {
    if (!isDrawingRef.current) return;
    const canvas = drawingCanvasRef.current!;
    const e = (pe as PointerEvent) ?? lastPointerEventRef.current ?? new PointerEvent("pointerup");
    activeToolRef.current.onPointerUp({
      e,
      canvasState: canvasStateRef.current,
      appState: appStateRef.current,
      canvas,
    });
    isDrawingRef.current = false;
    stopDrawingLoop();
    draw({
      canvas,
      gridCanvas: gridCanvasRef.current!,
      getState: () => canvasStateRef.current,
      getActiveTool: () => activeToolRef.current,
      getAppState: () => appStateRef.current,
    });
  }, []);

  const handlePointerUp = React.useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      drawingCanvasRef.current?.releasePointerCapture(e.pointerId);
    } catch { void 0; }
    lastPointerEventRef.current = e.nativeEvent;
    finishStroke(e.nativeEvent);
  }, [finishStroke]);

  const handlePointerLeave = React.useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    finishStroke(e.nativeEvent);
  }, [finishStroke]);

  // Attach a non-passive wheel listener so preventDefault is allowed
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = canvasStateRef.current;
      const drawCanvas = drawingCanvasRef.current!;

      const zoomFactor = 1.1;
      let newScale = state.scale;
      if (e.deltaY > 0) newScale *= zoomFactor; else if (e.deltaY < 0) newScale /= zoomFactor;
      newScale = Math.max(0.1, Math.min(5, newScale));

      const worldX = (e.clientX - state.offset.x) / state.scale;
      const worldY = (e.clientY - state.offset.y) / state.scale;

      state.offset.x = e.clientX - worldX * newScale;
      state.offset.y = e.clientY - worldY * newScale;
      state.scale = newScale;

      draw({
        canvas: drawCanvas,
        gridCanvas: gridCanvasRef.current!,
        getState: () => canvasStateRef.current,
        getActiveTool: () => activeToolRef.current,
        getAppState: () => appStateRef.current,
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel as EventListener);
    };
  }, []);

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: "none" }}
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
