
import { Outlet, Link } from '@tanstack/react-router'


export default function RootLayout() {
    return (
      <div>
        <nav style={{ display: 'flex', gap: 10, padding: 10 }}>
          <Link to="/">Home</Link>
        </nav>
            <Outlet />
      
      </div>
    )
  }
  