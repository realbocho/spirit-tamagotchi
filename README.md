# 巫 Spirit Tamagotchi — Full Setup Guide

> K-Shamanism Web3 Idle Game on TON × Telegram Mini App

---

## Architecture Overview

```
Telegram Mini App (Next.js 14)
  ├── Frontend: React + Framer Motion + TailwindCSS
  ├── API: Next.js Route Handlers (server-side)
  ├── DB: Supabase (PostgreSQL + RLS)
  ├── Auth: Telegram initData HMAC validation
  ├── Wallet: TON Connect 2 (Tonkeeper, etc.)
  ├── Contract: FunC → TON Mainnet (treasury + revenue split)
  └── Cron: cron-job.org → /api/cron/unlock (daily)
```

---

## Step 1 — Telegram Bot Setup

### 1a. Create Bot with BotFather

1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Name: `Spirit Tamagotchi`
4. Username: `SpiritTamagotchiBot` (or similar)
5. Copy the **bot token** → set as `TELEGRAM_BOT_TOKEN`

### 1b. Register Mini App

```
/newapp
→ select your bot
→ Title: Spirit Tamagotchi
→ Short description: Raise your spirit, mine $MUDANG. K-shamanism Web3 game.
→ Photo: upload your 640x360 banner
→ Web App URL: https://mudang-tap.vercel.app
→ Short name: spirittama (used in t.me/YourBot?startapp=xxx)
```

### 1c. Configure Bot Commands (optional)

```
/setcommands → your bot:
start - Launch Spirit Tamagotchi
help - How to play
```

### 1d. Set Moderation / Bot Description (BotFather)

```
/setdescription
→ 🔮 Spirit Tamagotchi — Raise a spirit creature rooted in Korean shamanism (巫).
→ Mine $MUDANG daily. Face curses. Call shamans. Trade your spirit NFTs on TON.
→ Built on Telegram × TON blockchain.

/setabouttext  
→ K-Shamanism Web3 idle game. TON-powered. Daily fortune. Real earnings.
```

---

## Step 2 — Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
# or manually: copy supabase/migrations/001_initial_schema.sql into SQL editor
```

### Supabase Dashboard Settings

1. **Authentication**: Disable all providers (we use custom Telegram auth, not Supabase auth)
2. **API**: Copy `Project URL` and `anon key` → set as env vars
3. **Service Role Key**: Settings → API → Service Role secret → set as `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3 — Deploy TON Smart Contract

```bash
# Install dependencies
npm install

# Set env vars for deployment
export OPS_WALLET_ADDRESS=UQC...your_ops_wallet...

# Compile contract
npx blueprint build

# Deploy to mainnet (needs TON wallet with ~0.1 TON)
npx blueprint run deployTreasury --mainnet

# Copy the deployed address to:
# NEXT_PUBLIC_TREASURY_ADDRESS=EQC...
```

**Contract Architecture:**
- All incoming TON (eggs, talismans) → auto-split: 60% reward pool, 30% ops, 10% mudang pool
- Owner can withdraw from pools
- Ops portion is forwarded immediately on each deposit

---

## Step 4 — Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Set all environment variables in Vercel Dashboard:
# Settings → Environment Variables → add each from .env.local.example
```

### Required Vercel Environment Variables:
```
TELEGRAM_BOT_TOKEN
NEXT_PUBLIC_BOT_USERNAME
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TREASURY_ADDRESS
OPS_WALLET_ADDRESS
NEXT_PUBLIC_APP_URL
CRON_SECRET
```

---

## Step 5 — cron-job.org Setup

1. Go to https://cron-job.org → Create Account
2. **New Cronjob:**
   - URL: `https://mudang-tap.vercel.app/api/cron/unlock`
   - Method: `POST`
   - Schedule: `0 0 * * *` (midnight UTC daily)
   - Headers:
     ```
     Content-Type: application/json
     x-cron-secret: YOUR_CRON_SECRET
     ```
3. This job:
   - Unlocks pending withdrawals after 7-day prayer period
   - Marks expired pets (90d lifespan) as dead
   - Expires old SOS requests

---

## Step 6 — TON Connect SDK Registration

The `public/tonconnect-manifest.json` is automatically served.

Update the fields:
```json
{
  "url": "https://mudang-tap.vercel.app",
  "name": "Spirit Tamagotchi",
  "iconUrl": "https://mudang-tap.vercel.app/icon-512.png"
}
```

No separate SDK registration needed — TON Connect auto-discovers via the manifest URL.

---

## Step 7 — GitHub Setup

```bash
cd mudang-tap
git init
git add .
git commit -m "feat: initial Spirit Tamagotchi implementation"

# Create repo at github.com → New Repository
git remote add origin https://github.com/YOUR_USERNAME/spirit-tamagotchi.git
git push -u origin main
```

**Enable Vercel Git integration** in Vercel Dashboard for auto-deploy on push.

---

## Game Economics Reference

| Metric                | Value                  |
|-----------------------|------------------------|
| Free egg              | 1 per account          |
| Blessed egg           | 3 TON (~$18)           |
| Divine egg            | 10 TON (~$60)          |
| Talisman (exorcism)   | 0.5 TON (~$3)          |
| Pet lifespan          | 90 days                |
| Withdrawal lockup     | 7 days                 |
| Revenue split         | 60% pool / 30% ops / 10% mudang pool |
| Crisis probability    | 5% (great luck) to 25% (great misfortune) |
| SOS helpers needed    | 15                     |
| Marketplace fee       | 10%                    |

---

## Anti-Abuse Measures

1. **1 wallet per Telegram ID** — enforced in DB unique constraint
2. **Device UUID tracking** — logs conflicts, flags multi-account suspicious activity
3. **Transaction hash uniqueness** — each TON tx can only be used once
4. **SOS: owner cannot help own pet** — enforced server-side
5. **7-day withdrawal lockup** — prevents pump-and-dump mining
6. **90-day lifespan** — ensures continuous re-investment cycle
7. **Minimum marketplace prices** — prevents ecosystem devaluation
8. **Telegram initData HMAC** — server-side validation of all auth

---

## Project Structure

```
mudang-tap/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/telegram/    ← Telegram login & user upsert
│   │   │   ├── auth/wallet/      ← TON wallet registration
│   │   │   ├── pets/             ← Gacha mint + list
│   │   │   ├── pets/[id]/claim/  ← Mining claim
│   │   │   ├── fortune/          ← Daily fortune + crisis roll
│   │   │   ├── crisis/           ← Exorcism + SOS
│   │   │   ├── market/           ← NFT buy/sell
│   │   │   ├── withdraw/         ← Pending withdrawals
│   │   │   └── cron/unlock/      ← Daily cron (lockup unlock)
│   │   ├── layout.tsx            ← TonConnect + fonts
│   │   ├── page.tsx              ← App entry + Telegram init
│   │   └── globals.css
│   ├── components/game/
│   │   ├── LoadingScreen.tsx
│   │   ├── Tutorial.tsx          ← 5-step onboarding
│   │   ├── MainApp.tsx           ← Bottom nav shell
│   │   ├── HomeScreen.tsx        ← Pet + mining dashboard
│   │   ├── GachaScreen.tsx       ← Egg hatching
│   │   ├── MarketScreen.tsx      ← NFT marketplace
│   │   ├── ProfileScreen.tsx     ← Wallet + balance + referral
│   │   ├── CrisisModal.tsx       ← 煞/三災 resolution
│   │   └── PetSprite.tsx         ← Deterministic pixel art
│   ├── lib/
│   │   ├── store.ts              ← Zustand global state
│   │   ├── fortune-engine.ts     ← 四柱八字 calculation
│   │   ├── telegram-auth.ts      ← HMAC validation
│   │   └── supabase/             ← Client + server clients
│   └── types/index.ts
├── contracts/
│   ├── mudang_treasury.fc        ← FunC smart contract
│   └── wrappers/MudangTreasury.ts
├── scripts/deployTreasury.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql
└── public/
    └── tonconnect-manifest.json
```
