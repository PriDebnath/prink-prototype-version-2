import { getState } from './state.js';
let _canvas, _ctx, _drawCb;

export function setupCanvas(canvas, drawCb){
  _canvas = canvas;
  _ctx = canvas.getContext('2d', { alpha: false });
  _drawCb = drawCb;
  const resize = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    _ctx.setTransform(1,0,0,1,0,0);
    _ctx.scale(dpr, dpr);
    drawCb();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
}

export function getContext(){ return _ctx; }
export function getCanvas(){ return _canvas; }
