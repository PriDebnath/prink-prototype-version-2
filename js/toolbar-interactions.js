 
import {
  getCanvas,
  getEditor,
  getStickyBtn,
  getSelectBtn,
  getConnectBtn,
  getUndoBtn,
  getRedoBtn,
  getSnapToggle,
  getGridToggle,
} from "./index.js";

import { getState } from "./state.js";
import { draw } from "./drawing.js";
import { createNote, hideEditor, openEditor } from "./notes.js";
import { screenToWorld, worldToScreen } from "./utils.js";
import { createConnector, hitTestNotes } from "./connectors.js";
import { pushHistory, redo, undo } from "./history.js";

const canvas = getCanvas();
const editor = getEditor();
const undoBtn = getUndoBtn();
const redoBtn = getRedoBtn();
const stickyBtn = getStickyBtn();
const selectBtn = getSelectBtn();
const connectBtn = getConnectBtn();
const snapToggle = getSnapToggle();
const gridToggle = getGridToggle();

const state = getState();

// toolbar interactions
stickyBtn.addEventListener("click", () => {
  setTool("sticky");
});
selectBtn.addEventListener("click", () => {
  setTool("select");
});
connectBtn.addEventListener("click", () => {
  setTool("connect");
});

export function setTool(t) {
  state.currentTool = t;
  stickyBtn.classList.toggle("active", t === "sticky");
  selectBtn.classList.toggle("active", t === "select");
  connectBtn.classList.toggle("active", t === "connect");

  // reset connect state
  state.connectFirst = null;
  state.selectedIds.clear();
  state.primarySelectedId = null;
  hideEditor();
  draw();
}

// bottom toolbar toggles
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

export function handleGridToggle(){
  state.showGrid = !state.showGrid;
  gridToggle.classList.toggle("toggle-on", state.showGrid);
  gridToggle.innerText = "Grid: " + (state.showGrid ? "ON" : "OFF");
  draw();
}
gridToggle.addEventListener("click", handleGridToggle);

export function handleSnapToGrid(){
  state.snapToGrid = !state.snapToGrid;
  snapToggle.classList.toggle("toggle-on", state.snapToGrid);
  snapToggle.innerText = "Snap: " + (state.snapToGrid ? "ON" : "OFF");
}
snapToggle.addEventListener("click", handleSnapToGrid);

// Helper: find handle name under screen point -> used for cursor feedback
export function handleAtScreenPoint(sx, sy) {
  if (state.primarySelectedId === null) return null;
  const note = state.notes.find((n) => n.id === state.primarySelectedId);
  if (!note) return null;

  const s = worldToScreen(note.x, note.y);
  const sw = note.w * state.scale;
  const sh = note.h * state.scale;
  const size = Math.max(8, 8 * state.scale);
  const half = size / 2;

  const handles = {
    nw: { x: s.x - half, y: s.y - half, w: size, h: size },
    ne: { x: s.x + sw - half, y: s.y - half, w: size, h: size },
    sw: { x: s.x - half, y: s.y + sh - half, w: size, h: size },
    se: { x: s.x + sw - half, y: s.y + sh - half, w: size, h: size },
  };

  for (const [name, r] of Object.entries(handles)) {
    if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) return name;
  }
  return null;
}

// Pointer move to set cursor style when on handle
canvas.addEventListener("pointermove", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const sx = ev.clientX - rect.left,
    sy = ev.clientY - rect.top;
  const h = handleAtScreenPoint(sx, sy);
  canvas.style.cursor =
    h ? (h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize") : "default";
});

