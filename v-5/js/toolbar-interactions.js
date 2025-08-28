


///
import {
    getCanvas,
    getEditor,
    getStickyBtn,
    getSelectBtn,
    getConnectBtn,
    getUndoBtn,
    getRedoBtn,
    getSnapToggle,
    getGridToggle
} from "./index.js";
const canvas = getCanvas();
const editor = getEditor();
const undoBtn = getUndoBtn();
const redoBtn = getRedoBtn();
const stickyBtn = getStickyBtn();
const selectBtn = getSelectBtn();
const connectBtn = getConnectBtn();
const snapToggle = getSnapToggle();
const gridToggle = getGridToggle();


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

import { draw } from "./drawing.js";
import { createNote, hideEditor,openEditor } from "./notes.js";
import { screenToWorld, worldToScreen } from "./utils.js";
import {  createConnector,hitTestNotes } from "./connectors.js";
import { pushHistory, redo, restoreSnapshot, snapshot, undo } from "./history.js";

// toolbar interactions
stickyBtn.addEventListener('click', () => { setTool('sticky'); });
selectBtn.addEventListener('click', () => { setTool('select'); });
connectBtn.addEventListener('click', () => { setTool('connect'); });

export function setTool(t) {
    currentTool = t;
    stickyBtn.classList.toggle('active', t === 'sticky');
    selectBtn.classList.toggle('active', t === 'select');
    connectBtn.classList.toggle('active', t === 'connect');
    // reset connect state
    connectFirst = null;
    selectedIds.clear();
    primarySelectedId = null;
    hideEditor();
    draw();
}

// bottom toolbar toggles
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

gridToggle.addEventListener('click', () => {
    showGrid = !showGrid;
    gridToggle.classList.toggle('toggle-on', showGrid);
    gridToggle.innerText = 'Grid: ' + (showGrid ? 'ON' : 'OFF');
    draw();
});
snapToggle.addEventListener('click', () => {
    snapToGrid = !snapToGrid;
    snapToggle.classList.toggle('toggle-on', snapToGrid);
    snapToggle.innerText = 'Snap: ' + (snapToGrid ? 'ON' : 'OFF');
});

// Helper: find handle name under screen point -> used for cursor feedback
export function handleAtScreenPoint(sx, sy) {
    if (primarySelectedId === null) return null;
    const note = notes.find(n => n.id === primarySelectedId);
    if (!note) return null;
    const s = worldToScreen(note.x, note.y);
    const sw = note.w * scale;
    const sh = note.h * scale;
    const size = Math.max(8, 8 * scale);
    const half = size / 2;
    const handles = {
        nw: { x: s.x - half, y: s.y - half, w: size, h: size },
        ne: { x: s.x + sw - half, y: s.y - half, w: size, h: size },
        sw: { x: s.x - half, y: s.y + sh - half, w: size, h: size },
        se: { x: s.x + sw - half, y: s.y + sh - half, w: size, h: size }
    };
    for (const [name, r] of Object.entries(handles)) {
        if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) return name;
    }
    return null;
}

// Pointer move to set cursor style when on handle
canvas.addEventListener('pointermove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left,
        sy = ev.clientY - rect.top;
    const h = handleAtScreenPoint(sx, sy);
    canvas.style.cursor = h ? (h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize') :
        'default';
});

// initial sample notes
createNote(240, 200, 'Double-tap to edit');
createNote(520, 220, 'Sticky #2');

// helpers exposed for debugging
window._mini = { notes, connectors, createNote, createConnector, undo, redo, setTool };

// initialize history with initial state
pushHistory();
draw();
