 

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
    color: "pink",
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

// Editor overlay
export function openEditor(note) {
  const screenPos = worldToScreen(note.x, note.y);
  const canvasRect = canvas.getBoundingClientRect();
  editor.style.display = "block";
  editor.style.left = canvasRect.left + screenPos.x + 8 + "px";
  editor.style.top = canvasRect.top + screenPos.y + 8 + "px";
  editor.style.width = Math.max(120, note.w - 12) + "px";
  editor.style.height = Math.max(60, note.h - 12) + "px";
  editor.innerText = note.text;
  editor.focus();

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

export function hideEditor() {
  editor.style.display = "none";
}

console.log("notes.js loaded");
