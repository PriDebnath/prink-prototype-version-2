import { createRoute } from "@tanstack/react-router"
import { Route as RootRoute } from '../__root'
import CanvasPage from '../../pages/canvas/canvas.page'

export const Route = createRoute({
    getParentRoute: () => RootRoute,
    path: "/canvas/$canvasId",
    component: CanvasPage,
})

