// src/app/guide/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Play Guide — Spirit Tamagotchi 巫',
  description: 'How to turn your Four Pillars fate into real TON earnings. ROI guide, crisis strategy, and tips.',
}

const TABLE_DATA = [
  {
    egg: 'Blessed Egg 福',
    cost: '3 TON',
    strategy: '👥 Free SOS (friends tap)',
    spent: '4.35 TON',
    earned: '9.00 TON',
    profit: '+4.65 TON',
    roi: '~43 days',
    highlight: true,
  },
  {
    egg: 'Blessed Egg 福',
    cost: '3 TON',
    strategy: '💎 Paid talisman (fast)',
    spent: '7.05 TON',
    earned: '9.00 TON',
    profit: '+1.95 TON',
    roi: '~70 days',
    highlight: false,
  },
  {
    egg: 'Divine Egg 大巫',
    cost: '10 TON',
    strategy: '👑 Self-heal + passive dividend',
    spent: '13.00 TON',
    earned: '28.00 TON',
    profit: '+15.00 TON',
    roi: '~38 days',
    highlight: true,
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-ink text-paper">
      {/* Hero */}
      <div
        className="relative px-6 pt-16 pb-12 text-center"
        style={{ background: 'linear-gradient(180deg, #1a0f0a 0%, #0D0A0B 100%)' }}
      >
        <div className="font-cjk text-gold/40 text-xs tracking-widest mb-3">運命 × TON</div>
        <h1 className="font-display text-3xl font-bold text-paper mb-4 leading-tight">
          How to Turn Your Fate<br />into Real TON Earnings
        </h1>
        <p className="text-smoke text-sm max-w-sm mx-auto leading-relaxed">
          Mine daily, survive the curse, and watch TON accumulate — just by playing
          Spirit Tamagotchi 巫.
        </p>
        <blockquote className="mt-6 mx-auto max-w-xs border border-gold/20 rounded-xl px-5 py-4 bg-gold/5">
          <p className="font-cjk text-gold text-sm leading-relaxed">
            "What is your Four Pillars worth?"
          </p>
          <p className="text-smoke/60 text-xs mt-2">
            Check your daily fortune, raise your spirit, beat the curse —<br />
            and TON flows into your wallet.
          </p>
        </blockquote>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-20 space-y-10">

        {/* Section 1 — Crisis */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="font-cjk text-vermil text-2xl">煞</div>
            <div>
              <h2 className="font-display text-paper text-xl font-bold">The 10% Curse</h2>
              <p className="text-smoke/60 text-xs">煞 (Sal) · 三災 (Samjae)</p>
            </div>
          </div>
          <p className="text-smoke text-sm leading-relaxed mb-4">
            As the old saying goes — even the smoothest road has its storms. While raising
            your spirit pet, there is a <span className="text-vermil font-semibold">10% daily chance</span> of
            encountering 煞 (a malevolent spirit) or 三災 (three great calamities). When
            they strike, the consequences are immediate.
          </p>
          <div className="space-y-3">
            <div className="card-ritual p-4 border-l-2 border-vermil/60">
              <div className="text-paper text-sm font-semibold mb-1">⚡ Mining Stops Instantly</div>
              <p className="text-smoke/70 text-xs leading-relaxed">
                The moment the curse lands, your pet's spiritual energy is blocked.
                All $MUDANG mining halts for <strong className="text-paper">2–5 days</strong> until
                the curse is lifted.
              </p>
            </div>
            <div className="card-ritual p-4 border-l-2 border-gold/60">
              <div className="text-paper text-sm font-semibold mb-1">🔮 Exorcism Is Non-Negotiable</div>
              <p className="text-smoke/70 text-xs leading-relaxed">
                Leave it unresolved and your ROI evaporates. Every hour the curse
                remains active is pure lost mining time. Those who act fast capture
                the most TON.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 — ROI Table */}
        <section>
          <h2 className="font-display text-paper text-xl font-bold mb-1">90-Day Earnings Overview</h2>
          <p className="text-smoke/60 text-xs mb-4">
            Based on 1 TON = $6 · avg. 9 crisis events per cycle · 90-day pet lifespan
          </p>
          <div className="space-y-3">
            {TABLE_DATA.map((row, i) => (
              <div
                key={i}
                className={`card-ritual p-4 ${row.highlight ? 'border-gold/30' : 'border-smoke/10'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-display text-paper text-sm font-semibold">{row.egg}</div>
                    <div className="text-smoke/60 text-xs mt-0.5">Entry: {row.cost}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-jade text-lg font-bold">{row.profit}</div>
                    <div className="text-smoke/50 text-xs">ROI in {row.roi}</div>
                  </div>
                </div>
                <div className="bg-ink rounded-lg p-2.5 text-xs">
                  <div className="text-smoke/60 mb-1">Curse strategy</div>
                  <div className="text-paper">{row.strategy}</div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-smoke/60">
                  <span>Total spent: <span className="text-paper font-mono">{row.spent}</span></span>
                  <span>Total earned: <span className="text-jade font-mono">{row.earned}</span></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Tiers */}
        <section>
          <h2 className="font-display text-paper text-xl font-bold mb-5">Tier Breakdown</h2>

          {/* Blessed */}
          <div className="card-ritual p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-jade/15 border border-jade/30 flex items-center justify-center font-cjk text-jade text-lg">福</div>
              <div>
                <div className="font-display text-paper font-semibold">Blessed Pet 靈驗</div>
                <div className="text-smoke/60 text-xs">Smart casual · 3 TON entry</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-smoke leading-relaxed">
              <p>Daily fortune resets at midnight. On <span className="text-gold">大吉 Great Luck</span> days, mining efficiency surges to <strong className="text-paper">150%</strong>.</p>
              <p>When a curse hits, send a SOS link to friends — just 15 taps from your Telegram contacts lifts the curse <strong className="text-paper">completely free</strong> (up to 6 times per lifespan). Minimize spending and <strong className="text-jade">recover your investment in just 43 days</strong>.</p>
            </div>
          </div>

          {/* Grand Mudang */}
          <div className="card-ritual p-5 border-gold/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center font-cjk text-gold text-lg">大巫</div>
              <div>
                <div className="font-display text-paper font-semibold">Grand Mudang 神降</div>
                <div className="text-smoke/60 text-xs">Whale tier · 10 TON entry</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-smoke leading-relaxed">
              <p>Base mining rate is <strong className="text-paper">3× higher</strong> than Blessed tier from day one.</p>
              <p><span className="text-gold font-semibold">Exclusive passive dividend:</span> Every time any player buys a talisman or performs a paid ritual to escape a curse, <strong className="text-paper">10% of that payment flows directly to Grand Mudang holders</strong> — like a daily pension.</p>
              <p>When cursed, no begging required. Self-heal with a personal ritual (10% of original price) and resume mining immediately. After 90 days your wallet holds <strong className="text-jade">2.5× your initial investment</strong>.</p>
            </div>
          </div>
        </section>

        {/* Section 4 — Tips */}
        <section>
          <h2 className="font-display text-paper text-xl font-bold mb-4">3 Tips to Double Your Earnings</h2>
          <div className="space-y-3">
            {[
              {
                num: '①',
                cjk: '祈禱',
                title: '7-Day Prayer Lock — Reinvest, Don\'t Withdraw',
                body: 'Instead of withdrawing $MUDANG immediately, reinvest into level-ups and stat boosts. Higher stats mean higher daily mining rates, building a buffer that offsets the 10% curse probability.',
                color: 'text-jade',
              },
              {
                num: '②',
                cjk: '薦度齋',
                title: 'Perform 薦度齋 When Your Pet Expires',
                body: 'When your pet\'s 90-day lifespan ends, hit the Transcendence button instead of discarding it. You receive Karma Points which dramatically increase the chance of hatching rare Grand Mudang (top 5%) eggs next time.',
                color: 'text-gold',
              },
              {
                num: '③',
                cjk: '族譜',
                title: 'Hunt the Marketplace for Bargains',
                body: 'Found a nearly-expired pet with perfect Five Elements stats? Buy it — the moment a new owner purchases it, the lifespan resets to a full 90 days and mining restarts. Sellers keep 90% of the sale price.',
                color: 'text-spirit',
              },
            ].map(tip => (
              <div key={tip.num} className="card-ritual p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-smoke/40 text-sm">{tip.num}</span>
                  <span className={`font-cjk text-sm ${tip.color}`}>{tip.cjk}</span>
                  <span className="font-display text-paper text-sm font-semibold">{tip.title}</span>
                </div>
                <p className="text-smoke/70 text-xs leading-relaxed pl-8">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <div className="card-ritual p-6 border-gold/30">
            <div className="font-cjk text-3xl text-gold/50 mb-3">四柱八字</div>
            <p className="text-paper text-sm leading-relaxed mb-4">
              Claim your spirit before the next curse cycle begins.<br />
              Enter your Four Pillars in Telegram and start mining now.
            </p>
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'spirit_tamagotchi_bot'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ritual inline-block px-8 py-3 text-sm"
            >
              Open in Telegram 開始
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
