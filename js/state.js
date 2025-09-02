const state = {
    notes: [], // Array of note objects {id, x, y, w, h, text, color}
    connectors: [], // Array of connector objects {id, a, b} (a/b = connected note ids)

    // --- Viewport transform ---
    // panX and panY represent how far the "camera" (viewport)
    // has been shifted horizontally and vertically from the origin (0,0).
    // Instead of moving all notes on canvas, we move the virtual viewport.
    // For example:
    //   panX = +100 → means the view is shifted right by 100px
    //   panY = -50  → means the view is shifted up by 50px
    // Together with scale, they allow zooming and panning.
    panX: 0,
    panY: 0,
    scale: 1, // Zoom level (1 = 100%, 2 = 200%, etc.)

    // --- Id counters ---
    idCounter: 1,          // For generating unique note ids
    connectorIdCounter: 1, // For generating unique connector ids

    // --- Interaction state ---
    currentTool: 'select', // Tool currently active: 'sticky'|'select'|'connect'
    selectedIds: new Set(), // Keeps track of selected note ids (multi-select supported)
    primarySelectedId: null, // Main selected note id (used for resize handles, etc.)
    dragging: null, // Info about ongoing drag {type:'move'|'pan'|'resize', ...}
    marquee: null,  // Selection rectangle {x1,y1,x2,y2} in world coords
    connectFirst: null, // First note picked in "connect" tool before connecting
    pointerMap: new Map(), // pointerId -> {x,y} for multitouch gestures (panning, zooming)

    // --- Undo/redo history ---
    history: [],         // Array of previous states for undo
    historyIndex: -1,    // Current position in history
    historyLimit: 80,    // Max number of history steps stored

    // --- Options ---
    snapToGrid: false, // Whether notes snap to grid when moved/resized
    gridSize: 16,     // Size of grid squares in px
    showGrid: true,   // Whether grid lines are visible
};

export function getState() { 
  return state; 
}

export function updateState(partial) {
  Object.assign(state, partial);
}
