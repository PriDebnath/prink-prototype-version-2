function createNote(wx, wy, text = 'New note') {
  const w = 180, h = 120;
  const note = { id: idCounter++, x: wx - w/2, y: wy - h/2, w, h, text, color: 'pink' };
  notes.push(note);
  pushHistory();
  draw();
  return note;
}

function bringToFront(noteId) {
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx > -1) {
    const [note] = notes.splice(idx, 1);
    notes.push(note);
  }
}
