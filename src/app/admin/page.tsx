// src/app/admin/page.tsx — Admin dashboard (password protected via env)
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string }
}) {
  const adminKey = process.env.ADMIN_SECRET_KEY
  if (!adminKey || searchParams.key !== adminKey) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <div className="font-cjk text-4xl text-gold/30 mb-4">禁</div>
          <p className="text-smoke text-sm">Access denied. Append ?key=YOUR_ADMIN_KEY</p>
        </div>
      </div>
    )
  }
  return <AdminDashboard />
}
