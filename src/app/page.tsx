'use client'
// src/app/page.tsx
import { useEffect, useCallback } from 'react'
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
        initDataUnsafe: { user?: TelegramUser }
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

  const initApp = useCallback(async () => {
    setLoading(true)
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
        tg.enableClosingConfirmation()
        tg.MainButton.hide()
      }

      const initData = tg?.initData || ''
      const tgUser = tg?.initDataUnsafe?.user

      if (tgUser) setTelegramUser(tgUser)

      // Auth with server
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          deviceUuid: devId,
          referralCode: new URLSearchParams(window.location.search).get('ref'),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUser(data.user)

      // Load pets
      const petsRes = await fetch(`/api/pets?user_id=${data.user.id}`)
      const petsData = await petsRes.json()
      if (petsData.pets?.length) {
        setAllPets(petsData.pets)
        const alive = petsData.pets.find((p: any) => p.status === 'alive') || petsData.pets[0]
        setActivePet(alive)
      }

      // Load today's fortune
      const fortuneRes = await fetch(`/api/fortune?user_id=${data.user.id}`)
      const fortuneData = await fortuneRes.json()
      if (fortuneData.fortune) setTodayFortune(fortuneData.fortune)

    } catch (err) {
      console.error('Init error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initApp()
  }, [initApp])

  if (isLoading) return <LoadingScreen />
  if (!user) return <LoadingScreen message="Connecting to the spirit realm..." />
  if (!tutorialComplete) return <Tutorial />
  return <MainApp />
}
