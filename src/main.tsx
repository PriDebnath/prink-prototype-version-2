// import App from './App.tsx'
import './index.css'


import React from 'react'
import ReactDOM from 'react-dom/client'
import { routeTree } from './routeTree.gen'
import { createRouter, RouterProvider } from '@tanstack/react-router'

// Handle GitHub Pages 404.html redirect
// When 404.html redirects to index.html, restore the original path
// const redirectPath = sessionStorage.getItem('redirect');
// if (redirectPath && redirectPath !== window.location.pathname) {
//   sessionStorage.removeItem('redirect');
//   // Restore the path before router initializes
//   // redirectPath is already in format "/path?query"
//   window.history.replaceState(null, '', redirectPath);
// }

const router = createRouter({
  routeTree,
  basepath: '/'
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)