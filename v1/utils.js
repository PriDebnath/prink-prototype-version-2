export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export const on = (el, ev, fn, opts) => el.addEventListener(ev, fn, opts);

export function makeId(prefix='id'){
  return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-3)}`;
}

export function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

export function screenToWorld(x, y, camera){
  return { x: (x / camera.k) - camera.x, y: (y / camera.k) - camera.y };
}

export function worldToScreen(x, y, camera){
  return { x: (x + camera.x) * camera.k, y: (y + camera.y) * camera.k };
}

export function hitRect(px, py, r){
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
