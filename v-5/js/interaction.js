


import { getCanvas } from "./index.js";
const canvas = getCanvas();


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

import { pushHistory } from "./history.js";
import { draw } from "./drawing.js";
import { createNote, hideEditor,openEditor, bringToFront } from "./notes.js";

import { screenToWorld,worldToScreen } from "./utils.js";
import{ setTool} from "./toolbar-interactions.js";

// Selection helpers
export function selectNoteId(id, add = false) {
    if (!add) selectedIds.clear();
    if (id !== null) selectedIds.add(id);
    primarySelectedId = (selectedIds.size === 1) ? Array.from(selectedIds)[0] : null;
    draw();
}

export function selectNoteIdToggle(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    primarySelectedId = (selectedIds.size === 1) ? Array.from(selectedIds)[0] : null;
    draw();
}

// Snap helper
export function snap(value) {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
}


// --- Input & Interaction ---

// track pointer positions for gestures
canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    pointerMap.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    const screen = {
        x: ev.clientX - canvas.getBoundingClientRect().left,
        y: ev.clientY - canvas.getBoundingClientRect().top
    };
    const world = screenToWorld(screen.x, screen.y);



    // tool behaviors
    if (currentTool === 'sticky') {
        const newNote = createNote(world.x, world.y, 'New note');
        // select it
        selectNoteId(newNote.id, false);
        pushHistory();
        //0
        setTool('select')
        return;
    }

    if (currentTool === 'connect') {
        const hit = hitTestNotes(world.x, world.y);
        if (hit) {
            if (!connectFirst) {
                connectFirst = hit.id;
                // visually mark by selecting single
                selectedIds.clear();
                selectedIds.add(hit.id);
                primarySelectedId = hit.id;
                draw();
            } else {
                // create connector between connectFirst and hit.id
                createConnector(connectFirst, hit.id);
                connectFirst = null;
                selectedIds.clear();
                primarySelectedId = null;
                draw();
            }
        }
        return;
    }

    // select tool
    const hit = hitTestNotes(world.x, world.y);
    const isSpace = ev.getModifierState && ev.getModifierState('Space');
    const isShift = ev.shiftKey;

    // pan with middle or spacebar or two-finger (we'll detect two pointers outside here)
    const isMiddle = (ev.button === 1);
    if (isMiddle || isSpace || pointerMap.size >= 2) {
        // start panning
        dragging = {
            type: 'pan', startClient: { x: ev.clientX, y: ev.clientY }, startPan: {
                x: panX,
                y: panY
            }
        };
        return;
    }

    if (hit) {
        // bring to front
        bringToFront(hit.id);
        if (isShift) {
            // toggle selection
            selectNoteIdToggle(hit.id);
        } else {
            if (!selectedIds.has(hit.id)) {
                selectNoteId(hit.id, false);
            }
        }
        // start move of selected set
        const offsets = {};
        selectedIds.forEach(sid => {
            const n = notes.find(z => z.id === sid);
            offsets[sid] = { x: world.x - n.x, y: world.y - n.y };
        });
        dragging = { type: 'move', offsets };
        pushHistory(); // start move: push state so undo will revert move start
    } else {
        // clicked empty -> start marquee selection
        selectedIds.clear();
        primarySelectedId = null;
        marquee = { x1: world.x, y1: world.y, x2: world.x, y2: world.y };
        dragging = { type: 'marquee' };
        draw();
    }
});

canvas.addEventListener('pointermove', (ev) => {
    const prev = pointerMap.get(ev.pointerId);
    pointerMap.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (dragging && dragging.type === 'pan') {
        // pan logic
        const dx = ev.clientX - dragging.startClient.x;
        const dy = ev.clientY - dragging.startClient.y;
        panX = dragging.startPan.x + dx;
        panY = dragging.startPan.y + dy;
        draw();
        return;
    }

    if (!dragging) return;

    const screen = {
        x: ev.clientX - canvas.getBoundingClientRect().left, y: ev.clientY - canvas
            .getBoundingClientRect().top
    };
    const world = screenToWorld(screen.x, screen.y);

    if (dragging.type === 'move') {
        // move all selected according to pointer world position & stored offsets
        selectedIds.forEach(sid => {
            const n = notes.find(z => z.id === sid);
            const off = dragging.offsets[sid];
            if (n && off) {
                n.x = snap(world.x - off.x);
                n.y = snap(world.y - off.y);
            }
        });
        draw();
    } else if (dragging.type === 'marquee') {
        marquee.x2 = world.x;
        marquee.y2 = world.y;
        // update selection based on marquee bounds
        const left = Math.min(marquee.x1, marquee.x2),
            right = Math.max(marquee.x1, marquee.x2);
        const top = Math.min(marquee.y1, marquee.y2),
            bottom = Math.max(marquee.y1, marquee.y2);
        selectedIds.clear();
        notes.forEach(n => {
            if (!(n.x > right || n.x + n.w < left || n.y > bottom || n.y + n.h < top)) {
                selectedIds.add(n.id);
            }
        });
        primarySelectedId = (selectedIds.size === 1) ? Array.from(selectedIds)[0] : null;
        draw();
    } else if (dragging.type === 'resize') {
        // resizing primarySelectedId with handle info
        const note = notes.find(n => n.id === dragging.noteId);
        if (!note) return;
        // compute anchor depending on handle
        const start = dragging.start; // contains original values
        if (dragging.handle === 'se') {
            // new width = (world.x - start.x) ; height = ...
            let newW = world.x - start.x;
            let newH = world.y - start.y;
            if (newW < 30) newW = 30;
            if (newH < 30) newH = 30;
            if (snapToGrid) {
                newW = Math.round(newW / gridSize) * gridSize;
                newH = Math.round(newH / gridSize) * gridSize;
            }
            note.w = newW;
            note.h = newH;
        } else if (dragging.handle === 'nw') {
            let dx = world.x - start.x;
            let dy = world.y - start.y;
            let newX = start.origX + dx;
            let newY = start.origY + dy;
            let newW = start.origW - dx;
            let newH = start.origH - dy;
            if (newW < 30) {
                newW = 30;
                newX = start.origX + (start.origW - 30);
            }
            if (newH < 30) {
                newH = 30;
                newY = start.origY + (start.origH - 30);
            }
            if (snapToGrid) {
                newX = snap(newX);
                newY = snap(newY);
                newW = Math.round(newW / gridSize) * gridSize;
                newH = Math.round(newH / gridSize) * gridSize;
            }
            note.x = newX;
            note.y = newY;
            note.w = newW;
            note.h = newH;
        } else if (dragging.handle === 'ne') {
            let dy = world.y - start.y;
            let newY = start.origY + dy;
            let newW = world.x - start.origX;
            let newH = start.origH - dy;
            if (newW < 30) newW = 30;
            if (newH < 30) {
                newH = 30;
                newY = start.origY + (start.origY + start.origH - (start.origY + 30));
            }
            if (snapToGrid) {
                newW = Math.round(newW / gridSize) * gridSize;
                newY = snap(newY);
                newH = Math.round(newH / gridSize) * gridSize;
            }
            note.y = newY;
            note.w = newW;
            note.h = newH;
        } else if (dragging.handle === 'sw') {
            let dx = world.x - start.x;
            let newX = start.origX + dx;
            let newW = start.origW - dx;
            let newH = world.y - start.origY;
            if (newW < 30) {
                newW = 30;
                newX = start.origX + (start.origW - 30);
            }
            if (newH < 30) newH = 30;
            if (snapToGrid) {
                newX = snap(newX);
                newW = Math.round(newW / gridSize) * gridSize;
                newH = Math.round(newH / gridSize) * gridSize;
            }
            note.x = newX;
            note.w = newW;
            note.h = newH;
        }
        draw();
    }
});

canvas.addEventListener('pointerup', (ev) => {
    canvas.releasePointerCapture(ev.pointerId);
    pointerMap.delete(ev.pointerId);

    if (dragging && (dragging.type === 'move' || dragging.type === 'resize')) {
        // finalize action -> push history
        pushHistory();
    }
    if (dragging && dragging.type === 'marquee') {
        marquee = null;
    }
    dragging = null;
    draw();
});

 // Pointer double-tap/dblclick to edit: we'll detect quick successive pointerup
      let lastUpTime = 0;
      canvas.addEventListener('pointerup', (ev) => {
        const now = Date.now();
        const dt = now - lastUpTime;
        lastUpTime = now;
        if (dt < 300) {
          // double-tap/dblclick
          const screen = { x: ev.clientX - canvas.getBoundingClientRect().left, y: ev.clientY - canvas
              .getBoundingClientRect().top };
          const world = screenToWorld(screen.x, screen.y);
          const hit = hitTestNotes(world.x, world.y);
          if (hit) {
            openEditor(hit);
          }
        }
      });
      
      // Resize handles detection on pointerdown (when a single note selected & pointer on handle)
      canvas.addEventListener('pointerdown', (ev) => {
        // we run this additional handler to detect handles; ensure it doesn't conflict
        const screen = { x: ev.clientX - canvas.getBoundingClientRect().left, y: ev.clientY - canvas
            .getBoundingClientRect().top };
        const world = screenToWorld(screen.x, screen.y);
        if (primarySelectedId !== null) {
          const note = notes.find(n => n.id === primarySelectedId);
          if (note) {
            // compute handle rectangles in screen space
            const s = worldToScreen(note.x, note.y);
            const sw = note.w * scale,
              sh = note.h * scale;
            const size = Math.max(8, 8 * scale);
            const half = size / 2;
            const handleRects = {
              nw: { x: s.x - half, y: s.y - half, w: size, h: size },
              ne: { x: s.x + sw - half, y: s.y - half, w: size, h: size },
              sw: { x: s.x - half, y: s.y + sh - half, w: size, h: size },
              se: { x: s.x + sw - half, y: s.y + sh - half, w: size, h: size },
            };
            for (const [name, r] of Object.entries(handleRects)) {
              if (screen.x >= r.x && screen.x <= r.x + r.w && screen.y >= r.y && screen.y <= r.y + r
                .h) {
                // start resize operation
                const noteCopy = { ...note };
                dragging = {
                  type: 'resize',
                  noteId: note.id,
                  handle: name,
                  start: { x: world.x, y: world.y, origX: noteCopy.x, origY: noteCopy.y,
                    origW: noteCopy.w, origH: noteCopy.h }
                };
                // capture pointer done in earlier pointerdown handler
                pushHistory();
                ev.preventDefault();
                return;
              }
            }
          }
        }
      });
      
      // Keyboard events
      window.addEventListener('keydown', (e) => {
        const isCmd = e.ctrlKey || e.metaKey;
        if (isCmd && (e.key === 'z' || e.key === 'Z')) { e.preventDefault();
          undo(); return; }
        if (isCmd && (e.key === 'y' || e.key === 'Y')) { e.preventDefault();
          redo(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedIds.size > 0) {
            notes = notes.filter(n => !selectedIds.has(n.id));
            connectors = connectors.filter(c => !selectedIds.has(c.aId) && !selectedIds.has(c.bId));
            selectedIds.clear();
            primarySelectedId = null;
            pushHistory();
            draw();
          }
        }
        if (e.key === 'Escape') {
          selectedIds.clear();
          primarySelectedId = null;
          marquee = null;
          connectFirst = null;
          hideEditor();
          draw();
        }
        // hold Space for pan (space handling done in pointerdown via ev.getModifierState)
      });
      
      // Mouse wheel for zoom (centered at cursor)
      canvas.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const screenX = ev.clientX - rect.left;
        const screenY = ev.clientY - rect.top;
        const worldBefore = screenToWorld(screenX, screenY);
        const delta = -ev.deltaY;
        const zoomFactor = Math.exp(delta * 0.0015);
        const newScale = Math.max(0.2, Math.min(3, scale * zoomFactor));
        scale = newScale;
        // adjust pan so that worldBefore stays at same screen position
        const worldAfterScreen = worldToScreen(worldBefore.x, worldBefore.y);
        panX += screenX - worldAfterScreen.x;
        panY += screenY - worldAfterScreen.y;
        draw();
      }, { passive: false });
      
      // Pinch-to-zoom & two-finger pan (basic)
      // we use pointer events: when 2 pointers present calculate distance
      function handleGesture() {
        if (pointerMap.size < 2) return;
        const pts = Array.from(pointerMap.values());
        const p0 = pts[0],
          p1 = pts[1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        const dist = Math.hypot(p0.x - p1.x, p0.y - p1.y);
        if (!handleGesture.last) handleGesture.last = { dist, midX, midY, scale, panX, panY };
        else {
          const ls = handleGesture.last;
          const factor = dist / ls.dist;
          const newScale = Math.max(0.2, Math.min(3, ls.scale * factor));
          // center at mid
          const rect = canvas.getBoundingClientRect();
          const screenMidX = midX - rect.left;
          const screenMidY = midY - rect.top;
          const worldAtMid = screenToWorld(screenMidX, screenMidY);
          scale = newScale;
          const after = worldToScreen(worldAtMid.x, worldAtMid.y);
          panX += screenMidX - after.x;
          panY += screenMidY - after.y;
          draw();
        }
      }
      canvas.addEventListener('pointermove', (ev) => {
        // call gesture recalculation on pointermove globally (we already set pointerMap earlier)
        if (pointerMap.size >= 2) handleGesture();
      });
      
      canvas.addEventListener('pointerup', () => { handleGesture.last = null; });
      
    