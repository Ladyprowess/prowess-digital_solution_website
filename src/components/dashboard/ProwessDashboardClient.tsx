// src/components/dashboard/ProwessDashboardClient.tsx
// ─────────────────────────────────────────────────────────────────
// Client Component — wraps the full dashboard with Supabase
// mutations (create task, log activity, update status, sign out)
// Drop-in replacement for the standalone demo dashboard
// ─────────────────────────────────────────────────────────────────
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile, Task, ActivityLog, LeaderboardEntry } from '@/lib/supabase'

// ─── Import the full dashboard UI from the standalone component ───
// The standalone prowess-dashboard.jsx already has all the UI.
// Here we just wire Supabase data + mutations into it.
// For a quick integration, you can paste the full UI here,
// replacing the SEED_DATA with the props below.

interface Props {
  currentUser:        Profile
  initialTasks:       Task[]
  initialLogs:        ActivityLog[]
  users:              Profile[]
  initialLeaderboard: LeaderboardEntry[]
}

export function ProwessDashboardClient({
  currentUser,
  initialTasks,
  initialLogs,
  users,
  initialLeaderboard,
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [tasks,       setTasks]       = useState<Task[]>(initialTasks)
  const [logs,        setLogs]        = useState<ActivityLog[]>(initialLogs)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [saving,      setSaving]      = useState(false)

  // ── Sign out ──────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  // ── Create task (admin only) ──────────────────────────────────
  const createTask = useCallback(async (form: {
    title: string; description: string; assignedTo: string;
    priority: string; project: string; deadline: string;
  }) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title:       form.title,
        description: form.description,
        assigned_to: form.assignedTo || null,
        created_by:  currentUser.id,
        priority:    form.priority as Task['priority'],
        project:     form.project,
        deadline:    form.deadline || null,
        status:      'pending',
      })
      .select()
      .single()

    if (!error && data) setTasks(prev => [data, ...prev])
    setSaving(false)
    return { error }
  }, [supabase, currentUser.id])

  // ── Update task status ────────────────────────────────────────
  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    const updates: Partial<Task> = { status }
    if (status === 'completed') updates.completed_at = new Date().toISOString()

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ))
      // Refresh leaderboard scores
      await supabase.rpc('compute_weekly_scores')
      const { data: lb } = await supabase.from('leaderboard').select('*')
      if (lb) setLeaderboard(lb)
    }
    return { error }
  }, [supabase])

  // ── Delete task (admin only) ──────────────────────────────────
  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) setTasks(prev => prev.filter(t => t.id !== taskId))
    return { error }
  }, [supabase])

  // ── Log activity ──────────────────────────────────────────────
  const addActivityLog = useCallback(async (form: {
    taskTitle: string; description: string; project: string; timeSpent: number;
  }) => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id:     currentUser.id,
        task_title:  form.taskTitle,
        description: form.description,
        project:     form.project,
        time_spent:  form.timeSpent,
        log_date:    today,
      })
      .select()
      .single()

    if (!error && data) {
      setLogs(prev => [data, ...prev])
      // Refresh leaderboard
      await supabase.rpc('compute_weekly_scores')
      const { data: lb } = await supabase.from('leaderboard').select('*')
      if (lb) setLeaderboard(lb)
    }
    setSaving(false)
    return { error }
  }, [supabase, currentUser.id])

  // ── Pass everything to the full dashboard UI ──────────────────
  // The UI component (prowess-dashboard.jsx) accepts these props.
  // Replace its useState SEED_DATA calls with these values.
  return (
    <FullDashboardUI
      currentUser={currentUser}
      users={users}
      tasks={tasks}
      logs={logs}
      leaderboard={leaderboard}
      saving={saving}
      onSignOut={handleSignOut}
      onCreateTask={createTask}
      onUpdateTaskStatus={updateTaskStatus}
      onDeleteTask={deleteTask}
      onAddActivityLog={addActivityLog}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// FullDashboardUI
// Copy the full UI from prowess-dashboard.jsx into this component,
// replacing:
//   const [users, setUsers]   = useState(SEED_USERS)
//   const [tasks, setTasks]   = useState(SEED_TASKS)
//   const [logs,  setLogs]    = useState(SEED_LOGS)
// with the props passed in from ProwessDashboardClient above.
//
// Also update field names to match the DB snake_case convention:
//   task.assignedTo  →  task.assigned_to
//   task.createdAt   →  task.created_at
//   task.completedAt →  task.completed_at
//   log.userId       →  log.user_id
//   log.taskTitle    →  log.task_title
//   log.timeSpent    →  log.time_spent
//   log.logDate      →  log.log_date
//   user.name        →  user.full_name
//   user.avatar      →  user.avatar_initials
// ─────────────────────────────────────────────────────────────────
function FullDashboardUI(props: any) {
  // Placeholder — paste the full UI here from prowess-dashboard.jsx
  // or import it and pass these props down.
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#0f172a' }}>
      <h2>Dashboard connected to Supabase ✓</h2>
      <p style={{ color: '#64748b' }}>
        Paste the full UI from <code>prowess-dashboard.jsx</code> into this component,
        replacing SEED_DATA with the Supabase props above.
      </p>
      <pre style={{ background: '#f8fafc', padding: 16, borderRadius: 10, fontSize: 13 }}>
        {JSON.stringify({ user: props.currentUser?.full_name, tasks: props.tasks?.length, logs: props.logs?.length }, null, 2)}
      </pre>
    </div>
  )
}
