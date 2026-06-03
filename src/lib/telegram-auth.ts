// src/lib/telegram-auth.ts
import crypto from 'crypto'
import { TelegramUser } from '@/types'

/**
 * Validates Telegram WebApp initData using HMAC-SHA256
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): {
  valid: boolean
  user?: TelegramUser
  authDate?: number
} {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!
  
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return { valid: false }

    // Build the data check string (all fields except hash, sorted)
    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    // Compute secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Compute expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (expectedHash !== hash) return { valid: false }

    // Check auth_date freshness (within 24h)
    const authDate = parseInt(params.get('auth_date') || '0', 10)
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) return { valid: false }

    // Parse user
    const userRaw = params.get('user')
    if (!userRaw) return { valid: false }
    const user: TelegramUser = JSON.parse(userRaw)

    return { valid: true, user, authDate }
  } catch {
    return { valid: false }
  }
}

/**
 * Generates a unique referral code for a user
 */
export function generateReferralCode(telegramId: number): string {
  return crypto
    .createHash('sha256')
    .update(`mudang_${telegramId}_${Date.now()}`)
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
}
