import { getState } from './state.js';
import { getContext } from './canvas.js';
import { worldToScreen } from './utils.js';

export function draw(){
  const s = getState();
  const ctx = getContext();
  if (!ctx) return;
  const {width, height} = ctx.canvas;

  // reset to CSS pixels
  ctx.setTransform(1,0,0,1,0,0);
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
  ctx.scale(dpr, dpr);

  // clear
  ctx.clearRect(0,0,ctx.canvas.clientWidth, ctx.canvas.clientHeight);

  // apply camera
  ctx.save();
  ctx.translate((s.camera.x) * s.camera.k, (s.camera.y) * s.camera.k);
  ctx.scale(s.camera.k, s.camera.k);

  drawGrid(ctx);
  drawConnectors(ctx, s);
  drawNotes(ctx, s);
  drawSelectionOutline(ctx, s);

  ctx.restore();
}

function drawGrid(ctx){
  const step = 40;
  const w = ctx.canvas.clientWidth;
  const h = ctx.canvas.clientHeight;
  const cols = Math.ceil(w / step)+2;
  const rows = Math.ceil(h / step)+2;
  ctx.save();
  ctx.globalAlpha = .6;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i= -cols; i<cols; i++){
    ctx.beginPath();
    ctx.moveTo(i*step, -rows*step);
    ctx.lineTo(i*step, rows*step);
    ctx.stroke();
  }
  for (let j= -rows; j<rows; j++){
    ctx.beginPath();
    ctx.moveTo(-cols*step, j*step);
    ctx.lineTo(cols*step, j*step);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNotes(ctx, s){
  s.notes.forEach(n => {
    // shadow
    ctx.save();
    ctx.fillStyle = n.color || '#fff59d';
    roundRect(ctx, n.x, n.y, n.w, n.h, 10);
    ctx.fill();
    // header strip
    ctx.globalAlpha = .15;
    ctx.fillStyle = '#000';
    ctx.fillRect(n.x, n.y, n.w, 28);
    ctx.restore();
    // text
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.font = '16px Inter, Arial, sans-serif';
    wrapText(ctx, n.text || '', n.x + 10, n.y + 24, n.w - 20, 20);
    ctx.restore();
    // resize handle
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.globalAlpha = .5;
    ctx.fillRect(n.x + n.w - 10, n.y + n.h - 10, 10, 10);
    ctx.restore();
  });
}

function drawConnectors(ctx, s){
  ctx.save();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  s.connectors.forEach(c => {
    const a = s.notes.find(n => n.id === c.a);
    const b = s.notes.find(n => n.id === c.b);
    if (!a || !b) return;
    const ax = a.x + a.w/2, ay = a.y + a.h/2;
    const bx = b.x + b.w/2, by = b.y + b.h/2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSelectionOutline(ctx, s){
  if (!s.selection.ids.length) return;
  ctx.save();
  ctx.strokeStyle = '#10b981';
  ctx.setLineDash([6,4]);
  ctx.lineWidth = 2;
  s.selection.ids.forEach(id => {
    const n = s.notes.find(n => n.id === id);
    if (!n) return;
    roundRect(ctx, n.x-4, n.y-4, n.w+8, n.h+8, 12);
    ctx.stroke();
  });
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text).split(/\s+/);
  let line = '', yy = y;
  for (let w of words){
    const test = line + (line? ' ': '') + w;
    const width = ctx.measureText(test).width;
    if (width > maxWidth && line){
      ctx.fillText(line, x, yy);
      yy += lineHeight;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
