
import { getCanvas } from "./index.js";
import { draw } from "./drawing.js";
import { getState, updateState } from "./state.js";

// helpers: canvas resize
function resizeCanvas() {
    const canvas = getCanvas();
    const sidebarW = document.querySelector('.sidebar').offsetWidth;
    console.log({ sidebarW })
    canvas.width = Math.max(600, window.innerWidth);
    canvas.height = Math.max(300, window.innerHeight);
    let device = window.innerWidth <= 768 ? "mobile" : "desktop";
    updateState({ device: device })
    draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
console.log("Canvas.js loaded")