

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


// Helper: world <-> screen coordinates
export function worldToScreen(wx, wy) {
    return { x: (wx * scale) + panX, y: (wy * scale) + panY };
}

export function screenToWorld(sx, sy) {
    return { x: (sx - panX) / scale, y: (sy - panY) / scale };
}

console.log("utils.js loaded")
