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

export function getPanBtn() {
    return document.getElementById('tool-pan');
}

export function getSelectBtn() {
    return document.getElementById('tool-select');
}

export function getPenBtn() {
    return document.getElementById('tool-pen');
}


export function getConnectBtn() {
    return document.getElementById('tool-connect');
}

///---------

export function getCleanBtn() {
    return document.getElementById('cleanBtn');
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


export function getZoomInBtn() {
    return document.getElementById('zoomInBtn');
}

export function getZoomOutBtn() {
    return document.getElementById('zoomOutBtn');
}

export function getDownloadPngBtn() {
    return document.getElementById('downloadPngBtn');
}



///------

export function getCanvasColorPicker() {
    return document.getElementById('canvas-color-picker');
}

export function getCanvasColorPickerCircle() {
    return document.getElementById('canvas-color-picker-circle');
}



// Load files
import "./canvas.js";
import "./connectors.js";
import "./drawing.js";
import "./history.js";
import "./interaction.js";
import "./state.js";
import "./pan.js";
import "./pen.js";
import "./interactions-toolbar-and-sidebar.js";
import "./keydown-interaction.js";
import "./utils.js";
import "./zoom.js";


console.log("Index.js loaded")

// Rounded rect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 8) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
    };
}

// initial sample data  
import { createNote } from "./notes.js";
import { createConnector } from "./connectors.js";
import { pushHistory, undo, redo } from "./history.js";
import { draw } from "./drawing.js";
import { getState } from "./state.js";
import { setTool } from "./interactions-toolbar-and-sidebar.js";
let note1 = createNote(100, 100, "Sticky #1");
let note2 = createNote(300, 300, "Sticky #2");
let note3 = createNote(150, 500, "Double-tap to edit");

createConnector(note1.id,
    note3.id, [{
        id: 1,
        worldX: 200,
        worldY: 200
    }])
createConnector(note2.id, note3.id, [{
    id: 2,
    worldX: 400,
    worldY: 200
}])

// helpers exposed for debugging
const { idCounter, notes, connectors } = getState();
window._mini = {
    notes: notes,
    connectors: connectors,
    createNote,
    createConnector,
    undo,
    redo,
    setTool,
};

// initialize history with initial state
pushHistory();
draw();
