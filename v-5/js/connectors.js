    
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
    
    
    // Create connector
      export function createConnector(aId, bId) {
        if (!aId || !bId || aId === bId) return null;
        // prevent duplicates
        const exists = connectors.some(c => (c.aId === aId && c.bId === bId) || (c.aId === bId && c.bId ===
          aId));
        if (exists) return null;
        const conn = { id: connectorIdCounter++, aId, bId };
        connectors.push(conn);
        pushHistory();
        draw();
        return conn;
      }
      
      // Hit testing (top-down)
      export function hitTestNotes(wx, wy) {
        for (let i = notes.length - 1; i >= 0; i--) {
          const n = notes[i];
          if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
        }
        return null;
      }