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

console.log("Index.js loaded")