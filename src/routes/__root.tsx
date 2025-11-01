import RootLayout from '../pages/root/root.page'
import { createRootRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'

function NotFound() {
  const navigate = useNavigate()
  
  // React.useEffect(() => {
  //   // If we land on a not found route, redirect to home
  //   navigate({ to: '/' })
  // }, [navigate])
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Page not found. Redirecting to home...</p>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

