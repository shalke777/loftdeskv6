import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from '@/app/App'
import { initThemeFromStorage } from '@/shared/hooks/useTheme'
import '@/shared/styles/tokens.css'
import '@/shared/styles/globals.css'

// Zastosuj motyw z localStorage zanim React wyrenderuje UI — unika mignięcia
initThemeFromStorage()

// Defer SW registration so it doesn't compete with initial bundle fetch
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => registerSW({ immediate: false }))
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
