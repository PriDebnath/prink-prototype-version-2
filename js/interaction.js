// events.js (refactored)
import { getCanvas } from "./index.js";
const canvas = getCanvas();

import { getState, updateState } from "./state.js";
import { pushHistory, undo, redo } from "./history.js";
import { draw } from "./drawing.js";
import { createNote, hideEditor, openEditor, bringToFront } from "./notes.js";
import { screenToWorld, worldToScreen } from "./utils.js";
import { handleGridToggle, handleSnapToGrid, setTool } from "./interactions-toolbar-and-sidebar.js";
import { createConnector, hitTestNotes } from "./connectors.js";

// --- Helpers ---
// Selection
export function selectNoteId(id, add = false) {
  const state = getState();
  const { selectedIds } = state;
  if (!add) selectedIds.clear();
  if (id !== null) selectedIds.add(id);

  updateState({
    selectedIds,
    primarySelectedId:
      selectedIds.size === 1 ? Array.from(selectedIds)[0] : null,
  });
  draw();
}

export function selectNoteIdToggle(id) {
  const state = getState();
  const { selectedIds } = state;
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);

  updateState({
    selectedIds,
    primarySelectedId:
      selectedIds.size === 1 ? Array.from(selectedIds)[0] : null,
  });
  draw();
}

// Snap
export function snap(value) {
  const { snapToGrid, gridSize } = getState();
  if (!snapToGrid) return value;
  return Math.round(value / gridSize) * gridSize;
}

// Handles of note for resizing
function getHandlesForNote(note, scale) {
  const pos = worldToScreen(note.x, note.y);
  const sw = note.w * scale;
  const sh = note.h * scale;
  // Increase base size from 8 to 12 and multiplier from 3 to 2
  const size = Math.max(12, 12 * scale) * 2;
  // Adjust divisor from 2.9 to 2 for better positioning
  const half = size / 2;

  return [
    { x: pos.x - half, y: pos.y - half, w: size, h: size, name: "nw" },
    { x: pos.x + sw - half, y: pos.y - half, w: size, h: size, name: "ne" },
    { x: pos.x - half, y: pos.y + sh - half, w: size, h: size, name: "sw" },
    { x: pos.x + sw - half, y: pos.y + sh - half, w: size, h: size, name: "se" },
  ];
}

// --- Input & Interaction ---
canvas.addEventListener("pointerdown", (ev) => {
  const state = getState();
  const { pointerMap, currentTool, panX, panY } = state;

  canvas.setPointerCapture(ev.pointerId);
  pointerMap.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

  const rect = canvas.getBoundingClientRect();
  const screen = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  const world = screenToWorld(screen.x, screen.y);

  // Tool: sticky
  if (currentTool === "sticky") {
    const newNote = createNote(world.x, world.y, "New note");
    selectNoteId(newNote.id, false);
    pushHistory();
    setTool("select");
    return;
  }

  // Tool: connect
  if (currentTool === "connect") {
    const hit = hitTestNotes(world.x, world.y);
    if (hit) {
      const { connectFirst } = getState();

      if (!connectFirst) {
        updateState({
          connectFirst: hit.id,
          selectedIds: new Set([hit.id]),
          primarySelectedId: hit.id,
        });
        draw();
      } else {
        createConnector(connectFirst, hit.id);
        updateState({
          connectFirst: null,
          selectedIds: new Set(),
          primarySelectedId: null,
        });
        draw();
        setTool("select")
      }
    }
    return;
  }

  // Tool: select
  const hit = hitTestNotes(world.x, world.y);
  const isSpace = ev.getModifierState && ev.getModifierState("Space");
  const isShift = ev.shiftKey;
  const isMiddle = ev.button === 1;
console.log("pannnnning",ev.button)


  if (hit) {
    bringToFront(hit.id);

    const s2 = getState();
    if (isShift) selectNoteIdToggle(hit.id);
    else if (!s2.selectedIds.has(hit.id)) selectNoteId(hit.id, false);

    const note = s2.notes.find((n) => n.id === hit.id);
    if (note) {
      // --- check resize handles ---
      const handles = getHandlesForNote(note, s2.scale);
      for (const h of handles) {
        if (
          screen.x >= h.x &&
          screen.x <= h.x + h.w &&
          screen.y >= h.y &&
          screen.y <= h.y + h.h
        ) {
          updateState({
            dragging: {
              type: "resize",
              handle: h.name,
              noteId: note.id,
              start: {
                x: note.x, // Changed from world.x to note.x
                y: note.y, // Changed from world.y to note.y
                origX: note.x,
                origY: note.y,
                origW: note.w,
                origH: note.h,
              },
            },
          });
          pushHistory();
          return;
        }
      }
    }

    // --- fallback: move ---
    const { notes, selectedIds } = getState();
    const offsets = {};
    selectedIds.forEach((sid) => {
      const n = notes.find((z) => z.id === sid);
      offsets[sid] = { x: world.x - n.x, y: world.y - n.y };
    });
    updateState({ dragging: { type: "move", offsets } });
    pushHistory();
  } else {
    // Empty click → marquee
    updateState({
      selectedIds: new Set(),
      primarySelectedId: null,
      marquee: { x1: world.x, y1: world.y, x2: world.x, y2: world.y },
      dragging: { type: "marquee" },
    });
    draw();
  }
});

canvas.addEventListener("pointermove", (ev) => {
  const state = getState();
  const { pointerMap, dragging } = state;

  pointerMap.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

 
  if (!dragging) return;

  const rect = canvas.getBoundingClientRect();
  const screen = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  const world = screenToWorld(screen.x, screen.y);

  if (dragging.type === "move") {
    const { notes, selectedIds } = getState();
    selectedIds.forEach((sid) => {
      const n = notes.find((z) => z.id === sid);
      const off = dragging.offsets[sid];
      if (n && off) {
        n.x = snap(world.x - off.x);
        n.y = snap(world.y - off.y);
      }
    });
    draw();
  } else if (dragging.type === "marquee") {
    const s = getState();
    s.marquee.x2 = world.x;
    s.marquee.y2 = world.y;
    const left = Math.min(s.marquee.x1, s.marquee.x2);
    const right = Math.max(s.marquee.x1, s.marquee.x2);
    const top = Math.min(s.marquee.y1, s.marquee.y2);
    const bottom = Math.max(s.marquee.y1, s.marquee.y2);

    s.selectedIds.clear();
    s.notes.forEach((n) => {
      if (
        !(n.x > right || n.x + n.w < left || n.y > bottom || n.y + n.h < top)
      ) {
        s.selectedIds.add(n.id);
      }
    });

    updateState({
      selectedIds: s.selectedIds,
      primarySelectedId:
        s.selectedIds.size === 1 ? Array.from(s.selectedIds)[0] : null,
      marquee: s.marquee,
    });
    draw();
  } else if (dragging.type === "resize") {
    const s = getState();
    const note = s.notes.find((n) => n.id === dragging.noteId);
    if (!note) return;
    const start = dragging.start;

    switch (dragging.handle) {
      case "se": {
        note.w = Math.max(30, snap(world.x - start.origX));
        note.h = Math.max(30, snap(world.y - start.origY));
        break;
      }
      case "sw": {
        const newW = Math.max(30, start.origX + start.origW - world.x);
        note.w = snap(newW);
        note.x = snap(start.origX + start.origW - note.w);
        note.h = Math.max(30, snap(world.y - start.origY));
        break;
      }
      case "ne": {
        note.w = Math.max(30, snap(world.x - start.origX));
        const newH = Math.max(30, start.origY + start.origH - world.y);
        note.h = snap(newH);
        note.y = snap(start.origY + start.origH - note.h);
        break;
      }
      case "nw": {
        const newW = Math.max(30, start.origX + start.origW - world.x);
        const newH = Math.max(30, start.origY + start.origH - world.y);
        note.w = snap(newW);
        note.h = snap(newH);
        note.x = snap(start.origX + start.origW - note.w);
        note.y = snap(start.origY + start.origH - note.h);
        break;
      }
    }
    draw();
  }
});

canvas.addEventListener("pointerup", (ev) => {
  const state = getState();
  const { pointerMap, dragging } = state;

  canvas.releasePointerCapture(ev.pointerId);
  pointerMap.delete(ev.pointerId);

  if (dragging && (dragging.type === "move" || dragging.type === "resize")) {
    pushHistory();
  }
  if (dragging?.type === "marquee") {
    updateState({ marquee: null });
  }
  updateState({ dragging: null });
  draw();
});

// Double-click → edit
// Pointer double-tap/dblclick to edit: we'll detect quick successive pointerup

let lastUpTime = 0;
canvas.addEventListener("pointerup", (ev) => {
  // double-up detection (runs in addition to the above pointerup handler)

  const now = Date.now();
  const dt = now - lastUpTime;
  lastUpTime = now;
  if (dt < 300) {
    const rect = canvas.getBoundingClientRect();
    const screen = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    const world = screenToWorld(screen.x, screen.y);
    const hit = hitTestNotes(world.x, world.y);
    if (hit) openEditor(hit);
  }
});


// --- Pinch ---
function handleGesture() {
  const s = getState();
  if (s.pointerMap.size < 2) return;
  const pts = Array.from(s.pointerMap.values());
  const [p0, p1] = pts;
  const midX = (p0.x + p1.x) / 2;
  const midY = (p0.y + p1.y) / 2;
  const dist = Math.hypot(p0.x - p1.x, p0.y - p1.y);
  if (!handleGesture.last) {
    handleGesture.last = {
      dist,
      midX,
      midY,
      scale: s.scale,
      panX: s.panX,
      panY: s.panY,
    };
    return;
  } else {
    const ls = handleGesture.last;
    const factor = dist / ls.dist;
    const newScale = Math.max(0.2, Math.min(3, ls.scale * factor));

    const rect = canvas.getBoundingClientRect();
    const screenMidX = midX - rect.left;
    const screenMidY = midY - rect.top;
    const worldAtMid = screenToWorld(screenMidX, screenMidY);

    updateState({ scale: newScale });

    const after = worldToScreen(worldAtMid.x, worldAtMid.y);
    updateState({
      panX: ls.panX + (screenMidX - after.x),
      panY: ls.panY + (screenMidY - after.y),
    });
    draw();
  }
}

canvas.addEventListener("pointermove", (ev) => {
  const s = getState();
  if (s.pointerMap.size >= 2) handleGesture();
});

canvas.addEventListener("pointerup", () => {
  handleGesture.last = null;
});
