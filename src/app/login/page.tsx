// src/app/login/page.tsx
// ─────────────────────────────────────────────────────────────────
// Login page — uses Supabase email/password auth
// ─────────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const B = '#507c80'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0a1628 0%,#0f2832 50%,#0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{ width: 400, maxWidth: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18, background: B,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>P</span>
          </div>
          <div style={{ color: 'white', fontSize: 21, fontWeight: 800 }}>Prowess Digital Solutions</div>
          <div style={{ color: '#4b6470', fontSize: 14, marginTop: 4 }}>Internal Team Dashboard</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 34,
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 26 }}>Access your workspace</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@prowessdigitalsolutions.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13, color: '#ef4444', marginBottom: 14,
              padding: '10px 14px', background: '#fef2f2', borderRadius: 8,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: 13, borderRadius: 10,
              background: loading ? '#94a3b8' : B, color: 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </div>
      </div>
    </div>
  )
}
