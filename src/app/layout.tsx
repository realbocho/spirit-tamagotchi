// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: '巫 Spirit Tamagotchi',
  description: 'K-shamanism Web3 idle game on TON. Raise your spirit, mine $MUDANG.',
  openGraph: {
    title: '巫 Spirit Tamagotchi',
    description: 'Raise your spirit companion. Mine $MUDANG. Beat the curse.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-body bg-ink text-paper antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
