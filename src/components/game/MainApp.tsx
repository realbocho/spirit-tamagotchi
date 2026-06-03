'use client'
// src/components/game/MainApp.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import HomeScreen     from './HomeScreen'
import GachaScreen    from './GachaScreen'
import MarketScreen   from './MarketScreen'
import ProfileScreen    from './ProfileScreen'
import LeaderboardScreen from './LeaderboardScreen'

const TABS = [
  { id: 'home',        icon: '⛩',  label: '靈' },
  { id: 'gacha',       icon: '🥚',  label: '孵' },
  { id: 'market',      icon: '🏮',  label: '市' },
  { id: 'leaderboard', icon: '🏆',  label: '榜' },
  { id: 'profile',     icon: '👤',  label: '我' },
] as const

export default function MainApp() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="flex flex-col h-screen max-h-screen bg-ink safe-top">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {activeTab === 'home'        && <HomeScreen />}
            {activeTab === 'gacha'       && <GachaScreen />}
            {activeTab === 'market'      && <MarketScreen />}
            {activeTab === 'leaderboard' && <LeaderboardScreen />}
            {activeTab === 'profile'     && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <nav className="relative bg-ink-50 border-t border-gold/10 safe-bottom">
        {/* Top glow line */}
        <div className="brush-divider absolute top-0 left-0 right-0" />
        
        <div className="flex justify-around">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="nav-icon text-xl leading-none">{tab.icon}</span>
              <span className="nav-label text-xs font-cjk leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
