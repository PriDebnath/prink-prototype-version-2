
import { Outlet, Link } from '@tanstack/react-router'


export default function RootLayout() {
    return (
      <div id="app-root">
            <Outlet />
      </div>
    )
  }
  