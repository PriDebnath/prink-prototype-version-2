
import { getCanvas } from "./index.js";
// helpers: canvas resize
function resizeCanvas() {
    const canvas = getCanvas();
    const sidebarW = document.querySelector('.sidebar').offsetWidth;
    canvas.width = Math.max(600, window.innerWidth - sidebarW);
    canvas.height = Math.max(300, window.innerHeight);
    // draw();
    console.log({ canvas })
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
console.log("Canvas.js loaded")