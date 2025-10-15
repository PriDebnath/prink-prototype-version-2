import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'



import React from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'

// Import route files
import { Route as RootRoute } from './routes/__root'
import { Route as IndexRoute } from './routes/index'

// Create route tree
const routeTree = RootRoute.addChildren([IndexRoute])

// Create the router
const router = createRouter({
  routeTree,
  defaultViewTransition: true,  // ✅ enables browser View Transitions
})

// Optional: register for type safety (TS only)
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
