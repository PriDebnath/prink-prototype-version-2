const state = {
    notes: [], // {id, x, y, w, h, text, color}
    connectors: [], // {id, a, b}

    // Viewport transform
    panX: 0,
    panY: 0,
    scale: 1,

    // Id counters 
    idCounter: 1,
    connectorIdCounter: 1,

    // interaction state
    currentTool: 'sticky',// 'sticky'|'select'|'connect'
    selectedIds: new Set(),// support multi-select
    primarySelectedId: null,// for resize/handles (single)
    dragging: null,// {type:'move'|'pan'|'resize', info...}
    marquee: null,// {x1,y1,x2,y2} in world coords
    connectFirst: null,// for connect tool: first note selected
    pointerMap: new Map(),// pointerId -> {x,y} for gestures

    // undo/redo
    history: [],
    historyIndex: -1,
    historyLimit: 80,

    // options
    snapToGrid: true,
    gridSize: 16,
    showGrid: true,
};


export function getState() { return state; }
