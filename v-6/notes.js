import { getState, addNote, saveToStorage } from './state.js';
import { makeId } from './utils.js';

export function createSticky(at){
  const s = getState();
  const id = makeId('note');
  const note = {
    id,
    x: (at?.x ?? 0) - 75,
    y: (at?.y ?? 0) - 50,
    w: 150,
    h: 120,
    text: 'New note',
    color: '#fff59d',
  };
  addNote(note);
  s.selection.ids = [id];
  s.selection.activeId = id;
  saveToStorage();
  return id;
}

export function updateActiveNoteText(text){
  const s = getState();
  const id = s.selection.activeId;
  if (!id) return;
  const n = s.notes.find(n => n.id === id);
  if (!n) return;
  n.text = text;
  saveToStorage();
}

export function updateActiveNoteColor(color){
  const s = getState();
  const id = s.selection.activeId;
  if (!id) return;
  const n = s.notes.find(n => n.id === id);
  if (!n) return;
  n.color = color;
  saveToStorage();
}

export function duplicateSelection(){
  const s = getState();
  const newIds = [];
  s.selection.ids.forEach(id => {
    const n = s.notes.find(n => n.id === id);
    if (!n) return;
    const copy = { ...n, id: makeId('note'), x: n.x + 20, y: n.y + 20 };
    s.notes.push(copy);
    newIds.push(copy.id);
  });
  if (newIds.length){
    s.selection.ids = newIds;
    s.selection.activeId = newIds[0];
    saveToStorage();
  }
}

export function noteAtPoint(wx, wy){
  const s = getState();
  for (let i = s.notes.length - 1; i >= 0; i--){
    const n = s.notes[i];
    if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
  }
  return null;
}

export function isOnResizeHandle(n, wx, wy){
  return wx >= n.x + n.w - 12 && wx <= n.x + n.w && wy >= n.y + n.h - 12 && wy <= n.y + n.h;
}
