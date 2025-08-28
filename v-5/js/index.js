function resizeCanvas() {
  const sidebarW = document.querySelector('.sidebar').offsetWidth;
  canvas.width = Math.max(600, window.innerWidth - sidebarW);
  canvas.height = Math.max(300, window.innerHeight);
  draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

stickyBtn.addEventListener('click', () => currentTool = 'sticky');
selectBtn.addEventListener('click', () => currentTool = 'select');
connectBtn.addEventListener('click', () => currentTool = 'connect');

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
snapToggle.addEventListener('click', () => { snapToGrid = !snapToGrid; snapToggle.textContent = `Snap: ${snapToGrid ? 'ON':'OFF'}`; });
gridToggle.addEventListener('click', () => { showGrid = !showGrid; gridToggle.textContent = `Grid: ${showGrid ? 'ON':'OFF'}`; });

draw();
