
import {
  getCanvas,
  getEditor,
  getStickyBtn,
  getSelectBtn,
  getPenBtn,
  getConnectBtn,
  getCleanBtn,
  getUndoBtn,
  getRedoBtn,
  getSnapToggle,
  getGridToggle,
  getPanBtn,
  getZoomInBtn,
  getZoomOutBtn,
  getDownloadPngBtn,
  getCanvasColorPicker,
  getCanvasColorPickerCircle
} from "./index.js";

import { getState, updateState } from "./state.js";
import { draw } from "./drawing.js";
import { createNote, hideEditor, openEditor } from "./notes.js";
import { screenToWorld, worldToScreen } from "./utils.js";
import { createConnector, hitTestNotes } from "./connectors.js";
import { pushHistory, redo, undo, cleanState } from "./history.js";
import { handleCenterZoomInOut } from "./zoom.js";

const canvas = getCanvas();
const editor = getEditor();
const undoBtn = getUndoBtn();
const redoBtn = getRedoBtn();
const cleanBtn = getCleanBtn();

const stickyBtn = getStickyBtn();
const selectBtn = getSelectBtn();
const penBtn = getPenBtn();
const panBtn = getPanBtn();
const connectBtn = getConnectBtn();

const snapToggle = getSnapToggle();
const gridToggle = getGridToggle();

const state = getState();

// header
let zoomInBtn = getZoomInBtn()
let zoomOutBtn = getZoomOutBtn()
let canvasColorPicker = getCanvasColorPicker()
let canvasColorPickerCircle = getCanvasColorPickerCircle()
let downloadPngBtn = getDownloadPngBtn()

function makeElementActive(element) {
  if (!element) {
    return
  }
  element.classList.add("toggle-on")
  setTimeout(() => {
    element.classList.remove("toggle-on")
  }, 300);
}

zoomInBtn.addEventListener("click", () => {
  handleCenterZoomInOut("+");
  makeElementActive(zoomInBtn)
});

zoomOutBtn.addEventListener("click", () => {
  handleCenterZoomInOut("-");
  makeElementActive(zoomOutBtn)
});

canvasColorPicker.oninput = (ev) => {
  const color = ev.target.value
  state.bg = color;
  canvasColorPickerCircle.style.backgroundColor = color
  draw();
};

downloadPngBtn.addEventListener("click", () => {
  makeElementActive(downloadPngBtn)
  // Create a link and trigger download
  let link = document.createElement("a")
  link = document.createElement("a");
  link.download = "my_drawing.png"; // filename
  link.href = canvas.toDataURL("image/png");
  link.click()
});



// toolbar interactions
panBtn.addEventListener("click", () => {
  setTool("pan");
});

penBtn.addEventListener("click", () => {
  setTool("pen");
});
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
  panBtn.classList.toggle("active", t === "pan");
  penBtn.classList.toggle("active", t === "pen");
  stickyBtn.classList.toggle("active", t === "sticky");
  selectBtn.classList.toggle("active", t === "select");
  connectBtn.classList.toggle("active", t === "connect");

  // set cursor depending on tool // not working on canvas
  // switch (t) {
  //   case "pan":
  //     document.body.style.cursor = "grab"; // for panning
  //     break;
  //   case "sticky":
  //     document.body.style.cursor = "crosshair"; // for placing stickies
  //     break;
  //   case "select":
  //     document.body.style.cursor = "default"; // standard selection
  //     break;
  //   case "connect":
  //     document.body.style.cursor = "pointer"; // connection tool
  //     break;
  //   default:
  //     document.body.style.cursor = "default";
  // }

  // reset connect state
  state.connectFirst = null;
  state.selectedIds.clear();
  state.primarySelectedId = null;
  hideEditor();
  draw();
}

function updateUndoRedoUi() {
  setTimeout(() => {
    let { history, historyIndex } = getState()
    console.log("index, arr.len", historyIndex, history.length)
    if (historyIndex >= 1) {
      undoBtn.classList.add("toggle-on")
    } else {
      undoBtn.classList.remove("toggle-on")
    }
    ///
    if (historyIndex + 1 < history?.length) {
      redoBtn.classList.add("toggle-on")
    } else {
      redoBtn.classList.remove("toggle-on")
    }
  }, 8);
}


// bottom toolbar toggles
cleanBtn.addEventListener("click", () => {
  cleanState()
  draw()
});
undoBtn.addEventListener("click", () => {
  undo()
  updateUndoRedoUi()

});

redoBtn.addEventListener("click", () => {
  redo()
  updateUndoRedoUi()
});
//
updateUndoRedoUi()// initial call

export function handleGridToggle() {
  state.showGrid = !state.showGrid;
  console.log(state.showGrid, gridToggle)
  gridToggle.classList.toggle("toggle-on", state.showGrid);
  gridToggle.setAttribute("data-tooltip", "Grid: " + (state.showGrid ? "ON" : "OFF"));
  draw();
}
gridToggle.addEventListener("click", handleGridToggle);

export function handleSnapToGrid() {
  state.snapToGrid = !state.snapToGrid;
  snapToggle.classList.toggle("toggle-on", state.snapToGrid);
  snapToggle.setAttribute("data-tooltip", "Snap: " + (state.snapToGrid ? "ON" : "OFF"));
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

