'use client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { Toaster } from 'react-hot-toast'
import TelegramAnalytics from './TelegramAnalytics'

const MANIFEST_URL =
  typeof window !== 'undefined' && window.location
    ? `${window.location.origin}/tonconnect-manifest.json`
    : process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/tonconnect-manifest.json`
      : 'https://mudang-tap.vercel.app/tonconnect-manifest.json'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {children}
      <TelegramAnalytics />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1518',
            color: '#F5ECD7',
            border: '1px solid #D4AF37',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
          },
          duration: 3000,
        }}
      />
    </TonConnectUIProvider>
  )
}
