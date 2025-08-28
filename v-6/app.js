import { initState, loadFromStorage, saveToStorage, setMode, getState } from './state.js';
import { setupCanvas } from './canvas.js';
import { draw } from './render.js';
import { createSticky, updateActiveNoteText, updateActiveNoteColor, duplicateSelection } from './notes.js';
import { clearSelection, selectTool, connectTool } from './selection.js';
import { setupInteractions } from './interaction.js';
import { connectSelectedPair } from './connectors.js';
import { $, on } from './utils.js';

// Boot
initState();
loadFromStorage();

const canvas = $('#board');
const editor = $('#editor');
const colorInput = $('#color');
const stickyBtn = $('#tool-sticky');
const selectBtn = $('#tool-select');
const connectBtn = $('#tool-connect');
const fitBtn = $('#tool-fit');
const clearBtn = $('#tool-clear');

setupCanvas(canvas, draw);
setupInteractions(canvas, draw);

// Toolbar bindings
on(stickyBtn, 'click', () => {
  setMode('sticky');
  stickyBtn.classList.add('active');
  selectBtn.classList.remove('active');
  connectBtn.classList.remove('active');
});

on(selectBtn, 'click', () => {
  setMode('select');
  selectBtn.classList.add('active');
  stickyBtn.classList.remove('active');
  connectBtn.classList.remove('active');
  selectTool();
});

on(connectBtn, 'click', () => {
  setMode('connect');
  connectBtn.classList.add('active');
  stickyBtn.classList.remove('active');
  selectBtn.classList.remove('active');
  connectTool();
});

on(fitBtn, 'click', () => {
  const s = getState();
  // naive fit: center origin and reset zoom
  s.camera.x = 0;
  s.camera.y = 0;
  s.camera.k = 1;
  draw();
});

on(clearBtn, 'click', () => {
  if (confirm('Clear all notes and connectors?')) {
    const s = getState();
    s.notes = [];
    s.connectors = [];
    clearSelection();
    saveToStorage();
    draw();
  }
});

// Side panel bindings
on(editor, 'input', (e) => {
  updateActiveNoteText(e.target.value);
  draw();
});

on(colorInput, 'input', (e) => {
  updateActiveNoteColor(e.target.value);
  draw();
});

// Keyboard bindings
on(window, 'keydown', (e) => {
  const meta = e.metaKey || e.ctrlKey;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const s = getState();
    const selected = new Set(s.selection.ids);
    s.notes = s.notes.filter(n => !selected.has(n.id));
    s.connectors = s.connectors.filter(c => !(selected.has(c.a) || selected.has(c.b)));
    clearSelection();
    saveToStorage();
    draw();
  } else if (meta && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault();
    duplicateSelection();
    draw();
  } else if (e.key === 'c' || e.key === 'C') {
    setMode('connect');
    connectBtn.classList.add('active');
    stickyBtn.classList.remove('active');
    selectBtn.classList.remove('active');
  } else if (e.key === 'v' || e.key === 'V') {
    setMode('select');
    selectBtn.classList.add('active');
    stickyBtn.classList.remove('active');
    connectBtn.classList.remove('active');
  } else if (e.key === 's' || e.key === 'S') {
    setMode('sticky');
    stickyBtn.classList.add('active');
    selectBtn.classList.remove('active');
    connectBtn.classList.remove('active');
  } else if (e.key === 'f' || e.key === 'F') {
    const s = getState();
    s.camera.x = 0; s.camera.y = 0; s.camera.k = 1; draw();
  } else if ((e.key === 'Enter' || e.key === ' ') && getState().mode === 'connect') {
    connectSelectedPair();
    draw();
  }
});

// First draw
draw();
