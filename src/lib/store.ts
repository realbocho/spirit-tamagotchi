// src/lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Pet, DailyFortune, TelegramUser } from '@/types'

interface AppState {
  // Auth
  telegramUser: TelegramUser | null
  user: User | null
  isLoading: boolean

  // Game state
  activePet: Pet | null
  pets: Pet[]           // alias kept in sync with allPets
  allPets: Pet[]
  todayFortune: DailyFortune | null

  // Tutorial
  tutorialComplete: boolean
  tutorialStep: number

  // UI
  activeTab: 'home' | 'gacha' | 'market' | 'leaderboard' | 'profile'

  // Device
  deviceUuid: string | null

  // Actions
  setTelegramUser: (u: TelegramUser | null) => void
  setUser: (u: User | null) => void
  setActivePet: (p: Pet | null) => void
  setPets: (pets: Pet[]) => void
  setAllPets: (pets: Pet[]) => void
  setTodayFortune: (f: DailyFortune | null) => void
  setLoading: (v: boolean) => void
  setActiveTab: (t: AppState['activeTab']) => void
  setTutorialComplete: (v: boolean) => void
  advanceTutorial: () => void
  setDeviceUuid: (id: string) => void
  updatePet: (petId: string, updates: Partial<Pet>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      telegramUser: null,
      user: null,
      isLoading: true,
      activePet: null,
      pets: [],
      allPets: [],
      todayFortune: null,
      tutorialComplete: false,
      tutorialStep: 0,
      activeTab: 'home',
      deviceUuid: null,

      setTelegramUser: (u) => set({ telegramUser: u }),
      setUser: (u) => set({ user: u }),
      setActivePet: (p) => set({ activePet: p }),
      setPets: (pets) => set({ pets, allPets: pets }),
      setAllPets: (pets) => set({ allPets: pets, pets }),
      setTodayFortune: (f) => set({ todayFortune: f }),
      setLoading: (v) => set({ isLoading: v }),
      setActiveTab: (t) => set({ activeTab: t }),
      setTutorialComplete: (v) => set({ tutorialComplete: v }),
      advanceTutorial: () => set((s) => ({ tutorialStep: s.tutorialStep + 1 })),
      setDeviceUuid: (id) => set({ deviceUuid: id }),
      updatePet: (petId, updates) =>
        set((s) => {
          const updated = s.allPets.map((p) => (p.id === petId ? { ...p, ...updates } : p))
          return {
            allPets: updated,
            pets: updated,
            activePet: s.activePet?.id === petId ? { ...s.activePet, ...updates } : s.activePet,
          }
        }),
    }),
    {
      name: 'mudang-app-store',
      // Only persist UI preferences + device ID, NOT user/balance/pets
      // (balance/pets always loaded fresh from DB on app init)
      partialize: (state) => ({
        tutorialComplete: state.tutorialComplete,
        tutorialStep: state.tutorialStep,
        deviceUuid: state.deviceUuid,
        activeTab: state.activeTab,
      }),
    }
  )
)
