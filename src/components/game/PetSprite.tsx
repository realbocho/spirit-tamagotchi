'use client'
// src/components/game/PetSprite.tsx
// K-Shamanism pixel art — 16×16 grid, each cell = size/16 px
// Elements → 오방색 (五方色), Rarity → accessories (갓·한복·방울·오방색깃발)
import { PetRarity, Element5, PetStatus } from '@/types'

interface PetSpriteProps {
  seed: number
  rarity: PetRarity
  element: Element5
  status?: PetStatus
  size?: number
  animate?: boolean
}

// ─── 오방색 (五方色) palette ───
const OBANGSAEK: Record<Element5, {
  body: string; dark: string; hanbok: string; glow: string; trim: string
}> = {
  wood:  { body: '#3A7D44', dark: '#27562F', hanbok: '#4CAF65', glow: '#3A7D44', trim: '#D4AF37' },
  fire:  { body: '#C0392B', dark: '#8B1C13', hanbok: '#E74C3C', glow: '#E74C3C', trim: '#F5CBA7' },
  earth: { body: '#B8860B', dark: '#7D5A0A', hanbok: '#D4AF37', glow: '#D4AF37', trim: '#C0392B' },
  metal: { body: '#7F8C8D', dark: '#566262', hanbok: '#BDC3C7', glow: '#95A5A6', trim: '#D4AF37' },
  water: { body: '#1A6B9E', dark: '#0D4A70', hanbok: '#2980B9', glow: '#3498DB', trim: '#27AE60' },
}

const ORB_COLOR: Record<PetRarity, string | null> = {
  common: null, blessed: '#27AE60', mudang: '#9B59B6', grand_mudang: '#D4AF37',
}

function seededBool(seed: number, n: number): boolean {
  return ((seed * 2654435761 + n * 1013904223) >>> 0) % 3 !== 0
}

export default function PetSprite({
  seed, rarity, element, status = 'alive', size = 80, animate = true,
}: PetSpriteProps) {
  const col = OBANGSAEK[element]
  const orb = ORB_COLOR[rarity]
  const U = size / 16  // one pixel unit

  const isCursed = status === 'cursed'
  const isDead = status === 'dead'
  const isTranscended = status === 'transcended'

  const bodyC    = isDead ? '#3A3336' : col.body
  const hanbokC  = isDead ? '#2C2830' : col.hanbok
  const hatC     = isDead ? '#1A1518' : col.dark
  const skinC    = isDead ? '#4A3F42' : '#F5CBA7'
  const glowC    = isCursed ? '#8B0000' : col.glow

  const floatAnim  = animate && !isCursed && !isDead && !isTranscended ? 'animate-float' : ''
  const shakeAnim  = animate && isCursed ? 'animate-shake' : ''

  // helper: rect in pixel grid
  const P = (x: number, y: number, w: number, h: number, fill: string, rx = 0, opacity = 1) => (
    <rect
      key={`${x}-${y}-${w}-${h}-${fill}`}
      x={x * U} y={y * U}
      width={w * U} height={h * U}
      fill={fill} rx={rx * U}
      opacity={opacity}
    />
  )

  // Hanbok pattern dots from seed
  const patternDots = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      if (seededBool(seed, r * 2 + c)) {
        patternDots.push(P(5 + c * 2, 9 + r, 1, 1, 'rgba(255,255,255,0.18)'))
        patternDots.push(P(9 - c * 2, 9 + r, 1, 1, 'rgba(255,255,255,0.18)'))
      }
    }
  }

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Glow backdrop */}
      {!isDead && (
        <div
          className={`absolute inset-0 rounded-full ${animate ? 'animate-pulse-glow' : ''}`}
          style={{
            background: glowC,
            opacity: 0.22,
            filter: 'blur(10px)',
            borderRadius: '50%',
          }}
        />
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={`relative ${floatAnim} ${shakeAnim}`}
        style={{ display: 'block' }}
      >
        {/* ── TRANSCENDED AURA ── */}
        {isTranscended && (
          <>
            <circle cx={8*U} cy={8*U} r={7.5*U} fill="none" stroke="#D4AF37" strokeWidth={0.5*U} strokeDasharray={`${2*U} ${2*U}`} opacity={0.6} />
            <circle cx={8*U} cy={8*U} r={6*U} fill="rgba(212,175,55,0.07)" />
          </>
        )}

        {/* ── GAT (갓) BRIM + CROWN ── */}
        {P(2, 2, 12, 1, hatC, 1)}
        {P(5, 0, 6, 3, hatC, 1)}
        {P(6, 0, 4, 1, rarity === 'grand_mudang' && !isDead ? '#D4AF37' : hatC)}

        {/* Grand Mudang crown spikes */}
        {rarity === 'grand_mudang' && !isDead && (
          <>
            <polygon points={`${5*U},${2*U} ${6*U},${-1*U} ${7*U},${2*U}`} fill="#D4AF37" />
            <polygon points={`${7.5*U},${2*U} ${8*U},${-0.5*U} ${8.5*U},${2*U}`} fill="#D4AF37" />
            <polygon points={`${9*U},${2*U} ${10*U},${-1*U} ${11*U},${2*U}`} fill="#D4AF37" />
            {/* Crown jewels */}
            {P(5.3, 1, 1.2, 1.2, '#E74C3C')}
            {P(7.4, 0.3, 1.2, 1.2, '#3498DB')}
            {P(9.5, 1, 1.2, 1.2, '#27AE60')}
          </>
        )}

        {/* Blessed halo */}
        {rarity === 'blessed' && !isDead && (
          <circle cx={8*U} cy={1.5*U} r={2.5*U} fill="none" stroke="#27AE60" strokeWidth={0.5*U} strokeDasharray={`${0.7*U} ${0.7*U}`} opacity={0.8} />
        )}

        {/* Obangsaek flags for grand_mudang */}
        {rarity === 'grand_mudang' && !isDead && (
          <>
            {['#C0392B', '#F5F5F0', '#1A6B9E', '#3A7D44', '#D4AF37'].map((fc, i) => (
              <g key={fc}>
                <rect x={(1.5 + i * 2.7) * U} y={0.4 * U} width={2 * U} height={1.4 * U} fill={fc} />
              </g>
            ))}
          </>
        )}

        {/* ── HEAD ── */}
        {P(4, 3, 8, 5, skinC, 1)}

        {/* Eyes */}
        {(isCursed || isDead) ? (
          <>
            <line x1={5*U} y1={4*U} x2={7*U} y2={6*U} stroke="#C0392B" strokeWidth={0.9*U} strokeLinecap="round" />
            <line x1={7*U} y1={4*U} x2={5*U} y2={6*U} stroke="#C0392B" strokeWidth={0.9*U} strokeLinecap="round" />
            <line x1={9*U} y1={4*U} x2={11*U} y2={6*U} stroke="#C0392B" strokeWidth={0.9*U} strokeLinecap="round" />
            <line x1={11*U} y1={4*U} x2={9*U} y2={6*U} stroke="#C0392B" strokeWidth={0.9*U} strokeLinecap="round" />
          </>
        ) : isTranscended ? (
          <>
            <circle cx={6*U} cy={5*U} r={0.8*U} fill="#D4AF37" />
            <circle cx={10*U} cy={5*U} r={0.8*U} fill="#D4AF37" />
          </>
        ) : (
          <>
            {P(5, 4, 2, 2, '#1A0A0D', 1)}
            {P(9, 4, 2, 2, '#1A0A0D', 1)}
            {P(5.4, 4.3, 0.9, 0.9, 'white')}
            {P(9.4, 4.3, 0.9, 0.9, 'white')}
          </>
        )}

        {/* Cheek blush */}
        {!isDead && !isCursed && !isTranscended && (
          <>
            <circle cx={5*U} cy={6.5*U} r={1.1*U} fill="#E8918A" opacity={0.35} />
            <circle cx={11*U} cy={6.5*U} r={1.1*U} fill="#E8918A" opacity={0.35} />
          </>
        )}

        {/* Mouth */}
        {isCursed ? (
          <path d={`M ${5.5*U} ${7.5*U} Q ${8*U} ${6.5*U} ${10.5*U} ${7.5*U}`} fill="none" stroke="#7B241C" strokeWidth={0.8*U} />
        ) : isDead ? (
          P(6, 7, 4, 0.7, '#7B241C')
        ) : (
          <path d={`M ${5.5*U} ${6.8*U} Q ${8*U} ${8.2*U} ${10.5*U} ${6.8*U}`} fill="none" stroke="#7B241C" strokeWidth={0.8*U} />
        )}

        {/* ── NECK ── */}
        {P(6.5, 8, 3, 1, skinC)}

        {/* ── JEOGORI (저고리) BODY ── */}
        {P(3, 9, 10, 4, hanbokC, 1)}

        {/* Goreum (고름) ribbon tie */}
        <path d={`M ${6*U},${9*U} L ${8*U},${10.5*U} L ${10*U},${9*U}`} fill={col.trim} opacity={0.9} />
        {P(7.3, 9, 1.4, 1, col.trim)}

        {/* Sleeves */}
        {P(1, 9, 3, 3, hanbokC, 1)}
        {P(1, 11, 2.5, 1, skinC, 1)}
        {P(12, 9, 3, 3, hanbokC, 1)}
        {P(12.5, 11, 2.5, 1, skinC, 1)}

        {/* Hanbok pattern dots */}
        {patternDots}

        {/* ── CHIMA (치마) SKIRT ── */}
        <path d={`M ${3*U},${13*U} L ${1*U},${16*U} L ${15*U},${16*U} L ${13*U},${13*U} Z`} fill={col.dark} />
        <line x1={2*U} y1={14.5*U} x2={14*U} y2={14.5*U} stroke={col.trim} strokeWidth={0.5*U} opacity={0.6} />
        <line x1={1.5*U} y1={15.5*U} x2={14.5*U} y2={15.5*U} stroke={col.trim} strokeWidth={0.4*U} opacity={0.4} />

        {/* ── BANGUL (방울) BELLS — Mudang/Grand ── */}
        {(rarity === 'mudang' || rarity === 'grand_mudang') && !isDead && (
          <>
            <g className={rarity === 'grand_mudang' ? 'animate-bell' : ''}>
              <circle cx={1.8*U} cy={11.5*U} r={1.1*U} fill="#D4AF37" stroke="#8B6914" strokeWidth={0.4*U} />
              <line x1={1.8*U} y1={12.6*U} x2={1.2*U} y2={13.6*U} stroke="#8B6914" strokeWidth={0.4*U} />
              <line x1={1.8*U} y1={12.6*U} x2={2.4*U} y2={13.6*U} stroke="#8B6914" strokeWidth={0.4*U} />
            </g>
            <g className={rarity === 'grand_mudang' ? 'animate-bell' : ''}>
              <circle cx={14.2*U} cy={11.5*U} r={1.1*U} fill="#D4AF37" stroke="#8B6914" strokeWidth={0.4*U} />
              <line x1={14.2*U} y1={12.6*U} x2={13.6*U} y2={13.6*U} stroke="#8B6914" strokeWidth={0.4*U} />
              <line x1={14.2*U} y1={12.6*U} x2={14.8*U} y2={13.6*U} stroke="#8B6914" strokeWidth={0.4*U} />
            </g>
          </>
        )}

        {/* ── CRYSTAL ORB — Blessed/Mudang ── */}
        {orb && !isDead && (
          <>
            <circle cx={8*U} cy={10.5*U} r={1.3*U} fill={orb} opacity={0.85} />
            <circle cx={7.5*U} cy={10*U} r={0.5*U} fill="white" opacity={0.45} />
          </>
        )}

        {/* Curse overlay flash */}
        {isCursed && (
          <rect x={0} y={0} width={size} height={size} fill="#8B0000" opacity={0.08} rx={U} className="animate-pulse" />
        )}
      </svg>
    </div>
  )
}
