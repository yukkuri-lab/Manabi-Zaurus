import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App'
import './styles/main.css'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    if ('caches' in window) {
      void caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith('dino-kanji-adventure-')).map((key) => caches.delete(key))))
    }
  }, { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
)
