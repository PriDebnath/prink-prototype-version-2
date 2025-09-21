import { getCanvas, getCtx } from "./index.js";
import { getDarkenColor, worldToScreen } from "./utils.js";
import { getState } from "./state.js";

const canvas = getCanvas();
const ctx = getCtx();

export function isOdd(number) {
  return number % 2
}

export function drawGrid() {
  /// Read it bro!!!!!!!!!!!! 
  // Get current state values from our global state manager
  // - showGrid → whether grid is enabled or not
  // - gridSize → base grid cell size
  // - scale   → current zoom scale
  // - panX, panY → current pan offset of the canvas
  const { showGrid, gridSize, scale, panX, panY } = getState();

  // If grid is disabled, don’t draw anything
  if (!showGrid) return;

  // Each grid step depends on zoom scale
  const step = gridSize * scale;

  // If step is too small, skip drawing to avoid
  // performance issues and overcrowded lines
  if (step < 6) return;

  // Save current canvas state (line style, transforms, etc.)
  // later we’ll restore it so grid drawing doesn’t interfere
  ctx.save();


  // // idea
  // // beginPath() → clear previous path and start a new one.
  // // moveTo(x, y) → place the pen at a starting point.
  // // lineTo(x, y) → define the line you want to draw.
  // // stroke() → draw it on the canvas.

  //   // ---- Vertical grid lines ----
  //   // The starting X depends on panX (so grid scrolls with pan)
  let toggleVerLineWidth = true
  const startX = panX % step;
  for (let x = startX; x < canvas.width; x += step) {
    ctx.beginPath(); //→ clear previous path and start a new one
    ctx.moveTo(x, 0); // top of canvas
    ctx.strokeStyle = "rgba(0,0,0,0.04)"; // very light grey lines
    ctx.lineTo(x, canvas.height); // bottom of canvas
    ///
    // Set line style for the grid
    ctx.strokeStyle = "rgba(0,0,0,0.04)"
    if (toggleVerLineWidth) {
      toggleVerLineWidth = false
    } else {
      toggleVerLineWidth = true
    }

    //ctx.lineWidth = toggleVerLineWidth ? 0.5 : 2;
    ctx.lineWidth = 2

    ctx.stroke(); //→ draw it on the canvas.
  }

  // ---- Horizontal grid lines ----
  // The starting Y depends on panY (so grid scrolls with pan)
  const startY = panY % step;
  let toggleHoriLineWidth = false
  for (let y = startY; y < canvas.height; y += step) {
    ctx.beginPath(); //→ clear previous path and start a new one
    ctx.moveTo(0, y); // left of canvas
    ctx.lineTo(canvas.width, y); // right of canvas
    ///
    // Set line style for the grid

    ctx.strokeStyle = "rgba(0,0,0,0.04)"
    /// 
    if (toggleHoriLineWidth) {
      toggleHoriLineWidth = false
    } else {
      toggleHoriLineWidth = true
    }
    ctx.strokeStyle = "rgba(0,0,0,0.04)"; // very light grey lines
    //ctx.lineWidth = toggleHoriLineWidth ? 0.5 : 2;
    ctx.lineWidth = 2
    ctx.stroke(); //→ draw it on the canvas.
  }

  // Restore canvas state so grid drawing
  // doesn’t mess up other drawings
  ctx.restore();
}

function drawConnectors(connectors, notes) {
  const { connectorBreakPointSelectedId, currentTool } = getState();

  connectors.forEach((conn) => {
    const a = notes.find((n) => n.id === conn.aId);
    const b = notes.find((n) => n.id === conn.bId);
    if (!a || !b) return;

    // Convert A and B to screen coords
    const aC = worldToScreen(a.x + a.w / 2, a.y + a.h / 2);
    const bC = worldToScreen(b.x + b.w / 2, b.y + b.h / 2);

    // Prepare list of all points: A → breakpoints → B
    const allPoints = [aC];
    if (conn.breakPoints && conn.breakPoints.length > 0) {
      conn.breakPoints.forEach((bp) => {
        allPoints.push({
          ...worldToScreen(bp.worldX, bp.worldY),
          id: bp.id
        })
      });
    }
    allPoints.push(bC);

    // === Draw curve segment by segment ===
    ctx.save();
    ctx.strokeStyle = "rgba(30,30,30,0.45)";
    ctx.lineWidth = 3;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];

      ctx.beginPath();

      // draw handle for breakpoint on  connect
      if (currentTool === "connect") {
        let isSelected = connectorBreakPointSelectedId == start.id;
        ctx.arc(start.x, start.y, 4, 0, Math.PI * 2); // circle handle
        ctx.fillStyle = isSelected ? "#2563EB" : "grey";
        ctx.fill();
      }
      // straight line instead of curve
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // draw arrows along this straight line
      const arrowSize = 8;
      const steps = 4; // how many arrows per segment
      for (let j = 1; j <= steps; j++) {
        const t = j / (steps + 1);
        const pt = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        };
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(
          pt.x - arrowSize * Math.cos(angle - Math.PI / 6),
          pt.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          pt.x - arrowSize * Math.cos(angle + Math.PI / 6),
          pt.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = "rgba(30,30,30,0.6)";
        ctx.fill();
      }
    }


    ctx.restore();
  });

}



function drawPens(pens) {
  pens.forEach((pen) => {
    if (pen.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Start at first point
    let { x: p0X, y: p0Y } = pen[0];
    let { x: w0X, y: w0Y } = worldToScreen(p0X, p0Y);
    ctx.moveTo(w0X, w0Y);

    for (let i = 1; i < pen.length - 1; i++) {
      let { x: p1X, y: p1Y } = pen[i];
      let { x: p2X, y: p2Y } = pen[i + 1];

      // Convert both to screen
      let { x: w1X, y: w1Y } = worldToScreen(p1X, p1Y);
      let { x: w2X, y: w2Y } = worldToScreen(p2X, p2Y);

      // Midpoint between p1 and p2
      let midX = (w1X + w2X) / 2;
      let midY = (w1Y + w2Y) / 2;

      // Quadratic curve from previous point to midpoint
      ctx.quadraticCurveTo(w1X, w1Y, midX, midY);
    }

    // Last line to final point
    let last = pen[pen.length - 1];
    if (!last) {
      return
    }
    let { x: wLastX, y: wLastY } = worldToScreen(last.x, last.y);
    ctx.lineTo(wLastX, wLastY);

    ctx.stroke();
  });
  ctx.restore();
}

function drawNotes(notes) {
  notes.forEach((note) => {
    const { scale, selectedIds, primarySelectedId, currentTool } = getState();

    const s = worldToScreen(note.x, note.y);
    const sw = note.w * scale;
    const sh = note.h * scale;

    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(16,24,40,0.2)";
    ctx.shadowBlur = 10;

    // reset
    ctx.beginPath();

    // shape
    ctx.fillStyle = note.color;
    let hasSelected = selectedIds.has(note.id);
    ctx.strokeStyle = hasSelected ? "#2563EB" : getDarkenColor(note.color);
    ctx.lineWidth = hasSelected ? 3 : 1.5;
    ctx.roundRect(s.x, s.y, sw, sh, 8 * scale);
    ctx.fill();
    ctx.stroke();

    // text (scale friendly)
    ctx.fillStyle = "#111827";
    ctx.font = `${note.fontSize}px Inter, system-ui, Arial`;

    const padding = 10 * scale;
    const textMaxWidth = sw - padding * 2;
    const lines = wrapTextLines(ctx, note.text, textMaxWidth);
    //console .log({lines})

    let ty = s.y + padding + 12 * scale;
    for (const line of lines) {
      ctx.fillText(line, s.x + padding, ty);
      ty += 18 * scale;
    }
    ctx.restore();

    // draw handles if single selected
    if (primarySelectedId === note.id && currentTool == 'select') {
      drawHandlesForNote(note);
    }
  });

}

function drawMarqueeSelection(marquee, ctx) {
  if (marquee) {
    ctx.save();
    const a = worldToScreen(marquee.x1, marquee.y1);
    const b = worldToScreen(marquee.x2, marquee.y2);
    const mx = Math.min(a.x, b.x),
      my = Math.min(a.y, b.y);
    const mw = Math.abs(a.x - b.x),
      mh = Math.abs(a.y - b.y);

    ctx.strokeStyle = "rgba(37,99,235,0.6)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = "rgba(37,99,235,0.06)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.restore();
  }
}

export function draw() {
  const {
    connectors,
    notes,
    selectedIds,
    primarySelectedId,
    scale,
    panX,
    panY,
    marquee,
    bg,
    pens
  } = getState();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  drawGrid();

  // connectors first (so notes draw on top)
  drawConnectors(connectors, notes)

  // pens---------------------------
  drawPens(pens)

  // notes---------------------------
  drawNotes(notes)

  // marquee selection (screen coords)
  drawMarqueeSelection(marquee, ctx)
}



export function drawHandlesForNote(note) {
  const { scale } = getState();

  const s = worldToScreen(note.x, note.y);
  const sw = note.w * scale;
  const sh = note.h * scale;
  const size = Math.max(8, 8 * scale);
  const half = size / 1;

  // How much larger the clickable area should be
  const hitSize = size * 8;
  const hitHalf = hitSize / 1.2;

  const handles = [
    { x: s.x - half, y: s.y - half, cursor: "nwse-resize", name: "nw" },
    { x: s.x + sw - half, y: s.y - half, cursor: "nesw-resize", name: "ne" },
    { x: s.x - half, y: s.y + sh - half, cursor: "nesw-resize", name: "sw" },
    { x: s.x + sw - half, y: s.y + sh - half, cursor: "nwse-resize", name: "se" },
  ];

  // Add bigger hit zones
  for (const h of handles) {
    h.hitX = h.x - (hitHalf - half);
    h.hitY = h.y - (hitHalf - half);
    h.hitW = hitSize;
    h.hitH = hitSize;
  }

  // Draw the visible small handles
  ctx.save();
  ctx.fillStyle = "skylue";
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1.5;
  for (const h of handles) {
    ctx.beginPath();
    // ctx.rect(h.x, h.y, size, size); // square handle
    ctx.arc(h.x + half, h.y + half, half, 0, Math.PI * 2); // circle handle
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Return handles with both visual and hit areas
  return handles;
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