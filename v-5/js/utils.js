function worldToScreen(wx, wy) {
  return { x: (wx * scale) + panX, y: (wy * scale) + panY };
}

function screenToWorld(sx, sy) {
  return { x: (sx - panX) / scale, y: (sy - panY) / scale };
}

function snap(value) {
  return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
}
