


import { draw } from "./drawing.js";
import { getCanvas } from "./index.js";
import { getState, updateState } from "./state.js";
import { screenToWorld, worldToScreen } from "./utils.js";

const canvas = getCanvas();

//// --- Desktop Pan/Move/Camera move Start ------------------------------------------------------------------------------------------

// Handle panning (dragging with mouse)
function desktopPan(dx, dy) {
    const state = getState();
    state.panX += dx; // Move horizontally
    state.panY += dy; // Move vertically
    draw(); // Redraw with updated pan
}

canvas.addEventListener("mousedown", (ev) => {
    const { currentTool } = getState();
    if (currentTool == 'pan') {
        // Pan
        //   if (isMiddle || isSpace || pointerMap.size >= 2) {
        updateState({
            dragging: {
                type: "pan",
                startClient: { x: ev.clientX, y: ev.clientY },
            },
        });
        return;
    }
});

canvas.addEventListener("mousemove", (e) => {
    const { currentTool, dragging } = getState();
    if (currentTool != 'pan') return;
    if (!dragging) return;
    const dx = e.clientX - dragging.startClient.x;
    const dy = e.clientY - dragging.startClient.y;
    desktopPan(dx, dy);
    updateState({
        dragging: {
            type: "pan",
            startClient: { x: e.clientX, y: e.clientY },
        },
    });
});

canvas.addEventListener("mouseup", () => { updateState({ dragging: null }) });
canvas.addEventListener("mouseleave", () => { updateState({ dragging: null }) });

//// --- Desktop Pan/Move/Camera move End ------------------------------------------------------------------------------------------
console.log("pan.js loaded");
