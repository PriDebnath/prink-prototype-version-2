 

import { draw } from "./drawing.js";

import { getState } from "./state.js";
let {
    currentTool,
    connectors,
    notes,
    selectedIds,
    history,
    historyIndex,
    historyLimit,
    primarySelectedId,
    showGrid,
    gridSize,
    scale,
    panX,
    panY,
    marquee,
    pointerMap,
    dragging,
    idCounter,
    connectorIdCounter,
    connectFirst
} = getState()
   // Utility: deep copy of state for history
      export function snapshot() {
        return {
          notes: notes.map(n => ({ ...n })),
          connectors: connectors.map(c => ({ ...c })),
          selectedIds: Array.from(selectedIds)
        };
      }
      
      export function restoreSnapshot(snap) {
        notes = snap.notes.map(n => ({ ...n }));
        connectors = snap.connectors.map(c => ({ ...c }));
        selectedIds = new Set(snap.selectedIds);
        primarySelectedId = (selectedIds.size === 1) ? Array.from(selectedIds)[0] : null;
        draw();
      }
      
      export function pushHistory(label) {
        // prune forward history if any
        if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
        history.push(snapshot());
        if (history.length > historyLimit) history.shift();
        historyIndex = history.length - 1;
      }
      
      export function undo() {
        if (historyIndex <= 0) return;
        historyIndex--;
        const snap = history[historyIndex];
        restoreSnapshot(snap);
      }
      
      export function redo() {
        if (historyIndex >= history.length - 1) return;
        historyIndex++;
        const snap = history[historyIndex];
        restoreSnapshot(snap);
      }