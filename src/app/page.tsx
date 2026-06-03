'use client'
// src/app/page.tsx
import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { TelegramUser } from '@/types'
import Tutorial from '@/components/game/Tutorial'
import MainApp   from '@/components/game/MainApp'
import LoadingScreen from '@/components/game/LoadingScreen'
import { v4 as uuidv4 } from 'uuid'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: TelegramUser; start_param?: string }
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        enableClosingConfirmation: () => void
        MainButton: { hide: () => void }
        colorScheme: string
        viewportHeight: number
        viewportStableHeight: number
        platform: string
      }
    }
  }
}

export default function Home() {
  const {
    user, isLoading, tutorialComplete,
    setUser, setTelegramUser, setLoading, setDeviceUuid, deviceUuid,
    setAllPets, setActivePet, setTodayFortune,
  } = useAppStore()

  const [initError, setInitError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const initApp = useCallback(async () => {
    setLoading(true)
    setInitError(null)
    try {
      // Get or generate device UUID
      let devId = deviceUuid
      if (!devId) {
        devId = uuidv4()
        useAppStore.getState().setDeviceUuid(devId)
      }

      // Init Telegram WebApp
      const tg = window.Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
        tg.setBackgroundColor('#0D0A0B')
        tg.setHeaderColor('#0D0A0B')
        try { tg.enableClosingConfirmation() } catch {}
        try { tg.MainButton.hide() } catch {}
      }

      const initData = tg?.initData || ''
      const tgUser   = tg?.initDataUnsafe?.user
      // startapp ref code (from t.me/bot?startapp=ref_XXXX)
      const startParam = tg?.initDataUnsafe?.start_param || ''
      const refCode = startParam.startsWith('ref_')
        ? startParam.replace('ref_', '')
        : new URLSearchParams(window.location.search).get('ref') || ''

      if (tgUser) setTelegramUser(tgUser)

      // Auth with server
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, deviceUuid: devId, referralCode: refCode, tgUser }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Dev/browser fallback: if no initData (opened in browser, not Telegram)
        // create a guest session so the app is usable during development
        if (!initData && process.env.NODE_ENV === 'development') {
          console.warn('No Telegram initData — dev mode, skipping auth')
          setLoading(false)
          return
        }
        throw new Error(data.error || `Auth failed (${res.status})`)
      }

      setUser(data.user)

      // Load pets + fortune in parallel
      const [petsRes, fortuneRes] = await Promise.all([
        fetch(`/api/pets?user_id=${data.user.id}`),
        fetch(`/api/fortune?user_id=${data.user.id}`),
      ])

      const [petsData, fortuneData] = await Promise.all([
        petsRes.json(),
        fortuneRes.json(),
      ])

      if (petsData.pets?.length) {
        setAllPets(petsData.pets)
        const alive = petsData.pets.find((p: any) => p.status === 'alive') || petsData.pets[0]
        setActivePet(alive)
      }

      if (fortuneData.fortune) setTodayFortune(fortuneData.fortune)

    } catch (err: any) {
      console.error('Init error:', err)
      setInitError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [retryCount])

  useEffect(() => {
    initApp()
  }, [initApp])

  // Loading
  if (isLoading) return <LoadingScreen />

  // Error state — show retry instead of infinite loading
  if (initError || !user) {
    return (
      <div className="fixed inset-0 bg-ink flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="font-cjk text-4xl text-gold/40">靈</div>
        <div>
          <p className="text-paper text-sm font-display mb-1">Connection failed</p>
          <p className="text-smoke/60 text-xs">{initError || 'Could not connect to spirit realm'}</p>
          {!window?.Telegram?.WebApp?.initData && (
            <p className="text-smoke/40 text-xs mt-2">
              Open this app inside Telegram to play
            </p>
          )}
        </div>
        <button
          onClick={() => setRetryCount(c => c + 1)}
          className="btn-ritual px-8 text-sm"
        >
          Retry 再試
        </button>
      </div>
    )
  }

  if (!tutorialComplete) return <Tutorial />
  return <MainApp />
}
