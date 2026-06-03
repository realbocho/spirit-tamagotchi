# 🚀 Spirit Tamagotchi 巫 — Complete Deployment Guide

Build status: ✅ `npm run build` passes  
Stack: Next.js 14 · Supabase · TON · Vercel · cron-job.org

---

## Step 0 — Prerequisites

```bash
node >= 20
npm >= 9
git
Telegram account (for BotFather)
TON wallet with ~0.5 TON for contract deploy
```

---

## Step 1 — GitHub

```bash
# Create new repo at github.com (e.g. "spirit-tamagotchi")
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/spirit-tamagotchi.git
git push -u origin main
```

---

## Step 2 — Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon key** and **service_role key**
3. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
4. Verify tables created: `users`, `pets`, `daily_fortunes`, `mining_sessions`, `transactions`, `pending_withdrawals`, `sos_requests`, `nft_listings`, `revenue_splits`, `security_events`

---

## Step 3 — TON Smart Contract Deploy

### 3a. Install Blueprint
```bash
npm install --legacy-peer-deps
```

### 3b. Set up TON wallet for deployment
Create a `.env` file for deployment (do NOT commit):
```bash
DEPLOYER_MNEMONIC="word1 word2 ... word24"
```

### 3c. Build & Deploy contract to mainnet
```bash
npx blueprint build
npx blueprint run deployTreasury --mainnet
```

The script will output:
```
Treasury deployed at: EQ...YOUR_CONTRACT_ADDRESS
```

Copy this address — you'll need it for env vars.

### 3d. Verify contract opcodes match
The contract handles 3 operations:
- `op::deposit = 1` — auto-splits: 60% reward pool, 30% ops, 10% mudang pool
- `op::withdraw_ops = 2` — owner withdraws ops share
- `op::withdraw_reward = 3` — owner withdraws from reward pool

---

## Step 4 — Telegram Bot Setup

### 4a. Create bot via BotFather
```
1. Open Telegram → search @BotFather
2. Send: /newbot
3. Name: Spirit Tamagotchi
4. Username: spirit_tamagotchi_bot (or any available)
5. Save the BOT_TOKEN
```

### 4b. Register Mini App
```
1. @BotFather → /newapp
2. Select your bot
3. App name: Spirit Tamagotchi
4. Description: 巫 Raise your spirit. Mine $MUDANG. Beat the curse.
5. Photo: upload a 640x360 cover image (optional for now, can add later)
6. GIF: skip
7. Web App URL: https://YOUR_APP.vercel.app  (fill in after Vercel deploy)
```

### 4c. Set bot description & commands
```
/setdescription → 巫 Spirit Tamagotchi — K-shamanism Web3 idle game on TON. Raise your spirit pet, mine $MUDANG tokens, and overcome ancient curses.

/setcommands →
start - Open Spirit Tamagotchi
help - How to play
```

### 4d. Bot Privacy Mode (for group bot-detection to work)
```
@BotFather → /setprivacy → Select your bot → DISABLE
```

---

## Step 5 — Vercel Deploy

### 5a. Connect GitHub repo
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Root directory: `/` (default)

### 5b. Set Environment Variables
In Vercel project → Settings → Environment Variables, add ALL of these:

```env
# Telegram
TELEGRAM_BOT_TOKEN=7xxxxxxxxx:AAF...your_bot_token
NEXT_PUBLIC_BOT_USERNAME=spirit_tamagotchi_bot

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# TON
NEXT_PUBLIC_TREASURY_ADDRESS=EQ...your_contract_address
OPS_WALLET_ADDRESS=EQ...your_ops_wallet_address
TONCENTER_API_KEY=your_toncenter_api_key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Security
CRON_SECRET=generate_with_openssl_rand_hex_32
```

To get a TONCENTER_API_KEY:
- Go to https://toncenter.com/
- Or use `@tonapibot` on Telegram

To generate CRON_SECRET:
```bash
openssl rand -hex 32
```

### 5c. Deploy
Click **Deploy**. First deploy takes ~2 minutes.

### 5d. Update Mini App URL
Once deployed, go back to @BotFather:
```
/editapp → your bot → edit Web App URL → https://your-actual-app.vercel.app
```

---

## Step 6 — TonConnect Manifest

Update `public/tonconnect-manifest.json` with your actual deployed URL:
```json
{
  "url": "https://your-actual-app.vercel.app",
  "name": "Spirit Tamagotchi 巫",
  "iconUrl": "https://your-actual-app.vercel.app/icon-192.png"
}
```

Add an icon at `public/icon-192.png` (192×192px PNG).

Commit and push:
```bash
git add public/tonconnect-manifest.json public/icon-192.png
git commit -m "chore: update tonconnect manifest with production URL"
git push
```

---

## Step 7 — cron-job.org Setup

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cronjob:
   - **URL**: `https://your-app.vercel.app/api/cron/unlock`
   - **Schedule**: Daily at `00:00 UTC` (cron: `0 0 * * *`)
   - **Request method**: POST
   - **Request headers**:
     - `x-cron-secret`: (your CRON_SECRET value)
     - `Content-Type`: `application/json`
3. Save and enable

The cron job handles:
- Unlocking 7-day withdrawal lockups
- Marking expired pets (90-day lifespan) as dead
- Expiring 7-day-old SOS requests

---

## Step 8 — Telegram Moderation / App Approval

For public launch, submit your Mini App for Telegram review:

1. Go to @BotFather → your bot → Bot Settings → Configure Mini App
2. Make sure your app:
   - Has a working HTTPS URL
   - Loads in < 5 seconds
   - Has a proper app name and icon
   - Complies with Telegram Mini App guidelines

For the app description (en):
```
巫 Spirit Tamagotchi

Raise your spirit companion powered by ancient K-shamanism wisdom.

• Hatch unique spirit pets based on your birth chart (四柱八字)
• Mine $MUDANG tokens daily — fortune multiplies your earnings
• Battle curses (煞 · 三災) with talismans or call friends for help
• Trade rare spirit NFTs on the in-app marketplace
• Burn pets after 90 days (薦度齋) to earn karma for better hatches

Free to start. Powered by TON blockchain.
```

---

## Step 9 — Post-Deploy Verification

Test these flows after deploy:

### ✅ Auth Flow
1. Open Mini App via Telegram
2. Should auto-login (no username/password)
3. Check Supabase `users` table for your entry

### ✅ Free Egg
1. First-time user → go to 孵 Hatch tab
2. Claim free egg → pet appears in 靈 Home tab

### ✅ Daily Fortune
1. Open 靈 Home → fortune card shows today's score
2. Mining counter ticks up in real-time

### ✅ Crisis System
1. Wait for or manually trigger crisis via DB:
   ```sql
   UPDATE pets SET crisis_type = 'sal', crisis_started_at = NOW()
   WHERE owner_id = 'your-user-uuid';
   ```
2. Crisis modal should appear blocking mining
3. Test SOS link generation

### ✅ Wallet Connect
1. Go to 我 Profile tab
2. Connect Tonkeeper wallet
3. Check `wallet_address` saved in `users` table

### ✅ Cron Job
Test manually:
```bash
curl -X POST https://your-app.vercel.app/api/cron/unlock \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## Environment Variables Summary

| Variable | Where to get |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot |
| `NEXT_PUBLIC_BOT_USERNAME` | @BotFather (without @) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | After `npx blueprint run deployTreasury --mainnet` |
| `OPS_WALLET_ADDRESS` | Your TON ops wallet address |
| `TONCENTER_API_KEY` | toncenter.com or @tonapibot |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
| `CRON_SECRET` | `openssl rand -hex 32` |

---

## Troubleshooting

**Build fails with "Module not found"**
```bash
npm install --legacy-peer-deps
```

**Telegram initData validation fails**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Ensure the Mini App URL matches exactly what's registered in BotFather

**TON transaction not confirming**
- Use https://tonscan.org to check tx status
- Ensure `TONCENTER_API_KEY` is set

**Fonts not loading in Telegram WebApp**
- Fonts load from Google CDN; Telegram WebApp allows external fonts
- Fallback to system fonts if CDN is blocked

**Crisis SOS link not working**
- Ensure `NEXT_PUBLIC_APP_URL` matches your Vercel URL exactly
- The `/sos/[sosId]` page is public (no auth required)
