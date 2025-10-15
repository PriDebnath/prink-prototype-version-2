import { createRoute } from '@tanstack/react-router'
import Index from '../pages/home/home.page'
import { Route as RootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: Index,
})
