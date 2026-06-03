'use client'
// src/components/game/LoadingScreen.tsx
import { motion } from 'framer-motion'

export default function LoadingScreen({ message = 'Awakening ancient spirits...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-ink flex flex-col items-center justify-center gap-8 z-50">
      {/* Animated trigram */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-24 h-24"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.3" />
          <circle cx="50" cy="50" r="35" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="4 4" />
          {/* Trigrams */}
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <g key={i} transform={`rotate(${deg} 50 50)`}>
              <line x1="50" y1="5" x2="50" y2="15" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.6" />
            </g>
          ))}
          {/* Center */}
          <circle cx="50" cy="50" r="8" fill="#D4AF37" fillOpacity="0.2" />
          <text x="50" y="55" textAnchor="middle" fill="#D4AF37" fontSize="12" fontFamily="Noto Serif SC">巫</text>
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h1 className="font-display text-gold text-xl mb-2">Spirit Tamagotchi</h1>
        <p className="text-smoke text-sm font-body">{message}</p>
      </motion.div>

      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-gold rounded-full"
          />
        ))}
      </div>
    </div>
  )
}
