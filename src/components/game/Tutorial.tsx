'use client'
// src/components/game/Tutorial.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import toast from 'react-hot-toast'

// Step 0: 출생일 입력 (사주팔자 개인화)
// Steps 1-5: 게임 소개

const ELEMENT_COLORS: Record<string, string> = {
  '木': '#27AE60', '火': '#E74C3C', '土': '#D4AF37', '金': '#BDC3C7', '水': '#3498DB'
}

// 天干地支 연도 오행 계산
function getYearElement(year: number): { char: string; color: string; element: string } {
  const stem = year % 10
  const map: Record<number, { char: string; color: string; element: string }> = {
    4: { char: '甲', color: '#27AE60', element: 'Wood' },
    5: { char: '乙', color: '#27AE60', element: 'Wood' },
    6: { char: '丙', color: '#E74C3C', element: 'Fire' },
    7: { char: '丁', color: '#E74C3C', element: 'Fire' },
    8: { char: '戊', color: '#D4AF37', element: 'Earth' },
    9: { char: '己', color: '#D4AF37', element: 'Earth' },
    0: { char: '庚', color: '#BDC3C7', element: 'Metal' },
    1: { char: '辛', color: '#BDC3C7', element: 'Metal' },
    2: { char: '壬', color: '#3498DB', element: 'Water' },
    3: { char: '癸', color: '#3498DB', element: 'Water' },
  }
  return map[stem] || { char: '?', color: '#8E8082', element: 'Unknown' }
}

function BirthStep() {
  const { user, setUser } = useAppStore()
  const [year, setYear]   = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay]     = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)

  const yearNum = parseInt(year)
  const yearEl  = year.length === 4 && yearNum >= 1920 && yearNum <= 2010
    ? getYearElement(yearNum) : null

  const handleSave = async () => {
    if (!user) return
    const y = parseInt(year), m = parseInt(month), d = parseInt(day)
    if (!y || y < 1920 || y > 2010) return toast.error('Enter a valid birth year (1920–2010)')
    if (!m || m < 1 || m > 12) return toast.error('Enter a valid month (1–12)')
    if (!d || d < 1 || d > 31) return toast.error('Enter a valid day (1–31)')

    setSaving(true)
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, birthYear: y, birthMonth: m, birthDay: d }),
      })
      if (res.ok) {
        setUser({ ...user, birth_year: y, birth_month: m, birth_day: d })
        setDone(true)
      } else {
        throw new Error('Save failed')
      }
    } catch {
      toast.error('Failed to save birth date')
    } finally {
      setSaving(false)
    }
  }

  if (done && yearEl) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: 2, duration: 0.4 }}
          className="text-6xl font-cjk mb-3"
          style={{ color: yearEl.color }}
        >
          {yearEl.char}
        </motion.div>
        <div className="text-paper text-lg font-display mb-1">
          {yearEl.element} Year — {yearEl.char}
        </div>
        <div className="text-smoke text-sm">
          Your spirit will carry the energy of {yearEl.element}
        </div>
        <div className="mt-4 flex justify-center gap-3">
          {Object.entries(ELEMENT_COLORS).map(([char, color]) => (
            <div
              key={char}
              className="w-10 h-10 rounded-lg flex items-center justify-center font-cjk text-lg transition-all"
              style={{
                background: char === (yearEl.char === '甲' || yearEl.char === '乙' ? '木' :
                  yearEl.char === '丙' || yearEl.char === '丁' ? '火' :
                  yearEl.char === '戊' || yearEl.char === '己' ? '土' :
                  yearEl.char === '庚' || yearEl.char === '辛' ? '金' : '水') ? `${color}33` : `${color}11`,
                border: `1px solid ${color}55`,
                color,
                transform: yearEl.element.toLowerCase().includes(
                  char === '木' ? 'wood' : char === '火' ? 'fire' :
                  char === '土' ? 'earth' : char === '金' ? 'metal' : 'water'
                ) ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="text-smoke text-sm text-center mb-6 leading-relaxed">
        Your birth date determines the Four Pillars (四柱八字) — the elemental energy that shapes your spirit pet's stats and mining power.
      </div>

      {/* Year */}
      <div className="mb-4">
        <label className="text-smoke/70 text-xs block mb-1.5">Birth Year 년</label>
        <div className="relative">
          <input
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder="e.g. 1994"
            min="1920" max="2010"
            className="w-full bg-ink border border-smoke/20 rounded-xl px-4 py-3 text-paper font-mono placeholder-smoke/30 focus:border-gold/40 outline-none text-lg"
          />
          {yearEl && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-cjk text-xl"
              style={{ color: yearEl.color }}
            >
              {yearEl.char}
            </motion.div>
          )}
        </div>
        {yearEl && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-1.5 ml-1"
            style={{ color: yearEl.color }}
          >
            {yearEl.element} year · {yearEl.char}년
          </motion.div>
        )}
      </div>

      {/* Month + Day */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="text-smoke/70 text-xs block mb-1.5">Month 월</label>
          <input
            type="number"
            value={month}
            onChange={e => setMonth(e.target.value)}
            placeholder="1–12"
            min="1" max="12"
            className="w-full bg-ink border border-smoke/20 rounded-xl px-4 py-3 text-paper font-mono placeholder-smoke/30 focus:border-gold/40 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-smoke/70 text-xs block mb-1.5">Day 일</label>
          <input
            type="number"
            value={day}
            onChange={e => setDay(e.target.value)}
            placeholder="1–31"
            min="1" max="31"
            className="w-full bg-ink border border-smoke/20 rounded-xl px-4 py-3 text-paper font-mono placeholder-smoke/30 focus:border-gold/40 outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !year || !month || !day}
        className="btn-ritual w-full"
      >
        {saving ? '⟳ Reading the stars...' : '✦ Reveal My Fate 運命'}
      </button>

      <p className="text-smoke/40 text-xs text-center mt-3">
        Used only to calculate your elemental affinity — never shared
      </p>
    </div>
  )
}

const INTRO_STEPS = [
  {
    cjk: '靈物育成',
    title: 'Raise Your Spirit',
    body: 'Hatch a spirit companion from a sacred egg. Each creature carries the energy of your birth chart. Feed it, protect it, and watch it mine $MUDANG as it grows in power.',
    visual: 'pet',
  },
  {
    cjk: '日辰運命',
    title: 'Daily Fortune 日辰',
    body: 'Every dawn, the heavenly stems shift. Your fortune is recalculated — 大吉 Great Luck boosts your mining 150%, while 大凶 Great Calamity may bring 煞 or 三災 upon your pet.',
    visual: 'fortune',
  },
  {
    cjk: '煞과 三災',
    title: 'Crisis & Exorcism',
    body: 'When cursed, your pet stops mining. Call upon a 巫堂 shaman to perform a cleansing ritual — or summon 15 friends to banish the evil together.',
    visual: 'crisis',
  },
  {
    cjk: '채굴 경제',
    title: '$MUDANG Economy',
    body: 'Mined $MUDANG is locked for 7 days (the Prayer Period) before withdrawal — or spend it immediately within the spirit realm for upgrades and rituals.',
    visual: 'economy',
  },
]

function Visual({ type }: { type: string }) {
  if (type === 'pet') {
    return (
      <div className="flex justify-center my-6">
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-7xl"
        >巫</motion.div>
      </div>
    )
  }
  if (type === 'fortune') {
    const scores = ['大吉', '吉', '平', '凶', '大凶']
    const colors = ['#D4AF37', '#27AE60', '#8E8082', '#C0392B', '#8B0000']
    return (
      <div className="flex gap-2 justify-center my-6">
        {scores.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-10 h-10 rounded-lg flex items-center justify-center font-cjk text-xs"
            style={{ background: `${colors[i]}22`, border: `1px solid ${colors[i]}55`, color: colors[i] }}
          >
            {s}
          </motion.div>
        ))}
      </div>
    )
  }
  if (type === 'crisis') {
    return (
      <div className="flex justify-center gap-6 my-6 text-center">
        <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.5 }}>
          <div className="text-3xl">⚡</div>
          <div className="text-vermil text-xs font-cjk mt-1">煞</div>
        </motion.div>
        <div className="text-smoke/30 text-2xl self-center">→</div>
        <div>
          <div className="text-2xl">🔮</div>
          <div className="text-jade text-xs mt-1">Exorcism</div>
        </div>
        <div className="text-smoke/30 text-2xl self-center">+</div>
        <div>
          <div className="text-2xl">👥</div>
          <div className="text-gold text-xs mt-1">SOS ×15</div>
        </div>
      </div>
    )
  }
  if (type === 'economy') {
    return (
      <div className="flex justify-center gap-4 my-6">
        {[['60%', '보상풀', '#27AE60'], ['30%', '운영', '#3498DB'], ['10%', '大巫', '#D4AF37']].map(([pct, lbl, col]) => (
          <div key={lbl} className="text-center">
            <div className="text-xl font-mono font-bold" style={{ color: col }}>{pct}</div>
            <div className="text-smoke/60 text-xs mt-0.5 font-cjk">{lbl}</div>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Tutorial() {
  const { tutorialStep, advanceTutorial, setTutorialComplete, user } = useAppStore()
  const [exiting, setExiting] = useState(false)

  // Step 0 = birth input, steps 1+ = intro slides
  const isBirthStep = tutorialStep === 0
  const introIdx    = tutorialStep - 1
  const step        = isBirthStep ? null : INTRO_STEPS[introIdx]
  const isLast      = tutorialStep === INTRO_STEPS.length  // after all intro slides

  // Skip birth step if already filled in
  const alreadyHasBirth = user?.birth_year && user?.birth_month && user?.birth_day

  const handleNext = () => {
    if (isLast) {
      setExiting(true)
      setTimeout(() => setTutorialComplete(true), 400)
    } else {
      advanceTutorial()
    }
  }

  // Auto-skip birth step if already filled
  const effectiveBirthStep = isBirthStep && !alreadyHasBirth

  const totalSteps  = 1 + INTRO_STEPS.length
  const progressPct = (tutorialStep / (totalSteps - 1)) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      className="fixed inset-0 bg-ink flex flex-col z-50"
    >
      <div className="absolute inset-0 bg-hex-grid opacity-30" />

      {/* Progress bar */}
      <div className="relative pt-12 pb-4 px-8">
        <div className="h-0.5 bg-smoke/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-smoke/40 text-xs">四柱入力</span>
          <span className="text-smoke/40 text-xs">{tutorialStep + 1} / {totalSteps}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="text-center w-full max-w-sm"
          >
            {effectiveBirthStep ? (
              <>
                <div className="font-cjk text-3xl text-gold/60 mb-2">四柱八字</div>
                <h2 className="font-display text-paper text-2xl font-bold mb-6">
                  Enter Your Birth Date
                </h2>
                <BirthStep />
              </>
            ) : step ? (
              <>
                <div className="font-cjk text-3xl text-gold/60 mb-2">{step.cjk}</div>
                <h2 className="font-display text-paper text-2xl font-bold mb-4">{step.title}</h2>
                <Visual type={step.visual} />
                <p className="text-smoke text-sm leading-relaxed font-body">{step.body}</p>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="relative pb-12 px-6">
        {effectiveBirthStep ? (
          <button
            onClick={handleNext}
            className="w-full text-center mt-3 text-smoke/60 text-sm py-3"
          >
            Skip (use random element)
          </button>
        ) : (
          <>
            <button onClick={handleNext} className="btn-ritual w-full text-center">
              {isLast ? 'Begin Your Journey 開始' : 'Continue →'}
            </button>
            {!isLast && (
              <button
                onClick={() => setTutorialComplete(true)}
                className="w-full text-center mt-3 text-smoke/50 text-sm py-2"
              >
                Skip tutorial
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
