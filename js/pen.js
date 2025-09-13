import { draw } from "./drawing.js";
import { getCanvas } from "./index.js";
import { getState, updateState } from "./state.js";
import { screenToWorld, worldToScreen } from "./utils.js";

const canvas = getCanvas();

canvas.addEventListener("pointerdown", (e) => {
  const state = getState();
  if (state.currentTool !== "pen") return;

  // Track active pointer
  let { x, y } = screenToWorld(e.clientX, e.clientY)
  state.pointerMap.set(e.pointerId, { x, y });

  // Start a new stroke
  state.pens[state.idCounterPen] = [
    { x, y }
  ];
});


canvas.addEventListener("pointermove", (e) => {
  const state = getState();
  let { idCounterPen, pens } = state;
  if (state.currentTool !== 'pen') return;
  if (!state.pointerMap.has(e.pointerId)) return;

  // Convert to world coords right away
  let worldPos = screenToWorld(e.clientX, e.clientY);

  // Get the active pen stroke
  if (!pens[idCounterPen]) {
    pens[idCounterPen] = [worldPos];
    return;
  }

  let pen = pens[idCounterPen];
  let last = pen[pen.length - 1];

  // Distance check
  const dx = worldPos.x - last.x;
  const dy = worldPos.y - last.y;
  const distSq = dx * dx + dy * dy;

  // Add only if moved enough (minDist = 2px)
  const minDist = 10;
  if (distSq > minDist * minDist) {
    pen.push(worldPos);
  }

  draw();
});

canvas.addEventListener("pointerup", (e) => {
  const state = getState();
  if (state.currentTool !== "pen") return;

  // End stroke → increment counter
  state.idCounterPen++;
  state.pointerMap.delete(e.pointerId);
});


console.log("pen.js loaded");