import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Capacitor native plugins — only active when running as a native app
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'

async function initNativeApp() {
  if (Capacitor.isNativePlatform()) {
    // Dark status bar for medical aesthetic
    try {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#0f172a' })
    } catch {}

    // Hide splash screen after app loads
    try {
      await SplashScreen.hide()
    } catch {}

    // Keyboard behavior
    try {
      await Keyboard.setResizeMode({ mode: 'body' as any })
    } catch {}
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

initNativeApp()
