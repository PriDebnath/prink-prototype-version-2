
import { getState, updateState } from "./state.js";
import { getCanvas } from "./index.js";
import { draw } from "./drawing.js";
import { screenToWorld, worldToScreen } from "./utils.js";
const canvas = getCanvas();


//// --- Mobile Zoom Start ------------------------------------------------------------------------------------------

export function mobileZoom(startDist, startScale, newDist, midpoint) {
  const state = getState();

  // Calculate how much the distance between two fingers has changed
  // newDist / startDist gives the pinch ratio:
  // - If fingers move apart → ratio > 1 (zoom in)
  // - If fingers move closer → ratio < 1 (zoom out)
  const scaleChange = newDist / startDist;

  // Apply this ratio to the scale value that was active when pinch started
  // This ensures smooth zooming relative to where the pinch began
  const newScale = startScale * scaleChange;

  // Clamp the zoom level so it doesn’t get too small (< 0.2x) or too large (> 5x)
  // Prevents the user from zooming infinitely
  const clamped = Math.max(0.2, Math.min(5, newScale));

  // Convert the screen midpoint (between two fingers) into world coordinates
  // This ensures zooming is centered around the fingers, not the top-left corner
  const worldX = (midpoint.x - state.panX) / state.scale;
  const worldY = (midpoint.y - state.panY) / state.scale;

  // Adjust pan so that after zooming, the midpoint stays fixed under the fingers
  // Without this step, zoom would always be from (0,0) instead of the pinch point
  state.panX = midpoint.x - worldX * clamped;
  state.panY = midpoint.y - worldY * clamped;

  // Update the global scale with the new zoom level
  state.scale = clamped;

  // Redraw the canvas with the updated pan + zoom values
  draw();
}
//// --- Mobile Zoom End ------------------------------------------------------------------------------------------

//// --- Desktop Zoom Start ------------------------------------------------------------------------------------------

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
  updateState({
    scale: newScale,
    panX: newPanX,
    panY: newPanY,
  })
  draw();
}
canvas.addEventListener(
  "wheel",
  (ev) => {
    desktopZoom(ev.deltaY, ev.clientX, ev.clientY)
  },
  { passive: false }
);
//// --- Desktop Zoom End ------------------------------------------------------------------------------------------

console.log("zoom.js loaded");