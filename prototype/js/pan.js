import { draw } from "./drawing.js";
import { getCanvas } from "./index.js";
import { mobileZoom } from "./zoom.js";
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
                startClient: {
                    x: ev.clientX,
                    y: ev.clientY
                },
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
            startClient: {
                x: e.clientX,
                y: e.clientY
            },
        },
    });
});

function clearDesktopPan(e) {
    const { currentTool, dragging } = getState();
    if (currentTool != 'pan') return;
    updateState({ dragging: null })
}



canvas.addEventListener("mouseup", clearDesktopPan)

canvas.addEventListener("mouseleave", clearDesktopPan)

//// --- Desktop Pan/Move/Camera move End ------------------------------------------------------------------------------------------

//// --- Mobile Zoom/Pan/Move/Camera/ move Start ------------------------------------------------------------------------------------------
function mobilePan(dx, dy) {
    const state = getState();
    state.panX += dx;
    state.panY += dy;
    draw();
}


// === Helper functions for multi-touch ===
function getDistance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y); // Euclidean distance
}

function getMidpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; // Midpoint
}



canvas.addEventListener("pointerdown", (e) => {
    const state = getState();
    if (state.device != 'mobile') return;
    
    if (state.currentTool != 'pan') return;
    
    state.pointerMap.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
    });
    
});


canvas.addEventListener("pointermove", (e) => {
    const state = getState();
    
    if (state.selectedIds.size >= 2) return; // when user have selected more items, let it move.
    
    if (state.device != 'mobile') return;
    
    if (state.currentTool != 'pan') return;
    
    if (!state.pointerMap.has(e.pointerId)) return;
    state.pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    
    if (state.pointerMap.size === 2) {
        
        // pinch zoom
        const pts = Array.from(state.pointerMap.values());
        console.log({ pts })
        const [p1, p2] = pts;
        if (!state?.dragging?.pinch?.startDist) {
            updateState({
                dragging: {
                    type: "pan",
                    pinch: {
                        startDist: getDistance(p1, p2),
                        startScale: state.scale,
                        midpoint: getMidpoint(p1, p2),
                        y: e.clientY
                    },
                }
            })
        } else {
            const newDist = getDistance(p1, p2);
            mobileZoom(
                state.dragging.pinch
                .startDist,
                state.dragging.pinch.startScale,
                newDist,
                state.dragging.pinch.midpoint
            );
        }
    }
    if (state.pointerMap.size === 1) {
        // single finger pan
        const startClient = state.pointerMap.get(e.pointerId);
        if (state.dragging && state.dragging?.startClient?.x) {
            const dx = startClient.x - state.dragging.startClient.x;
            
            const dy = startClient.y - state.dragging.startClient.y;
            mobilePan(dx, dy);
        }
        state.dragging = {
            type: "pan",
            startClient: startClient
        };
    }
});

function clearMobilePan(e) {
    let { currentTool, pointerMap, dragging , device} = getState();
    if (currentTool != 'pan') return;
        if (device != 'mobile') return;

    pointerMap.delete(e.pointerId);
    dragging = null
}

canvas.addEventListener("pointerup", (e) => {
    clearMobilePan(e)
})

canvas.addEventListener("pointercancel", (e) => {
    clearMobilePan(e)
});

//// --- Mobile Zoom/Pan/Move/Camera move End ------------------------------------------------------------------------------------------


console.log("pan.js loaded");