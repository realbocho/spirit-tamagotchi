'use client'
// src/components/TelegramAnalytics.tsx
// Initializes Telegram Mini Apps Analytics after SDK loads
import { useEffect } from 'react'

declare global {
  interface Window {
    telegramAnalytics?: {
      init: (options: { token: string; appName: string }) => void
    }
  }
}

const ANALYTICS_KEY = 'eyJhcHBfbmFtZSI6Im9yaWVudGFsX2ZvcnR1bmVfdGFtYWdvdGNoaSIsImFwcF91cmwiOiJodHRwczovL3QubWUvT3JpZW50YWxfZm9ydHVuZV9UYW1hZ290Y2hpX2JvdCIsImFwcF9kb21haW4iOiJodHRwczovL3NwaXJpdC10YW1hZ290Y2hpLnZlcmNlbC5hcHAvIn0=!lkTpbpqy/D56K6Pvhu6DG4CQDWFEMdM5DntvsWdrpXE='

export default function TelegramAnalytics() {
  useEffect(() => {
    // Poll until SDK is ready
    const tryInit = () => {
      if (window.telegramAnalytics?.init) {
        window.telegramAnalytics.init({
          token: ANALYTICS_KEY,
          appName: 'oriental_fortune_tamagotchi',
        })
        return true
      }
      return false
    }

    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval)
      }, 200)
      setTimeout(() => clearInterval(interval), 10000)
    }
  }, [])

  return null
}
