// Global state
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d', { alpha: false });
const editor = document.getElementById('editor');

const stickyBtn = document.getElementById('tool-sticky');
const selectBtn = document.getElementById('tool-select');
const connectBtn = document.getElementById('tool-connect');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const snapToggle = document.getElementById('snapToggle');
const gridToggle = document.getElementById('gridToggle');

// Notes & connectors
let notes = [];
let connectors = [];
let idCounter = 1;
let connectorIdCounter = 1;

// Viewport
let panX = 0, panY = 0, scale = 1;

// Selection & interactions
let currentTool = 'sticky';
let selectedIds = new Set();
let primarySelectedId = null;
let dragging = null;
let marquee = null;
let connectFirst = null;
let pointerMap = new Map();

// Undo/redo
let history = [], historyIndex = -1, historyLimit = 80;

// Options
let snapToGrid = true;
let showGrid = true;
const gridSize = 16;
