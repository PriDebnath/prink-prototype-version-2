import { getState, saveToStorage, setMode } from './state.js';
import { createSticky, noteAtPoint, isOnResizeHandle } from './notes.js';
import { setSelection, addToSelection, clearSelection, startMarquee, updateMarquee, finishMarquee } from './selection.js';
import { screenToWorld } from './utils.js';
import { draw } from './render.js';

export function setupInteractions(canvas, drawCb){
  let isSpaceDown = false;
  let last = null;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const s = getState();
    const pt = screenToWorld(e.offsetX, e.offsetY, s.camera);

    if (e.button === 1 || isSpaceDown){ // middle or space: start pan
      s.panning = true;
      last = { x: e.offsetX, y: e.offsetY };
      return;
    }

    if (s.mode === 'sticky'){
      createSticky(pt);
      setMode('select');
      drawCb();
      return;
    }

    // hit test notes
    const hit = noteAtPoint(pt.x, pt.y);
    if (hit){
      // resize?
      if (isOnResizeHandle(hit, pt.x, pt.y)){
        s.resizing = { id: hit.id, ox: pt.x - hit.x, oy: pt.y - hit.y };
        if (!e.shiftKey && !s.selection.ids.includes(hit.id)) setSelection([hit.id]);
        return;
      }
      // select/drag
      if (e.shiftKey){ addToSelection(hit.id); }
      else if (!s.selection.ids.includes(hit.id)){ setSelection([hit.id]); }
      s.dragging = { id: hit.id, dx: pt.x - hit.x, dy: pt.y - hit.y };
    } else {
      // empty space => marquee
      startMarquee(pt.x, pt.y);
    }
    drawCb();
  });

  canvas.addEventListener('pointermove', (e) => {
    const s = getState();
    const pt = screenToWorld(e.offsetX, e.offsetY, s.camera);
    if (s.panning && last){
      const dx = e.offsetX - last.x;
      const dy = e.offsetY - last.y;
      s.camera.x += dx / s.camera.k;
      s.camera.y += dy / s.camera.k;
      last = { x: e.offsetX, y: e.offsetY };
      drawCb();
      return;
    }
    if (s.dragging){
      const ids = new Set(s.selection.ids);
      s.notes.forEach(n => {
        if (ids.has(n.id)){
          n.x = pt.x - s.dragging.dx;
          n.y = pt.y - s.dragging.dy;
        }
      });
      drawCb();
    } else if (s.resizing){
      const n = s.notes.find(n => n.id === s.resizing.id);
      if (n){
        n.w = Math.max(80, pt.x - n.x + 2);
        n.h = Math.max(60, pt.y - n.y + 2);
        drawCb();
      }
    } else if (s.selection.marquee){
      updateMarquee(pt.x, pt.y);
      drawCb();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    const s = getState();
    s.dragging = null;
    s.resizing = null;
    s.panning = false;
    if (s.selection.marquee){
      finishMarquee();
    }
    saveToStorage();
    drawCb();
    canvas.releasePointerCapture(e.pointerId);
  });

  // zoom (wheel)
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const s = getState();
    const delta = -e.deltaY * 0.001;
    const oldK = s.camera.k;
    const newK = Math.max(.2, Math.min(3, oldK * (1 + delta)));
    // zoom around cursor
    const before = screenToWorld(e.offsetX, e.offsetY, s.camera);
    s.camera.k = newK;
    const after = screenToWorld(e.offsetX, e.offsetY, s.camera);
    s.camera.x += (after.x - before.x);
    s.camera.y += (after.y - before.y);
    drawCb();
  }, { passive: false });

  // space pan
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space'){ isSpaceDown = true; canvas.style.cursor = 'grab'; }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space'){ isSpaceDown = false; canvas.style.cursor = 'default'; }
  });
}
