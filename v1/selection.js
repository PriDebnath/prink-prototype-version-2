import { getState, saveToStorage } from './state.js';

export function clearSelection(){
  const s = getState();
  s.selection.ids = [];
  s.selection.activeId = null;
}

export function setSelection(ids){
  const s = getState();
  s.selection.ids = Array.from(new Set(ids));
  s.selection.activeId = s.selection.ids[0] || null;
}

export function addToSelection(id){
  const s = getState();
  if (!s.selection.ids.includes(id)) s.selection.ids.push(id);
  if (!s.selection.activeId) s.selection.activeId = id;
}

export function selectTool(){
  // placeholder for future tool-specific UI
}

export function connectTool(){
  // placeholder
}

export function startMarquee(x, y){
  const s = getState();
  s.selection.marquee = { x, y, w: 0, h: 0 };
}

export function updateMarquee(x, y){
  const s = getState();
  if (!s.selection.marquee) return;
  s.selection.marquee.w = x - s.selection.marquee.x;
  s.selection.marquee.h = y - s.selection.marquee.y;
}

export function finishMarquee(){
  const s = getState();
  const m = s.selection.marquee;
  if (!m) return;
  const rx = Math.min(m.x, m.x + m.w);
  const ry = Math.min(m.y, m.y + m.h);
  const rw = Math.abs(m.w);
  const rh = Math.abs(m.h);
  const ids = s.notes.filter(n => !(n.x > rx + rw || n.x + n.w < rx || n.y > ry + rh || n.y + n.h < ry)).map(n => n.id);
  setSelection(ids);
  s.selection.marquee = null;
  saveToStorage();
}
