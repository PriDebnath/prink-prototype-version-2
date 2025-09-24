import { draw } from "./drawing.js";
import { getState, resetStatePreserveHistory } from "./state.js";
import { getUndoBtn, getRedoBtn } from "./index.js";

const undoBtn = getUndoBtn()
const redoBtn = getRedoBtn()
const state = getState();

// Utility: deep copy of state for history
export function snapshot() {
  const state = getState();
  return {
    notes: state.notes.map(n => ({ ...n })),
    pens: [
      ...state.pens.map(pen => pen ? [...pen.map(pt => ({ ...pt }))] : [])
      
    ],
    
    
    connectors: state.connectors.map(c => ({
      ...c,
      a: { ...c.a },
      b: { ...c.b },
      breakPoints: c.breakPoints ?
        c.breakPoints.map(bp => ({ ...bp })) :
        []
    })),
    
    
    selectedIds: Array.from(state.selectedIds),
  };
}

export function restoreSnapshot(snap) {
  state.notes = snap.notes.map(n => ({ ...n }));
  state.pens = snap.pens.map(pen => pen ? [...pen.map(pt => ({ ...pt }))] : []);
  state.connectors = snap.connectors.map(c => ({ ...c }));
  
  
  
  
  
  state.selectedIds = new Set(snap.selectedIds);
  state.primarySelectedId =
    state.selectedIds.size === 1 ? Array.from(state.selectedIds)[0] : null;
  draw();
}

export function pushHistory(label) {
  // prune forward history if any
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  state.history.push(snapshot());
  if (state.history.length > state.historyLimit) {
    state.history.shift();
  }
  state.historyIndex = state.history.length - 1;
}

export function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  const snap = state.history[state.historyIndex];
  restoreSnapshot(snap);
  
  //
  undoBtn.classList.add("active");
  setTimeout(() => {
    undoBtn.classList.remove("active");
  }, 200);
}

export function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  const snap = state.history[state.historyIndex];
  restoreSnapshot(snap);
  
  redoBtn.classList.add("active");
  setTimeout(() => {
    redoBtn.classList.remove("active");
  }, 200);
}


// --- Clear state but keep undo ---
export function cleanState() {
  pushHistory("clear");
  resetStatePreserveHistory();
}