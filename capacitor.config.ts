import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.medai.healthcare',
  appName: 'MedAI',
  webDir: 'dist',

  // Point to your live Render backend — the app loads from here
  server: {
    // For development: use your local IP to live-reload
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,

    // For production: load from Render (always-on cloud URL)
    url: 'https://medai-ivom.onrender.com',
    cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#10b981',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },

  ios: {
    backgroundColor: '#0f172a',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'MedAI',
  },
}

export default config
