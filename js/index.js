// --- ACCESS DOM --- 
export function getCanvas() {
    return document.getElementById('board');
}

export function getCtx() {
    const canvas = getCanvas();
    return canvas ? canvas.getContext('2d', { alpha: false }) : null;
}

export function getEditor() {
    return document.getElementById('editor');
}

export function getStickyBtn() {
    return document.getElementById('tool-sticky');
}

export function getSelectBtn() {
    return document.getElementById('tool-select');
}

export function getConnectBtn() {
    return document.getElementById('tool-connect');
}

export function getUndoBtn() {
    return document.getElementById('undoBtn');
}

export function getRedoBtn() {
    return document.getElementById('redoBtn');
}

export function getSnapToggle() {
    return document.getElementById('snapToggle');
}

export function getGridToggle() {
    return document.getElementById('gridToggle');
}

// Load files
import "./canvas.js";
import "./connectors.js";
import "./drawing.js";
import "./history.js";
import "./interaction.js";
import "./state.js";
import "./toolbar-interactions.js";
import "./keydown-interaction.js";
import "./utils.js";

console.log("Index.js loaded")

     // Rounded rect polyfill
      if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 8) {
          this.beginPath();
          this.moveTo(x + r, y);
          this.arcTo(x + w, y, x + w, y + h, r);
          this.arcTo(x + w, y + h, x, y + h, r);
          this.arcTo(x, y + h, x, y, r);
          this.arcTo(x, y, x + w, y, r);
          this.closePath();
        };
      }