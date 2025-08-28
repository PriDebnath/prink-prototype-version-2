import { makeId } from './utils.js';

const _state = {
  camera: { x: 0, y: 0, k: 1 },
  mode: 'select', // 'select' | 'sticky' | 'connect'
  notes: [], // {id, x, y, w, h, text, color}
  connectors: [], // {id, a, b}
  selection: { ids: [], marquee: null, activeId: null },
  dragging: null, // {id, dx, dy} or null
  resizing: null, // {id, corner:'se'|'nw'|'ne'|'sw', ox, oy}
  panning: false,
};

export function initState() { /* placeholder for future */ }

export function getState() { return _state; }

export function setMode(m) { _state.mode = m; }

export function addNote(n) { _state.notes.push(n); persistSoon(); }

export function addConnector(a, b) {
  const id = makeId('edge');
  _state.connectors.push({ id, a, b }); persistSoon();
  return id;
}

let _persistTimer = null;
function persistSoon() {
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(saveToStorage, 250);
}

const STORAGE_KEY = 'mini-miro-modular';

export function saveToStorage() {
  const { camera, notes, connectors } = _state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ camera, notes, connectors }));
  } catch (e) {
    console.warn('Failed to save', e);
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.camera) _state.camera = parsed.camera;
    if (Array.isArray(parsed.notes)) _state.notes = parsed.notes;
    if (Array.isArray(parsed.connectors)) _state.connectors = parsed.connectors;
  } catch (e) {
    console.warn('Failed to load', e);
  }
}
