// ====== State ======
const svg = document.getElementById('svgRoot');
const world = document.getElementById('world');
const overlay = document.getElementById('overlay');
const view = document.getElementById('view');
const minimap = document.getElementById('minimap');
const framesPanel = document.getElementById('framesPanel');
const toolLabel = document.getElementById('toolLabel');
const zoomLabel = document.getElementById('zoomLabel');
const selCount = document.getElementById('selCount');
const snapBadge = document.getElementById('snapBadge');
const inlineEditor = document.getElementById('inlineEditor');
const inlineInput = document.getElementById('inlineInput');

let state = {
    tool: 'select',
    scale: 1,
    translate: { x: 0, y: 0 },
    snap: true,
    pointers: new Map(),
    selected: new Set(),
    groups: new Map(), // groupId -> <g>
    connections: [],   // {line, fromId, toId}
};

const cfg = {
    grid: 20,
    maxScale: 4,
    minScale: 0.2
};

function uid() { return 'id_' + Math.random().toString(36).slice(2, 9) }
function snap(n) { return state.snap ? Math.round(n / cfg.grid) * cfg.grid : n }
function applyTransform() { world.setAttribute('transform', `translate(${state.translate.x},${state.translate.y}) scale(${state.scale})`); overlay.setAttribute('transform', `translate(${state.translate.x},${state.translate.y}) scale(${state.scale})`); zoomLabel.textContent = Math.round(state.scale * 100) + '%'; drawMinimap(); }
function worldToScreen(p) { return { x: p.x * state.scale + state.translate.x, y: p.y * state.scale + state.translate.y } }
function screenToWorld(p) { return { x: (p.x - state.translate.x) / state.scale, y: (p.y - state.translate.y) / state.scale } }

// ====== Tools ======
const tools = document.getElementById('tools');
tools.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setTool(b.dataset.tool); });
function setTool(t) { state.tool = t; toolLabel.textContent = t[0].toUpperCase() + t.slice(1);[...tools.children].forEach(b => b.classList.toggle('active', b.dataset.tool === t)); }

// Style controls
const fillEl = document.getElementById('fill');
const strokeEl = document.getElementById('stroke');
const strokeWEl = document.getElementById('strokeW');
document.getElementById('toggleSnap').onclick = () => { state.snap = !state.snap; snapBadge.textContent = 'Snap: ' + (state.snap ? 'on' : 'off'); }

// ====== Creation helpers ======
function createNode(type, attrs = {}) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    n.dataset.id = attrs.id || uid();
    n.dataset.type = type;
    world.appendChild(n);
    attachNodeEvents(n);
    return n;
}

function addRect(x, y, w = 160, h = 100) { return createNode('rect', { id: uid(), x: snap(x), y: snap(y), width: snap(w), height: snap(h), rx: 6, fill: fillEl.value, stroke: strokeEl.value, 'stroke-width': strokeWEl.value }); }
function addEllipse(x, y, w = 140, h = 100) { return createNode('ellipse', { id: uid(), cx: snap(x + w / 2), cy: snap(y + h / 2), rx: snap(w / 2), ry: snap(h / 2), fill: fillEl.value, stroke: strokeEl.value, 'stroke-width': strokeWEl.value }); }
function addSticky(x, y, w = 160, h = 120) { return createNode('rect', { id: uid(), x: snap(x), y: snap(y), width: snap(w), height: snap(h), rx: 10, fill: fillEl.value, stroke: '#d4a373', 'stroke-width': 1.5 }); }
function addText(x, y, text = 'Text') { const t = createNode('text', { id: uid(), x: snap(x), y: snap(y + 18), 'font-size': 16, fill: '#111' }); t.textContent = text; return t; }
function addFrame(x, y, w = 400, h = 300) { const f = createNode('rect', { id: uid(), x: snap(x), y: snap(y), width: snap(w), height: snap(h), fill: 'none', stroke: '#9aa3b2', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }); f.dataset.role = 'frame'; refreshFramesPanel(); return f; }
function addConnector(fromNode, toNode) { const a = fromNode.getBBox(), b = toNode.getBBox(); const x1 = a.x + a.width / 2, y1 = a.y + a.height / 2, x2 = b.x + b.width / 2, y2 = b.y + b.height / 2; const line = createNode('line', { id: uid(), x1, y1, x2, y2, stroke: strokeEl.value, 'stroke-width': strokeWEl.value, 'marker-end': 'url(#arrow)' }); line.dataset.role = 'connector'; state.connections.push({ line, fromId: fromNode.dataset.id, toId: toNode.dataset.id }); return line; }

// ====== Selection ======
function clearSelection() { state.selected.clear(); overlay.querySelectorAll('#selBox,#selMarquee').forEach(n => n.remove()); selCount.textContent = '0'; }
function selectOne(n, append) { if (!append) clearSelection(); state.selected.add(n); drawSelectionBoxes(); selCount.textContent = String(state.selected.size); }
function toggleSelect(n) { if (state.selected.has(n)) state.selected.delete(n); else state.selected.add(n); drawSelectionBoxes(); selCount.textContent = String(state.selected.size); }

function drawSelectionBoxes() { overlay.querySelectorAll('#selBox').forEach(n => n.remove()); state.selected.forEach(n => { const bb = n.getBBox(); const r = createNode('rect', { x: bb.x - 6, y: bb.y - 6, width: bb.width + 12, height: bb.height + 12, fill: 'none', stroke: '#2563eb', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }); r.id = 'selBox'; overlay.appendChild(r); }); }

// ====== Guides (alignment) ======
function showGuides(movingNode) { overlay.querySelectorAll('.guide').forEach(n => n.remove()); const mb = movingNode.getBBox(); const mEdges = [mb.x, mb.x + mb.width / 2, mb.x + mb.width]; const mV = [mb.y, mb.y + mb.height / 2, mb.y + mb.height];[...world.children].forEach(n => { if (n === movingNode || n.id === '__ghost') return; const bb = n.getBBox(); const edges = [bb.x, bb.x + bb.width / 2, bb.x + bb.width]; const v = [bb.y, bb.y + bb.height / 2, bb.y + bb.height]; edges.forEach(e => { mEdges.forEach(me => { if (Math.abs(e - me) < 4) { const g = createNode('line', { x1: e, y1: bb.y - 1000, x2: e, y2: bb.y + bb.height + 1000 }); g.classList.add('guide'); overlay.appendChild(g); } }) }); v.forEach(e => { mV.forEach(me => { if (Math.abs(e - me) < 4) { const g = createNode('line', { x1: bb.x - 1000, y1: e, x2: bb.x + bb.width + 1000, y2: e }); g.classList.add('guide'); overlay.appendChild(g); } }) }); }); }

// ====== Pointer interactions ======
let dragMode = null; // 'pan' | 'create' | 'move' | 'marquee'
let tempNode = null; let startW = null; let marquee = null;

svg.addEventListener('pointerdown', (ev) => {
    svg.setPointerCapture(ev.pointerId); state.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const isBg = (ev.target === svg || ev.target === view || ev.target === overlay);
    const ws = screenToWorld({ x: ev.clientX, y: ev.clientY });

    if (state.tool === 'select') {
        if (isBg) {
            // start marquee
            dragMode = 'marquee'; marquee = createNode('rect', { id: 'selMarquee', x: ws.x, y: ws.y, width: 1, height: 1, fill: 'rgba(37,99,235,.12)', stroke: '#2563eb', 'stroke-dasharray': '6 4' }); overlay.appendChild(marquee);
        } else {
            // start move of clicked element
            dragMode = 'move'; tempNode = ev.target.closest('[data-id]'); startW = { n: tempNode, bb: tempNode.getBBox(), start: ws }; if (!ev.shiftKey) selectOne(tempNode, false); else toggleSelect(tempNode);
        }
    } else if (['rect', 'ellipse', 'sticky', 'frame'].includes(state.tool)) {
        dragMode = 'create'; const attrs = {}; tempNode = state.tool === 'rect' ? addRect(ws.x, ws.y, 1, 1) : state.tool === 'ellipse' ? addEllipse(ws.x, ws.y, 1, 1) : state.tool === 'sticky' ? addSticky(ws.x, ws.y, 1, 1) : addFrame(ws.x, ws.y, 1, 1);
    } else if (state.tool === 'text') {
        const t = addText(ws.x, ws.y, 'Text'); selectOne(t); openInlineEditor(t);
    } else if (state.tool === 'pen') {
        dragMode = 'create'; tempNode = createNode('path', { d: `M ${ws.x} ${ws.y}`, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'fill': 'none', stroke: strokeEl.value, 'stroke-width': strokeWEl.value });
    } else if (state.tool === 'line') {
        dragMode = 'create'; tempNode = createNode('line', { x1: ws.x, y1: ws.y, x2: ws.x, y2: ws.y, stroke: strokeEl.value, 'stroke-width': strokeWEl.value, 'marker-end': 'url(#arrow)' }); tempNode.dataset.role = 'connector-temp';
    }
});

svg.addEventListener('pointermove', (ev) => {
    if (state.pointers.has(ev.pointerId)) state.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const ws = screenToWorld({ x: ev.clientX, y: ev.clientY });

    if (dragMode === 'marquee' && marquee) { const x = parseFloat(marquee.getAttribute('x')), y = parseFloat(marquee.getAttribute('y')); marquee.setAttribute('width', snap(Math.abs(ws.x - x))); marquee.setAttribute('height', snap(Math.abs(ws.y - y))); marquee.setAttribute('x', Math.min(x, ws.x)); marquee.setAttribute('y', Math.min(y, ws.y)); }
    else if (dragMode === 'create' && tempNode) {
        if (tempNode.tagName === 'rect' && !tempNode.dataset.role) { const x = parseFloat(tempNode.getAttribute('x')), y = parseFloat(tempNode.getAttribute('y')); tempNode.setAttribute('width', snap(Math.abs(ws.x - x))); tempNode.setAttribute('height', snap(Math.abs(ws.y - y))); tempNode.setAttribute('x', Math.min(x, ws.x)); tempNode.setAttribute('y', Math.min(y, ws.y)); }
        else if (tempNode.tagName === 'ellipse') { const cx = parseFloat(tempNode.getAttribute('cx')), cy = parseFloat(tempNode.getAttribute('cy')); tempNode.setAttribute('rx', Math.abs(ws.x - cx)); tempNode.setAttribute('ry', Math.abs(ws.y - cy)); }
        else if (tempNode.tagName === 'path') { tempNode.setAttribute('d', tempNode.getAttribute('d') + ` L ${ws.x} ${ws.y}`); }
        else if (tempNode.tagName === 'line') { tempNode.setAttribute('x2', ws.x); tempNode.setAttribute('y2', ws.y); }
    }
    else if (dragMode === 'move' && startW) {
        // move all selected nodes by delta
        const dx = ws.x - startW.start.x; const dy = ws.y - startW.start.y;
        state.selected.forEach(n => {
            showGuides(n);
            if (n.tagName === 'rect' && n.dataset.role !== 'frame') { n.setAttribute('x', snap(startWMap.get(n).x + dx)); n.setAttribute('y', snap(startWMap.get(n).y + dy)); }
            else if (n.tagName === 'ellipse') { n.setAttribute('cx', snap(startWMap.get(n).cx + dx)); n.setAttribute('cy', snap(startWMap.get(n).cy + dy)); }
            else if (n.tagName === 'text') { n.setAttribute('x', snap(startWMap.get(n).x + dx)); n.setAttribute('y', snap(startWMap.get(n).y + dy)); }
            else if (n.tagName === 'rect' && n.dataset.role === 'frame') { n.setAttribute('x', snap(startWMap.get(n).x + dx)); n.setAttribute('y', snap(startWMap.get(n).y + dy)); }
            else if (n.tagName === 'path') { /* skip */ }
            else if (n.tagName === 'line' && n.dataset.role === 'connector') { // managed by attachments
            }
        });
        drawSelectionBoxes();
        updateConnectors();
    }

    // pinch to zoom
    if (state.pointers.size === 2) {
        const [p1, p2] = [...state.pointers.values()];
        const cur = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (!state._pinch) { state._pinch = { start: cur, scale: state.scale, center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } }; }
        else { const factor = cur / state._pinch.start; const center = state._pinch.center; const before = screenToWorld(center); state.scale = Math.min(cfg.maxScale, Math.max(cfg.minScale, state._pinch.scale * factor)); const after = screenToWorld(center); state.translate.x += (center.x - (after.x * state.scale + state.translate.x)) - (center.x - (before.x * state.scale + state.translate.x)); applyTransform(); }
    }
});

svg.addEventListener('pointerup', (ev) => {
    svg.releasePointerCapture(ev.pointerId); state.pointers.delete(ev.pointerId);
    overlay.querySelectorAll('.guide').forEach(n => n.remove());

    if (dragMode === 'marquee' && marquee) {
        const mb = marquee.getBBox(); clearSelection();
        [...world.children].forEach(n => { const bb = n.getBBox(); if (bb.x >= mb.x && bb.y >= mb.y && bb.x + bb.width <= mb.x + mb.width && bb.y + bb.height <= mb.y + mb.height) { state.selected.add(n); } });
        drawSelectionBoxes(); selCount.textContent = String(state.selected.size); marquee.remove(); marquee = null;
    }

    if (dragMode === 'create' && tempNode) {
        if (tempNode.dataset.role === 'connector-temp') {
            const pt = { x: ev.clientX, y: ev.clientY }; const ws = screenToWorld(pt);
            // find target node under cursor
            const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#world [data-id]');
            const start = world.querySelector('[data-id="' + tempNode.dataset.id + '"]');
            if (target && target !== start) {
                tempNode.dataset.role = 'connector'; // attach
                const nearest = world.querySelector('[data-id]');
                const from = getNearestNodeToLineStart(tempNode) || start; // simplified
                addAttachment(tempNode, from, target);
            } else { tempNode.remove(); }
        }
        tempNode = null;
    }

    if (dragMode === 'move') { save(); }
    dragMode = null; state._pinch = null; startW = null; startWMap = null;
});

// cache of starting positions for multi-move
let startWMap = null;
svg.addEventListener('pointerdown', (ev) => {
    if (state.tool === 'select' && ev.target.closest('#world [data-id]')) {
        // fill start positions for all selected
        startWMap = new Map();
        state.selected.forEach(n => {
            if (n.tagName === 'rect' && n.dataset.role !== 'frame') startWMap.set(n, { x: parseFloat(n.getAttribute('x')), y: parseFloat(n.getAttribute('y')) });
            else if (n.tagName === 'ellipse') startWMap.set(n, { cx: parseFloat(n.getAttribute('cx')), cy: parseFloat(n.getAttribute('cy')) });
            else if (n.tagName === 'text') startWMap.set(n, { x: parseFloat(n.getAttribute('x')), y: parseFloat(n.getAttribute('y')) });
            else if (n.tagName === 'rect' && n.dataset.role === 'frame') startWMap.set(n, { x: parseFloat(n.getAttribute('x')), y: parseFloat(n.getAttribute('y')) });
        });
    }
});

// ====== Node events (tap to select, double to edit text) ======
function attachNodeEvents(n) {
    n.addEventListener('pointerdown', (e) => { if (state.tool === 'select') { if (e.shiftKey) toggleSelect(n); else selectOne(n, false); } e.stopPropagation(); });
    n.addEventListener('dblclick', (e) => { if (n.tagName === 'text') openInlineEditor(n); e.stopPropagation(); });
}

function openInlineEditor(n) {
    const bb = n.getBBox(); const screen = worldToScreen({ x: bb.x, y: bb.y });
    inlineEditor.style.left = (screen.x + 8) + 'px'; inlineEditor.style.top = (screen.y + 8) + 'px';
    inlineInput.value = n.textContent || '';
    inlineEditor.style.display = 'block'; inlineInput.focus();
    document.getElementById('inlineSave').onclick = () => { n.textContent = inlineInput.value; inlineEditor.style.display = 'none'; save(); };
}

// ====== Group / Ungroup ======
function groupSelected() {
    if (state.selected.size < 2) return alert('Select 2+ items to group'); const gid = uid(); const g = createNode('g', { id: gid }); // move nodes into group
    const items = [...state.selected]; items.forEach(n => g.appendChild(n)); clearSelection(); state.selected.add(g); drawSelectionBoxes(); state.groups.set(gid, g); save();
}
function ungroupSelected() { const items = [...state.selected].filter(n => n.tagName === 'g'); if (!items.length) return; items.forEach(g => { while (g.firstChild) world.appendChild(g.firstChild); g.remove(); state.groups.delete(g.id); }); clearSelection(); save(); }

// ====== Lock ======
function setLock(flag) { state.selected.forEach(n => { n.dataset.locked = flag ? 'true' : 'false'; n.style.opacity = flag ? .6 : 1; }); save(); }

// ====== Connectors attachment ======
function addAttachment(line, fromNode, toNode) { line.dataset.role = 'connector'; line.dataset.from = fromNode.dataset.id; line.dataset.to = toNode.dataset.id; updateConnector(line); state.connections.push({ line, fromId: fromNode.dataset.id, toId: toNode.dataset.id }); save(); }
function centerOf(n) { const b = n.getBBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }
function updateConnector(line) { const from = world.querySelector(`[data-id="${line.dataset.from}"]`); const to = world.querySelector(`[data-id="${line.dataset.to}"]`); if (!from || !to) return; const a = centerOf(from), b = centerOf(to); line.setAttribute('x1', a.x); line.setAttribute('y1', a.y); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y); }
function updateConnectors() { state.connections.forEach(c => updateConnector(c.line)); }

// ====== Zoom / Fit / Clear ======
document.getElementById('zoomIn').onclick = () => { zoom(1.2) }; document.getElementById('zoomOut').onclick = () => { zoom(1 / 1.2) };
function zoom(f) { const cx = svg.clientWidth / 2, cy = svg.clientHeight / 2; const before = screenToWorld({ x: cx, y: cy }); state.scale = Math.min(cfg.maxScale, Math.max(cfg.minScale, state.scale * f)); const after = screenToWorld({ x: cx, y: cy }); state.translate.x += (cx - (after.x * state.scale + state.translate.x)) - (cx - (before.x * state.scale + state.translate.x)); state.translate.y += (cy - (after.y * state.scale + state.translate.y)) - (cy - (before.y * state.scale + state.translate.y)); applyTransform(); }

document.getElementById('fitBtn').onclick = () => { const bb = world.getBBox(); const vw = svg.clientWidth, vh = svg.clientHeight; const s = Math.min(vw / bb.width, vh / bb.height) * 0.9; state.scale = Math.min(cfg.maxScale, Math.max(cfg.minScale, s)); state.translate.x = (vw - bb.width * state.scale) / 2 - bb.x * state.scale; state.translate.y = (vh - bb.height * state.scale) / 2 - bb.y * state.scale; applyTransform(); };

document.getElementById('clearBtn').onclick = () => { if (confirm('Clear board?')) { world.innerHTML = ''; overlay.innerHTML = ''; state.selected.clear(); state.connections = []; refreshFramesPanel(); save(); drawMinimap(); } };

// ====== Templates ======
function insertTemplate(key) {
    if (key === 'flow') { const a = addRect(40, 40), b = addRect(260, 40), c = addRect(480, 40); const t1 = addText(70, 35, 'Start'); const t2 = addText(290, 35, 'Process'); const t3 = addText(515, 35, 'End'); addConnector(a, b); addConnector(b, c); }
    else if (key === 'mind') { const root = addSticky(300, 200, 160, 120); addText(320, 210, 'Topic'); const n1 = addSticky(100, 200, 140, 100); const n2 = addSticky(520, 200, 140, 100); addConnector(root, n1); addConnector(root, n2); }
    else if (key === 'kanban') { const f = addFrame(40, 40, 900, 500); const c1 = addSticky(60, 60, 260, 420); const c2 = addSticky(340, 60, 260, 420); const c3 = addSticky(620, 60, 260, 420); addText(160, 60, 'To Do'); addText(440, 60, 'Doing'); addText(720, 60, 'Done'); }
    save();
}

document.getElementById('insertTpl').onclick = () => { const key = document.getElementById('templatePicker').value; if (!key) return; insertTemplate(key); };

// ====== Frames panel ======
function refreshFramesPanel() { framesPanel.innerHTML = '';[...world.querySelectorAll('[data-role="frame"]')].forEach((f, i) => { const b = f.getBBox(); const btn = document.createElement('button'); btn.textContent = `Frame ${i + 1}  (${Math.round(b.width)}×${Math.round(b.height)})`; btn.onclick = () => { const vw = svg.clientWidth, vh = svg.clientHeight; const s = Math.min(vw / b.width, vh / b.height) * 0.9; state.scale = Math.min(cfg.maxScale, Math.max(cfg.minScale, s)); state.translate.x = (vw - b.width * state.scale) / 2 - b.x * state.scale; state.translate.y = (vh - b.height * state.scale) / 2 - b.y * state.scale; applyTransform(); }; framesPanel.appendChild(btn); }); }

// ====== Minimap ======
function drawMinimap() {
    const w = svg.clientWidth, h = svg.clientHeight; const bb = world.getBBox(); const scale = Math.min((minimap.clientWidth - 10) / Math.max(bb.width, 1), (minimap.clientHeight - 10) / Math.max(bb.height, 1)); const pad = 5; const s = scale || 0.2; minimap.innerHTML = ''; const msvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); msvg.setAttribute('width', minimap.clientWidth); msvg.setAttribute('height', minimap.clientHeight); const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('transform', `translate(${pad - bb.x * s},${pad - bb.y * s}) scale(${s})`); g.innerHTML = world.innerHTML; msvg.appendChild(g); // viewport rect
    const vRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); const topLeft = screenToWorld({ x: 0, y: 0 }); const bottomRight = screenToWorld({ x: w, y: h }); vRect.setAttribute('x', topLeft.x); vRect.setAttribute('y', topLeft.y); vRect.setAttribute('width', bottomRight.x - topLeft.x); vRect.setAttribute('height', bottomRight.y - topLeft.y); vRect.setAttribute('fill', 'none'); vRect.setAttribute('stroke', '#2563eb'); vRect.setAttribute('stroke-width', '2'); g.appendChild(vRect); minimap.appendChild(msvg);
}

// ====== Export ======
function exportSVG() { const out = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); out.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); out.setAttribute('width', svg.clientWidth); out.setAttribute('height', svg.clientHeight); const g = world.cloneNode(true); g.removeAttribute('transform'); out.appendChild(g); const s = new XMLSerializer().serializeToString(out); const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'board.svg'; a.click(); URL.revokeObjectURL(url); }

function exportPNG() { const serializer = new XMLSerializer(); const s = serializer.serializeToString(svg); const img = new Image(); const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml;charset=utf-8' })); img.onload = function () { const c = document.createElement('canvas'); c.width = svg.clientWidth; c.height = svg.clientHeight; const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); c.toBlob(function (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'board.png'; a.click(); }); }; img.src = url; }

function exportPDF() { // no external libs; use print-to-PDF fallback
    const serializer = new XMLSerializer(); const s = serializer.serializeToString(svg);
    const w = window.open('', '_blank'); w.document.write(`<html><head><title>Export PDF</title></head><body style="margin:0">`);
    w.document.write(`<img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(s)))}" style="width:100%;height:auto"/>`);
    w.document.write(`</body></html>`); w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

document.getElementById('exportSvg').onclick = exportSVG;
document.getElementById('exportPng').onclick = exportPNG;
document.getElementById('exportPdf').onclick = exportPDF;

// ====== Persistence ======
function save() { try { localStorage.setItem('mirolite_full_v1', JSON.stringify({ inner: world.innerHTML, scale: state.scale, translate: state.translate })); } catch (e) { } }
function load() {
    try {
        const raw = localStorage.getItem('mirolite_full_v1'); if (!raw) return; const obj = JSON.parse(raw); world.innerHTML = obj.inner; state.scale = obj.scale || 1; state.translate = obj.translate || { x: 0, y: 0 };[...world.querySelectorAll('[data-id]')].forEach(attachNodeEvents); // rebuild connections
        state.connections = [];[...world.querySelectorAll('[data-role="connector"]').forEach(line => { state.connections.push({ line, fromId: line.dataset.from, toId: line.dataset.to }); })]; applyTransform(); refreshFramesPanel(); drawMinimap();
    } catch (e) { }
}

// ====== Seed sample ======
(function seed() { if (localStorage.getItem('mirolite_full_v1')) { load(); return; } const r = addRect(40, 40); const e = addEllipse(240, 60); const s = addSticky(480, 60); const t = addText(60, 30, 'Hello'); addConnector(r, e); addConnector(e, s); addFrame(60, 240, 520, 260); applyTransform(); save(); drawMinimap(); })();

// ====== Buttons & keyboard ======
document.getElementById('groupBtn').onclick = groupSelected; document.getElementById('ungroupBtn').onclick = ungroupSelected; document.getElementById('lockBtn').onclick = () => setLock(true); document.getElementById('unlockBtn').onclick = () => setLock(false);
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { state.selected.forEach(n => n.remove()); clearSelection(); save(); } if (e.ctrlKey && e.key === 'd') { // duplicate
        const clones = []; state.selected.forEach(n => { const c = n.cloneNode(true); world.appendChild(c); attachNodeEvents(c); if (c.tagName === 'rect') { c.setAttribute('x', parseFloat(c.getAttribute('x')) + 20); c.setAttribute('y', parseFloat(c.getAttribute('y')) + 20); } if (c.tagName === 'ellipse') { c.setAttribute('cx', parseFloat(c.getAttribute('cx')) + 20); c.setAttribute('cy', parseFloat(c.getAttribute('cy')) + 20); } if (c.tagName === 'text') { c.setAttribute('x', parseFloat(c.getAttribute('x')) + 20); c.setAttribute('y', parseFloat(c.getAttribute('y')) + 20); } clones.push(c); }); clearSelection(); clones.forEach(c => state.selected.add(c)); drawSelectionBoxes(); save();
    }
});

// ====== Keep connectors attached on any DOM changes ======
const obs = new MutationObserver(() => { updateConnectors(); refreshFramesPanel(); drawMinimap(); save(); });
obs.observe(world, { childList: true, subtree: true, attributes: true });

// re-render on resize
window.addEventListener('resize', () => { applyTransform(); drawMinimap(); });
