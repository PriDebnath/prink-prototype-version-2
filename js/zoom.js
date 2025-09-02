
import { getState } from "./state.js";
import { getCanvas } from "./index.js";
import { draw } from "./drawing.js";
import { screenToWorld, worldToScreen } from "./utils.js";
const canvas = getCanvas();

// --- Zoom ---

function desktopZoom(deltaY, clientX, clientY) {
  const state = getState();

  let { scale, panX, panY } = state;
  const zoomFactor = 1.1; // control how much zoom 
  let newScale = scale;
  if (deltaY > 0) {
    newScale *= zoomFactor; // if deltaY gretter than 0 zoom in
  }
  else if (deltaY < 0) {
    newScale /= zoomFactor // if deltaY less than 0 zoom out
  };
  newScale = Math.max(0.2, Math.min(5, newScale));
  const worldBefore = screenToWorld(clientX, clientY);

  const { x: worldX, y: worldY } = worldBefore
  const newPanX = clientX - worldX * newScale;
  const newPanY = clientY - worldY * newScale;
  // state updates
  state.scale = newScale;
  state.panX = newPanX;
  state.panY = newPanY;
  draw();
}


canvas.addEventListener(
  "wheel",
  (ev) => {
    desktopZoom(ev.deltaY, ev.clientX, ev.clientY)
  },
  { passive: false }
);
console.log("zoom.js loaded");
