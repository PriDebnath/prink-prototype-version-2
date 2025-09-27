import type { Tool, CanvasState } from "../types";



export   const draw = ({
    canvas,
    state,
    activeTool,
}: {
    canvas: HTMLCanvasElement;
    state: CanvasState;
    activeTool: Tool;
}) => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Draw grid with slight movement for infinite panning feel
    const gridSize = 50;
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    const offsetX = state.offset.x % gridSize;
    const offsetY = state.offset.y % gridSize;
    for (let x = -gridSize + offsetX; x < canvas.clientWidth; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.clientHeight); ctx.stroke();
    }
    for (let y = -gridSize + offsetY; y < canvas.clientHeight; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.clientWidth, y); ctx.stroke();
    }

    // Transform and draw paths
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#000"; ctx.lineWidth = 2 / state.scale;
    for (const path of state.paths) {
      if (path.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length - 1; i++) {
        const midX = (path.points[i].x + path.points[i + 1].x) / 2;
        const midY = (path.points[i].y + path.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, midX, midY);
      }
      ctx.stroke();
    }

    if (activeTool.renderOverlay) activeTool.renderOverlay(ctx, state);
    ctx.restore();
    requestAnimationFrame(() => draw({ canvas, state, activeTool }));
  };