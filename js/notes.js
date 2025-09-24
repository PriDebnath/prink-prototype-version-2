// notes.js
import { getCanvas, getEditor } from "./index.js";
const canvas = getCanvas();
const editor = getEditor();

import { getState, updateState } from "./state.js";
import { pushHistory } from "./history.js";
import { draw } from "./drawing.js";
import { screenToWorld, worldToScreen } from "./utils.js";

// Create note
export function createNote(wx, wy, text = "New note") {
  const { idCounter, notes } = getState();
  const w = 180,
    h = 120;
  
  const note = {
    id: idCounter,
    x: wx - w / 2,
    y: wy - h / 2,
    w,
    h,
    text,
    fontSize: 12,
    color: "#fff59d",
  };
  
  // Update state
  notes.push(note);
  updateState({ idCounter: idCounter + 1, notes });
  
  pushHistory();
  draw();
  return note;
}

// Helper to bring note to front
export function bringToFront(noteId) {
  const { notes } = getState();
  const idx = notes.findIndex((n) => n.id === noteId);
  if (idx >= 0) {
    const [n] = notes.splice(idx, 1);
    notes.push(n);
    updateState({ notes });
  }
}

function handleNoteFontSizeSelect(note) {
  const noteFontSizeSelect = document.getElementById("noteFontSizeSelect");
  console.log(noteFontSizeSelect)
  
  noteFontSizeSelect.onchange = function() {
    note.fontSize = this.value;
    draw();
  }
  
}


function handleColorPicker(note) {
  const colorPicker = document.getElementById("editor-color-picker");
  // set picker initial value
  colorPicker.value = note.color || "#ffff88";
  
  // live update color
  colorPicker.oninput = (ev) => {
    note.color = ev.target.value;
    draw();
  };
  
}


// --- Utility: clamp popup inside screen ---
function positionElement(el, desiredLeft, desiredTop, width, height, padding = 8) {
  const maxLeft = window.innerWidth - width - padding;
  const maxTop = window.innerHeight - height - padding;
  
  let left = Math.min(Math.max(desiredLeft, padding), maxLeft);
  let top = Math.min(Math.max(desiredTop, padding), maxTop);
  
  el.style.left = left + "px";
  el.style.top = top + "px";
}

// --- Tray ---
function openEditorTray(note, screenPos, canvasRect) {
  const tray = document.getElementById("editor-tray");
  tray.style.display = "flex";
  
  const trayWidth = tray.offsetWidth || 200;
  const trayHeight = tray.offsetHeight || 40;
  
  const desiredLeft = canvasRect.left + screenPos.x + 8;
  const desiredTop = canvasRect.top + screenPos.y - 32; // default above
  
  positionElement(tray, desiredLeft, desiredTop, trayWidth, trayHeight);
  
  // --- handle items ---
  handleColorPicker(note);
  handleNoteFontSizeSelect(note);
  
  // --- Hide tray if user clicks outside ---
  function handleClickOutside(e) {
    if (!tray.contains(e.target)) {
      tray.style.display = "none";
      document.removeEventListener("click", handleClickOutside);
    }
  }
  
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 0);
}

// --- Text Editor ---
function openEditorText(note, screenPos, canvasRect) {
  const editor = getEditor();
  editor.style.display = "block";
  
  const minWidth = 120,
    minHeight = 60;
  const editorWidth = Math.max(minWidth, note.w - 12);
  const editorHeight = Math.max(minHeight, note.h - 12);
  
  const desiredLeft = canvasRect.left + screenPos.x + 8;
  const desiredTop = canvasRect.top + screenPos.y + 8;
  
  positionElement(editor, desiredLeft, desiredTop, editorWidth, editorHeight);
  
  editor.style.width = editorWidth + "px";
  editor.style.height = editorHeight + "px";
  editor.innerText = note.text;
  
  // save on blur
  editor.onblur = () => {
    note.text = editor.innerText || "";
    editor.style.display = "none";
    pushHistory();
    draw();
  };
  
  editor.onkeydown = (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
      editor.blur();
    }
  };
}

// --- Entry Point ---
export function openEditor(note) {
  const screenPos = worldToScreen(note.x, note.y);
  const canvasRect = canvas.getBoundingClientRect();
  
  openEditorTray(note, screenPos, canvasRect);
  openEditorText(note, screenPos, canvasRect);
}

export function hideEditor() {
  const tray = document.getElementById("editor-tray");
  
  const editor = getEditor();
  
  tray.style.display = "none";
  editor.style.display = "none";
}

console.log("notes.js loaded");