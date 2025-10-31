import CanvasPage from '../../pages/canvas/canvas.page'
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute('/canvas/$canvasId')({
    component: CanvasPage,
})

