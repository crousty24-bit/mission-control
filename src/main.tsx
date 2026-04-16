import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { isTauriRuntime } from './api/tauriRuntime'
import './index.css'
import App from './App.tsx'

const tauriRuntime = isTauriRuntime()

if (tauriRuntime) {
  document.documentElement.classList.add('runtime-tauri')
}

const appTree = tauriRuntime ? <App /> : (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  appTree,
)
