'use client'
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
        platform: string
      }
    }
  }
}

// Telegram WebApp SDK가 주입될 때까지 최대 3초 대기
function waitForTelegram(timeout = 3000): Promise<typeof window.Telegram.WebApp | null> {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp?.initData !== undefined) {
      resolve(window.Telegram.WebApp)
      return
    }
    const interval = setInterval(() => {
      if (window.Telegram?.WebApp?.initData !== undefined) {
        clearInterval(interval)
        resolve(window.Telegram.WebApp)
      }
    }, 100)
    setTimeout(() => {
      clearInterval(interval)
      resolve(window.Telegram?.WebApp || null)
    }, timeout)
  })
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
      let devId = deviceUuid
      if (!devId) {
        devId = uuidv4()
        useAppStore.getState().setDeviceUuid(devId)
      }

      // Telegram WebApp SDK 로드 대기
      const tg = await waitForTelegram()

      console.log('[page] tg:', !!tg, 'initData:', tg?.initData?.length, 'user:', tg?.initDataUnsafe?.user?.id)

      if (tg) {
        try { tg.ready() } catch {}
        try { tg.expand() } catch {}
        try { tg.setBackgroundColor('#0D0A0B') } catch {}
        try { tg.setHeaderColor('#0D0A0B') } catch {}
        try { tg.enableClosingConfirmation() } catch {}
        try { tg.MainButton.hide() } catch {}
      }

      const initData = tg?.initData || ''
      const tgUser   = tg?.initDataUnsafe?.user || null
      const startParam = tg?.initDataUnsafe?.start_param || ''
      const refCode = startParam.startsWith('ref_')
        ? startParam.replace('ref_', '')
        : new URLSearchParams(window.location.search).get('ref') || ''

      if (tgUser) setTelegramUser(tgUser)

      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, deviceUuid: devId, referralCode: refCode, tgUser }),
      })

      const data = await res.json()
      console.log('[page] auth response:', res.status, data?.error, data?.debug)

      if (!res.ok) throw new Error(data.error || `Auth failed (${res.status})`)

      setUser(data.user)

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
      console.error('[page] init error:', err)
      setInitError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [retryCount])

  useEffect(() => {
    initApp()
  }, [initApp])

  if (isLoading) return <LoadingScreen />

  if (initError || !user) {
    return (
      <div className="fixed inset-0 bg-ink flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="font-cjk text-4xl text-gold/40">靈</div>
        <div>
          <p className="text-paper text-sm font-display mb-1">Connection failed</p>
          <p className="text-smoke/60 text-xs">{initError || 'Could not connect'}</p>
          {!window?.Telegram?.WebApp?.initData && (
            <p className="text-smoke/40 text-xs mt-2">Open this app inside Telegram</p>
          )}
        </div>
        <button onClick={() => setRetryCount(c => c + 1)} className="btn-ritual px-8 text-sm">
          Retry 再試
        </button>
      </div>
    )
  }

  if (!tutorialComplete) return <Tutorial />
  return <MainApp />
}
