 
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

export function getDarkenColor(hex, factor = 0.7) {
  let c = parseInt(hex.slice(1), 16);
  let r = Math.floor(((c >> 16) & 255) * factor);
  let g = Math.floor(((c >> 8) & 255) * factor);
  let b = Math.floor((c & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

console.log("utils.js loaded");
