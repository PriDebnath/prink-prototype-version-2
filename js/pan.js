


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

//// --- Mobile Pan/Move/Camera move Start ------------------------------------------------------------------------------------------
function mobilePan(dx, dy) {
    const state = getState();
    state.panX += dx;
    state.panY += dy;
    draw();
}


function clearPinch() {
    const state = getState();

    delete state._pinchStartDist;
    delete state._pinchStartScale;
    delete state._pinchMidpoint;
}


canvas.addEventListener("pointerdown", (e) => {
    const state = getState();
    console.log({state})

    if (state.currentTool == 'pan' && state. device == 'mobile') {
    state.pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
});


canvas.addEventListener("pointermove", (e) => {
    const state = getState();

    if (state.currentTool != 'mobile') return;
    if (state.currentTool != 'pan') return;
    if (!state.pointerMap.has(e.pointerId)) return;
    console.log('nanananana')
    state.pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (state.pointerMap.size === 2) {
        // pinch zoom
        const pts = Array.from(state.pointerMap.values());
        const [p1, p2] = pts;
        if (!state._pinchStartDist) {
            state._pinchStartDist = distance(p1, p2);
            state._pinchStartScale = state.scale;
            state._pinchMidpoint = midpoint(p1, p2);
        } else {
            const newDist = distance(p1, p2);
            mobileZoom(
                state._pinchStartDist,
                state._pinchStartScale,
                newDist,
                state._pinchMidpoint
            );
        }
    }
    if (state.pointerMap.size === 1) {
        // single finger pan
        const p = state.pointerMap.get(e.pointerId);
        if (state._lastTouch) {
            const dx = p.x - state._lastTouch.x;
            const dy = p.y - state._lastTouch.y;
            mobilePan(dx, dy);
        }
        state._lastTouch = { ...p };
    }
});

canvas.addEventListener("pointerup", (e) => {
    const state = getState();

    state.pointerMap.delete(e.pointerId);
    if (state.pointerMap.size < 2) clearPinch();
    if (state.pointerMap.size === 0) delete state._lastTouch;
});
canvas.addEventListener("pointercancel", (e) => {
    const state = getState();

    state.pointerMap.delete(e.pointerId);
    if (state.pointerMap.size < 2) clearPinch();
    if (state.pointerMap.size === 0) delete state._lastTouch;
});

//// --- Mobile Pan/Move/Camera move End ------------------------------------------------------------------------------------------


console.log("pan.js loaded");
