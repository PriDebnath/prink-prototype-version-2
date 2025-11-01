// App.tsx
// import { PenTool } from "../../tools";
import { StrokeToolBase } from "../../utils/tool/index";
import SettingsDialog from "./settings.dialog"
import { Topbar } from "../../components/topbar";
import { Sidebar } from "../../components/sidebar";
import { Toolbar } from "../../components/toolbar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Tool, CanvasState, AppState } from "../../types";
import { draw, startDrawingLoop, stopDrawingLoop, type Getters } from "../../utils/drawing";
import { useParams } from "@tanstack/react-router";
import { CANVAS_PRESETS } from "./presets";
import { storage } from "../../utils/storage";


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
  const getters = useMemo(() => ({
    get canvas() {
      return drawingCanvasRef.current!;
    },
    get gridCanvas() {
      return gridCanvasRef.current!;
    },
    getState: () => canvasStateRef.current,
    getActiveTool: () => activeToolRef.current,
    getAppState: () => appStateRef.current,
  }), []);

  // Keep refs in sync with latest state to avoid stale closures in handlers
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

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
  }, [getters]); // run once

  // Load preset or saved prink by canvasId when route changes
  useEffect(() => {
    if (!canvasId) return;
    
    // Check if it's a preset first
    const preset = CANVAS_PRESETS[canvasId];
    if (preset) {
      canvasStateRef.current = {
        ...canvasStateRef.current,
        ...preset,
        device: canvasStateRef.current.device,
      } as CanvasState;
    } else {
      // Check if it's a saved prink
      const savedPrink = storage.getPrink(canvasId);
      if (savedPrink && savedPrink.canvasState) {
        canvasStateRef.current = {
          ...canvasStateRef.current,
          ...savedPrink.canvasState,
          device: canvasStateRef.current.device,
        } as CanvasState;
      } else {
        // New prink - start with empty state but ensure it exists in storage
        const existingPrink = storage.getPrink(canvasId);
        if (!existingPrink) {
          // Create new prink entry
          storage.savePrink({
            id: canvasId,
            name: `Prink ${new Date().toLocaleDateString()}`,
            canvasState: {
              scale: canvasStateRef.current.scale,
              offset: canvasStateRef.current.offset,
              paths: [],
              lasso: [],
              selectedIds: [],
              currentPath: null,
            },
          });
        }
      }
    }

    const drawingCanvas = getters.canvas;
    const gridCanvas = getters.gridCanvas;
    if (drawingCanvas && gridCanvas) {
      draw({
        canvas: drawingCanvas,
        gridCanvas: gridCanvas,
        getState: getters.getState,
        getActiveTool: getters.getActiveTool,
        getAppState: getters.getAppState,
      });
    }
  }, [canvasId, getters]);

  // Helper function to save the current prink state
  const saveCurrentPrink = useMemo(() => {
    return () => {
      if (!canvasId) return;
      
      // Don't auto-save presets
      if (CANVAS_PRESETS[canvasId]) return;

      const currentState = canvasStateRef.current;
      const savedPrink = storage.getPrink(canvasId);
      
      storage.savePrink({
        id: canvasId,
        name: savedPrink?.name || `Prink ${new Date().toLocaleDateString()}`,
        canvasState: {
          scale: currentState.scale,
          offset: currentState.offset,
          paths: currentState.paths,
          lasso: currentState.lasso,
          selectedIds: currentState.selectedIds,
          currentPath: null, // Don't save current path
        },
      });

      // Dispatch custom event to update home page if it's open
      window.dispatchEvent(new CustomEvent('prink-saved'));
    };
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
  }, [appState, getters]);

  // Pointer handlers via React events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drawingCanvas = drawingCanvasRef.current!;
    activeToolRef.current.onPointerDown({ e: e.nativeEvent, canvasState: canvasStateRef.current, appState: appStateRef.current, canvas: drawingCanvas });
    startDrawingLoop({
      canvas: drawingCanvas,
      gridCanvas: gridCanvasRef.current!,
      getState: getters.getState,
      getActiveTool: getters.getActiveTool,
      getAppState: getters.getAppState,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drawingCanvas = drawingCanvasRef.current!;
    activeToolRef.current.onPointerMove({ e: e.nativeEvent, canvasState: canvasStateRef.current, appState: appStateRef.current, canvas: drawingCanvas });
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drawingCanvas = drawingCanvasRef.current!;
    activeToolRef.current.onPointerUp({ e: e.nativeEvent, canvasState: canvasStateRef.current, appState: appStateRef.current, canvas: drawingCanvas });
    stopDrawingLoop();
    draw({
      canvas: drawingCanvas,
      gridCanvas: gridCanvasRef.current!,
      getState: getters.getState,
      getActiveTool: getters.getActiveTool,
      getAppState: getters.getAppState,
    });
    
    // Auto-save after drawing stroke completes
    saveCurrentPrink();
  };

  // Ensure RAF loop stops on unmount
  useEffect(() => () => stopDrawingLoop(), []);

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
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      />

      <Topbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        canvasState={canvasStateRef.current}
        appState={appState}
        setAppState={setAppState}
        onClean={saveCurrentPrink}
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
