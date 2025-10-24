import {
    BrushFactory,
    BaseBrush
} from "../brush/index";
import type {
    Tool,
    Point,
    CanvasState,
    AppState,
    Freehand,
    ToolEventsParams
} from '../../types';


abstract class BaseTool implements Tool {
    name = "base";
    onPointerDown(params: ToolEventsParams) { };
    onPointerMove(params: ToolEventsParams) { };
    onPointerUp(params: ToolEventsParams) { };
    renderOverlay(params: ToolEventsParams) { }

    public toWorld(e: PointerEvent, canvasState: CanvasState): Point {
        return {
            x: (e.clientX - canvasState.offset.x) / canvasState.scale,
            y: (e.clientY - canvasState.offset.y) / canvasState.scale,
        };
    }
}

export class StrokeToolBase extends BaseTool {
    private drawing = false;
    private brush: BaseBrush | null = null;

    onPointerDown(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params
        if (e.button !== 0) return;
        this.drawing = true;

        const world = this.toWorld(e, canvasState);
        this.brush = BrushFactory.createBrush(appState.pen);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeStart({ e, from: world, to: world, canvasState, ctx, appState });

        canvasState.currentPath = {
            id: canvasState.paths.length + 1,
            points: [world],
            pen: appState.pen,
        };
        canvasState.paths.push(canvasState.currentPath);
    }

    onPointerMove(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params

        if (!this.drawing || !canvasState.currentPath) return;
        const world = this.toWorld(e, canvasState);
        canvasState.currentPath.points.push(world);
        
        const last = canvasState.currentPath.points.at(-1)!;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeMove({ e, from: last, to: world, canvasState, ctx, appState });
    }

    onPointerUp(params: ToolEventsParams) {
        const { e, appState, canvas, canvasState } = params

        if (!this.drawing) return;
        this.drawing = false;
        const world = this.toWorld(e, canvasState);
        const last = canvasState.currentPath?.points.at(-1);
        if (!last) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.brush?.onStrokeEnd({ e, from: last, to: world, canvasState, ctx, appState });
        this.brush = null;
        canvasState.currentPath = null;
    }
}

 