// src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────
// Server Component — fetches user + redirects, then renders
// the client dashboard with real Supabase data
// ─────────────────────────────────────────────────────────────────
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { ProwessDashboardClient } from '@/components/dashboard/ProwessDashboardClient'

export const metadata = { title: 'Team Dashboard | Prowess Digital Solutions' }

export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Get profile (role, name, etc.)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch all data in parallel
  const [
    { data: tasks },
    { data: logs },
    { data: profiles },
    { data: leaderboard },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('activity_logs')
      .select('*')
      .order('log_date', { ascending: false }),

    supabase
      .from('profiles')
      .select('*')
      .order('full_name'),

    supabase
      .from('leaderboard')
      .select('*'),
  ])

  return (
    <ProwessDashboardClient
      currentUser={profile}
      initialTasks={tasks || []}
      initialLogs={logs || []}
      users={profiles || []}
      initialLeaderboard={leaderboard || []}
    />
  )
}
