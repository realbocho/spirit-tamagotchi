// src/lib/fortune-engine.ts
/**
 * 四柱八字 (Four Pillars of Destiny) Fortune Engine
 * Deterministic fortune calculation based on user birthdate & current date
 */

import { Element5, FortuneScore, PetRarity } from '@/types'

// Heavenly Stems (天干)
const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const STEM_ELEMENTS: Element5[] = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water']

// Earthly Branches (地支)  
const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const BRANCH_ELEMENTS: Element5[] = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water']

// Element compatibility matrix (1=harmony, -1=conflict, 0=neutral)
const ELEMENT_COMPAT: Record<Element5, Record<Element5, number>> = {
  wood:   { wood: 0,  fire: 1,  earth: -1, metal: -1, water: 1  },
  fire:   { wood: 1,  fire: 0,  earth: 1,  metal: -1, water: -1 },
  earth:  { wood: -1, fire: 1,  earth: 0,  metal: 1,  water: -1 },
  metal:  { wood: -1, fire: -1, earth: 1,  metal: 0,  water: 1  },
  water:  { wood: 1,  fire: -1, earth: -1, metal: 1,  water: 0  },
}

export function getElementOfDay(date: Date): Element5 {
  // Use Julian Day Number for consistent calculation
  const jdn = Math.floor((date.getTime() / 86400000) + 2440588)
  const stemIdx = jdn % 10
  return STEM_ELEMENTS[stemIdx]
}

export function getHeavenlyStemBranch(date: Date): { stem: string; branch: string; element: Element5 } {
  const jdn = Math.floor((date.getTime() / 86400000) + 2440588)
  const stemIdx = jdn % 10
  const branchIdx = jdn % 12
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    element: STEM_ELEMENTS[stemIdx],
  }
}

export function calculateBirthElement(birthYear: number, birthMonth: number, birthDay: number): Element5 {
  // Simplified: use birth year's heavenly stem
  const stemIdx = (birthYear - 4) % 10
  const adjusted = ((stemIdx % 10) + 10) % 10
  return STEM_ELEMENTS[adjusted]
}

export interface FortuneResult {
  score: number           // 0-100
  label: FortuneScore
  miningMultiplier: number
  elementOfDay: Element5
  stemBranch: string
  advisoryText: string
  crisisProbability: number  // 0-1
}

export function calculateDailyFortune(
  telegramId: number,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  date: Date = new Date()
): FortuneResult {
  const dayInfo = getHeavenlyStemBranch(date)
  const birthElement = calculateBirthElement(birthYear, birthMonth, birthDay)
  const compat = ELEMENT_COMPAT[birthElement][dayInfo.element]
  
  // Seed with userId + date for determinism but uniqueness
  const seed = (telegramId * 31 + date.getFullYear() * 366 + 
    (date.getMonth() + 1) * 31 + date.getDate()) % 1000
  const baseRand = (seed / 1000)
  
  // Score: base 50 ± compat bonus ± random variance
  let score = 50 + (compat * 20) + (baseRand * 30 - 15)
  score = Math.max(5, Math.min(95, Math.round(score)))
  
  const label = scoreToLabel(score)
  const miningMultiplier = scoreToMultiplier(score)
  const crisisProbability = score < 30 ? 0.25 : score < 50 ? 0.15 : score > 70 ? 0.05 : 0.10
  
  return {
    score,
    label,
    miningMultiplier,
    elementOfDay: dayInfo.element,
    stemBranch: `${dayInfo.stem}${dayInfo.branch}`,
    advisoryText: getAdvisoryText(label, dayInfo.element),
    crisisProbability,
  }
}

function scoreToLabel(score: number): FortuneScore {
  if (score >= 80) return 'great_luck'
  if (score >= 60) return 'luck'
  if (score >= 40) return 'neutral'
  if (score >= 20) return 'misfortune'
  return 'great_misfortune'
}

function scoreToMultiplier(score: number): number {
  // 0.5x to 1.5x based on score
  return Math.round((0.5 + (score / 100)) * 10) / 10
}

const ADVISORY_TEXTS: Record<FortuneScore, Record<Element5, string>> = {
  great_luck: {
    wood:  'The wood qi surges. Growth and abundance flow toward you.',
    fire:  'Celestial fire ignites your path. Fortune blazes bright.',
    earth: 'Mountain energy steadies your hand. Harvest time approaches.',
    metal: 'Blade-sharp clarity. Cut through obstacles with ease.',
    water: 'Deep waters carry hidden treasure. Dive without fear.',
  },
  luck: {
    wood:  'Gentle winds favor your spirit. Slow and steady gains.',
    fire:  'Embers of luck warm your endeavors. Stay the course.',
    earth: 'Fertile ground beneath. Plant your intentions wisely.',
    metal: 'Metal hones to purpose. Precision brings reward.',
    water: 'Flowing streams guide you forward. Trust the current.',
  },
  neutral: {
    wood:  'Branches sway neither for nor against. Balance maintained.',
    fire:  'The flame holds steady. Neither feast nor famine.',
    earth: 'Soil rests in equilibrium. Patience is the virtue.',
    metal: 'Iron neither rusts nor shines today. Maintain your ground.',
    water: 'Still waters reflect clearly. Observe before acting.',
  },
  misfortune: {
    wood:  'Withered branches creak. Guard your resources carefully.',
    fire:  'Smoke obscures the path. Step cautiously.',
    earth: 'The ground shifts beneath. Beware hasty decisions.',
    metal: 'Dull blade struggles. Extra effort required today.',
    water: 'Murky waters cloud judgment. Seek clarity before moving.',
  },
  great_misfortune: {
    wood:  '煞 energy rises. The spirits demand appeasement.',
    fire:  '三災 descends upon you. Seek immediate cleansing.',
    earth: 'The earth swallows. Only a 巫 can lift this curse.',
    metal: 'Dark metal poisons fortune. Rush to the shaman.',
    water: 'Stagnant curse waters flood your spirit. Act now.',
  },
}

function getAdvisoryText(label: FortuneScore, element: Element5): string {
  return ADVISORY_TEXTS[label][element]
}

// Pet mining rate by rarity
export const BASE_MINING_RATES: Record<PetRarity, number> = {
  common:      100,   // $MUDANG per hour
  blessed:     250,
  mudang:      600,
  grand_mudang: 1500,
}

// Egg drop tables
export const EGG_DROP_TABLES: Record<string, Array<{ rarity: PetRarity; weight: number }>> = {
  free: [
    { rarity: 'common', weight: 99 },
    { rarity: 'blessed', weight: 1 },
  ],
  blessed: [
    { rarity: 'common', weight: 15 },
    { rarity: 'blessed', weight: 75 },
    { rarity: 'mudang', weight: 10 },
  ],
  divine: [
    { rarity: 'blessed', weight: 60 },
    { rarity: 'mudang', weight: 35 },
    { rarity: 'grand_mudang', weight: 5 },
  ],
}

export function rollRarity(eggType: string, seed: number): PetRarity {
  const table = EGG_DROP_TABLES[eggType] || EGG_DROP_TABLES.free
  const totalWeight = table.reduce((sum, t) => sum + t.weight, 0)
  let roll = (seed % totalWeight)
  
  for (const entry of table) {
    if (roll < entry.weight) return entry.rarity
    roll -= entry.weight
  }
  return table[table.length - 1].rarity
}

export function generatePetStats(
  rarity: PetRarity,
  element: Element5,
  seed: number
): { luck: number; vitality: number; wealth: number; wisdom: number } {
  const rarityBonus = { common: 0, blessed: 10, mudang: 20, grand_mudang: 35 }[rarity]
  const r = (n: number) => Math.min(100, Math.max(1, Math.round(30 + (seed * n % 40) + rarityBonus + (Math.random() * 10 - 5))))
  
  return {
    luck: r(7),
    vitality: r(13),
    wealth: r(17),
    wisdom: r(11),
  }
}

export const ELEMENT_LABELS: Record<Element5, string> = {
  wood:  '木 Wood',
  fire:  '火 Fire',
  earth: '土 Earth',
  metal: '金 Metal',
  water: '水 Water',
}

export const RARITY_LABELS: Record<PetRarity, string> = {
  common:      '凡 Common',
  blessed:     '靈 Blessed',
  mudang:      '巫 Shaman',
  grand_mudang: '大巫 Grand Shaman',
}

export const FORTUNE_LABELS: Record<FortuneScore, string> = {
  great_luck:       '大吉 Great Fortune',
  luck:             '吉 Fortune',
  neutral:          '中 Neutral',
  misfortune:       '凶 Misfortune',
  great_misfortune: '大凶 Great Calamity',
}
