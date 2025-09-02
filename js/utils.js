 
import { getState } from "./state.js";

// Helper: world <-> screen coordinates
export function worldToScreen(wx, wy) {
    const { scale, panX, panY } = getState();
    return { x: (wx * scale) + panX, y: (wy * scale) + panY };
}

export function screenToWorld(sx, sy) {
    // sx = cx = clientX
    // sy = cy = clientY
    const { scale, panX, panY } = getState();
    return { x: (sx - panX) / scale, y: (sy - panY) / scale };
}

console.log("utils.js loaded");
