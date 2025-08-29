

// import { getCanvas } from "./index.js";
// import { getCtx } from "./index.js";
// import { worldToScreen } from "./utils.js";

// const canvas = getCanvas();
// const ctx = getCtx();

// import { getState } from "./state.js";
// let {
//     currentTool,
//     connectors,
//     notes,
//     selectedIds,
//     history,
//     historyIndex,
//     historyLimit,
//     primarySelectedId,
//     showGrid,
//     gridSize,
//     scale,
//     panX,
//     panY,
//     marquee,
//     pointerMap,
//     dragging,
//     idCounter,
//     connectorIdCounter,
//     connectFirst
// } = getState()

// export function drawGrid() {
//     if (!showGrid) return;
//     const step = gridSize * scale;
//     if (step < 6) return; // avoid drawing too dense
//     ctx.save();
//     ctx.strokeStyle = 'rgba(0,0,0,0.04)';
//     ctx.lineWidth = 1;
//     // vertical lines
//     const startX = panX % step;
//     for (let x = startX; x < canvas.width; x += step) {
//         ctx.beginPath();
//         ctx.moveTo(x, 0);
//         ctx.lineTo(x, canvas.height);
//         ctx.stroke();
//     }
//     // horizontal lines
//     const startY = panY % step;
//     for (let y = startY; y < canvas.height; y += step) {
//         ctx.beginPath();
//         ctx.moveTo(0, y);
//         ctx.lineTo(canvas.width, y);
//         ctx.stroke();
//     }
//     ctx.restore();
// }

// export function draw() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     // background
//     ctx.fillStyle = '#f7f9fc';
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//     // grid
//     drawGrid();

//     // connectors first (so notes draw on top)
//     connectors.forEach(conn => {
//         const a = notes.find(n => n.id === conn.aId);
//         const b = notes.find(n => n.id === conn.bId);
//         if (!a || !b) return;
//         const aC = worldToScreen(a.x + a.w / 2, a.y + a.h / 2);
//         const bC = worldToScreen(b.x + b.w / 2, b.y + b.h / 2);
//         // simple bezier
//         ctx.save();
//         ctx.strokeStyle = 'rgba(30,30,30,0.45)';

//         ctx.lineWidth = 2;
//         ctx.beginPath();
//         ctx.moveTo(aC.x, aC.y);
//         const dx = (bC.x - aC.x) * 0.4;
//         ctx.bezierCurveTo(aC.x + dx, aC.y, bC.x - dx, bC.y, bC.x, bC.y);
//         ctx.stroke();
//         // arrow head
//         const angle = Math.atan2(bC.y - aC.y, bC.x - aC.x);
//         const arrowSize = 8;
//         ctx.beginPath();
//         ctx.moveTo(bC.x, bC.y);
//         ctx.lineTo(bC.x - arrowSize * Math.cos(angle - Math.PI / 6), bC.y - arrowSize * Math.sin(
//             angle - Math.PI / 6));
//         ctx.lineTo(bC.x - arrowSize * Math.cos(angle + Math.PI / 6), bC.y - arrowSize * Math.sin(
//             angle + Math.PI / 6));
//         ctx.closePath();
//         ctx.fillStyle = 'rgba(30,30,30,0.6)';
//         ctx.fill();
//         ctx.restore();
//     });

//     // notes
//     notes.forEach(note => {
//         const s = worldToScreen(note.x, note.y);
//         const sw = note.w * scale;
//         const sh = note.h * scale;

//         // shadow
//         ctx.save();
//         ctx.shadowColor = 'rgba(16,24,40,0.08)';
//         ctx.shadowBlur = 10;

//         // reset 
//         ctx.beginPath()

//         // shape
//         ctx.fillStyle = note.color;
//         let hasSelected = selectedIds.has(note.id)
//         ctx.strokeStyle = hasSelected ? 'blue' : 'red';


//         ctx.lineWidth = hasSelected ? 3 : 1.5;
//         ctx.roundRect(s.x, s.y, sw, sh, 8 * scale);
//         ctx.fill();
//         ctx.stroke();

//         // text (scale friendly)
//         ctx.fillStyle = '#111827';
//         ctx.font = `${Math.max(12, 14 * scale)}px Inter, system-ui, Arial`;
//         // draw wrapped text manually: convert max width in world units and scale text position
//         const padding = 10 * scale;
//         const textMaxWidth = sw - padding * 2;
//         const lines = wrapTextLines(ctx, note.text, textMaxWidth);
//         let ty = s.y + padding + (12 * scale);
//         for (const line of lines) {
//             ctx.fillText(line, s.x + padding, ty);
//             ty += (18 * scale);
//         }
//         ctx.restore();

//         // draw handles if single selected
//         if (primarySelectedId === note.id) {
//             drawHandlesForNote(note);
//         }
//     });

//     // marquee selection (screen coords)
//     if (marquee) {
//         ctx.save();
//         const a = worldToScreen(marquee.x1, marquee.y1);
//         const b = worldToScreen(marquee.x2, marquee.y2);
//         const mx = Math.min(a.x, b.x),
//             my = Math.min(a.y, b.y);
//         const mw = Math.abs(a.x - b.x),
//             mh = Math.abs(a.y - b.y);
//         ctx.strokeStyle = 'rgba(37,99,235,0.6)';
//         ctx.lineWidth = 1.5;
//         ctx.setLineDash([6, 6]);
//         ctx.strokeRect(mx, my, mw, mh);
//         ctx.fillStyle = 'rgba(37,99,235,0.06)';
//         ctx.fillRect(mx, my, mw, mh);
//         ctx.restore();
//     }
// }

// export function drawHandlesForNote(note) {
//     const s = worldToScreen(note.x, note.y);
//     const sw = note.w * scale,
//         sh = note.h * scale;
//     const size = Math.max(8, 8 * scale);
//     const half = size / 2;
//     const handles = [
//         { x: s.x - half, y: s.y - half, cursor: 'nwse-resize', name: 'nw' },
//         { x: s.x + sw - half, y: s.y - half, cursor: 'nesw-resize', name: 'ne' },
//         { x: s.x - half, y: s.y + sh - half, cursor: 'nesw-resize', name: 'sw' },
//         { x: s.x + sw - half, y: s.y + sh - half, cursor: 'nwse-resize', name: 'se' }
//     ];
//     ctx.save();
//     ctx.fillStyle = '#fff';
//     ctx.strokeStyle = '#666';
//     ctx.lineWidth = 1;
//     for (const h of handles) {
//         ctx.beginPath();
//         ctx.rect(h.x, h.y, size, size);
//         ctx.fill();
//         ctx.stroke();
//     }
//     ctx.restore();
// }


// export function wrapTextLines(ctx, text, maxWidth) {
//     if (!text) return [''];
//     const words = String(text).split(/\s+/);
//     const lines = [];
//     let line = '';
//     for (let i = 0; i < words.length; i++) {
//         const test = line ? (line + ' ' + words[i]) : words[i];
//         if (ctx.measureText(test).width > maxWidth && line) {
//             lines.push(line);
//             line = words[i];
//         } else { line = test; }
//     }
//     lines.push(line);
//     return lines;
// }

// console.log("drawing.js loaded")
// drawing.js
import { getCanvas, getCtx } from "./index.js";
import { worldToScreen } from "./utils.js";
import { getState } from "./state.js";

const canvas = getCanvas();
const ctx = getCtx();

export function drawGrid() {
  const { showGrid, gridSize, scale, panX, panY } = getState();

  if (!showGrid) return;
  const step = gridSize * scale;
  if (step < 6) return; // avoid drawing too dense

  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;

  // vertical lines
  const startX = panX % step;
  for (let x = startX; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // horizontal lines
  const startY = panY % step;
  for (let y = startY; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function draw() {
  const {
    connectors,
    notes,
    selectedIds,
    primarySelectedId,
    scale,
    marquee,
  } = getState();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#f7f9fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  drawGrid();

  // connectors first (so notes draw on top)
  connectors.forEach((conn) => {
    const a = notes.find((n) => n.id === conn.aId);
    const b = notes.find((n) => n.id === conn.bId);
    if (!a || !b) return;

    const aC = worldToScreen(a.x + a.w / 2, a.y + a.h / 2);
    const bC = worldToScreen(b.x + b.w / 2, b.y + b.h / 2);

    // simple bezier
    ctx.save();
    ctx.strokeStyle = "rgba(30,30,30,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(aC.x, aC.y);
    const dx = (bC.x - aC.x) * 0.4;
    ctx.bezierCurveTo(aC.x + dx, aC.y, bC.x - dx, bC.y, bC.x, bC.y);
    ctx.stroke();

    // arrow head
    const angle = Math.atan2(bC.y - aC.y, bC.x - aC.x);
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(bC.x, bC.y);
    ctx.lineTo(
      bC.x - arrowSize * Math.cos(angle - Math.PI / 6),
      bC.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      bC.x - arrowSize * Math.cos(angle + Math.PI / 6),
      bC.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(30,30,30,0.6)";
    ctx.fill();
    ctx.restore();
  });

  // notes
  notes.forEach((note) => {
    const { scale, selectedIds, primarySelectedId } = getState();

    const s = worldToScreen(note.x, note.y);
    const sw = note.w * scale;
    const sh = note.h * scale;

    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(16,24,40,0.08)";
    ctx.shadowBlur = 10;

    // reset
    ctx.beginPath();

    // shape
    ctx.fillStyle = note.color;
    let hasSelected = selectedIds.has(note.id);
    ctx.strokeStyle = hasSelected ? "blue" : "red";
    ctx.lineWidth = hasSelected ? 3 : 1.5;
    ctx.roundRect(s.x, s.y, sw, sh, 8 * scale);
    ctx.fill();
    ctx.stroke();

    // text (scale friendly)
    ctx.fillStyle = "#111827";
    ctx.font = `${Math.max(12, 14 * scale)}px Inter, system-ui, Arial`;

    const padding = 10 * scale;
    const textMaxWidth = sw - padding * 2;
    const lines = wrapTextLines(ctx, note.text, textMaxWidth);

    let ty = s.y + padding + 12 * scale;
    for (const line of lines) {
      ctx.fillText(line, s.x + padding, ty);
      ty += 18 * scale;
    }
    ctx.restore();

    // draw handles if single selected
    if (primarySelectedId === note.id) {
      drawHandlesForNote(note);
    }
  });

  // marquee selection (screen coords)
  if (marquee) {
    ctx.save();
    const a = worldToScreen(marquee.x1, marquee.y1);
    const b = worldToScreen(marquee.x2, marquee.y2);
    const mx = Math.min(a.x, b.x),
      my = Math.min(a.y, b.y);
    const mw = Math.abs(a.x - b.x),
      mh = Math.abs(a.y - b.y);

    ctx.strokeStyle = "rgba(37,99,235,0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = "rgba(37,99,235,0.06)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.restore();
  }
}

export function drawHandlesForNote(note) {
  const { scale } = getState();

  const s = worldToScreen(note.x, note.y);
  const sw = note.w * scale,
    sh = note.h * scale;
  const size = Math.max(8, 8 * scale);
  const half = size / 2;

  const handles = [
    { x: s.x - half, y: s.y - half, cursor: "nwse-resize", name: "nw" },
    { x: s.x + sw - half, y: s.y - half, cursor: "nesw-resize", name: "ne" },
    { x: s.x - half, y: s.y + sh - half, cursor: "nesw-resize", name: "sw" },
    { x: s.x + sw - half, y: s.y + sh - half, cursor: "nwse-resize", name: "se" },
  ];

  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  for (const h of handles) {
    ctx.beginPath();
    ctx.rect(h.x, h.y, size, size);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function wrapTextLines(ctx, text, maxWidth) {
  if (!text) return [""];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  lines.push(line);
  return lines;
}

console.log("drawing.js loaded");
