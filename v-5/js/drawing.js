function drawGrid() { /* same as before */ }
function drawHandlesForNote(note) { /* same as before */ }
function wrapTextLines(ctx, text, maxWidth) { /* same as before */ }

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f7f9fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  // connectors
  connectors.forEach(conn => { /* draw connectors */ });

  // notes
  notes.forEach(note => { /* draw notes */ });

  // marquee
  if (marquee) { /* draw marquee */ }
}
