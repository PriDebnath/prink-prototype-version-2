function snapshot() {
  return {
    notes: notes.map(n => ({ ...n })),
    connectors: connectors.map(c => ({ ...c })),
    selectedIds: Array.from(selectedIds)
  };
}

function restoreSnapshot(snap) {
  notes = snap.notes.map(n => ({ ...n }));
  connectors = snap.connectors.map(c => ({ ...c }));
  selectedIds = new Set(snap.selectedIds);
  primarySelectedId = (selectedIds.size === 1) ? Array.from(selectedIds)[0] : null;
  draw();
}

function pushHistory() {
  if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > historyLimit) history.shift();
  historyIndex = history.length - 1;
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreSnapshot(history[historyIndex]);
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restoreSnapshot(history[historyIndex]);
}
