import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import UnderTheHoodPage from './pages/UnderTheHoodPage'
import './index.css'

const router = createBrowserRouter([
  {
    element: <App />, // root layout: nav, background, chat drawer
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/under-the-hood', element: <UnderTheHoodPage /> },
      { path: '/about', element: <AboutPage /> },
    ],
  },
])

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
