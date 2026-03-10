"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProwessDashboard from "@/components/dashboard/ProwessDashboard";

const B = "#507c80";

export default function DashboardPage() {
  const router = useRouter();
  const [state,   setState]   = useState<any>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Check auth — with a 10s timeout so it never hangs forever
      const authResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timed out. Check your internet and try again.")), 10000)
        ),
      ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

      const user = authResult.data?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Fetch own profile first — everything else depends on role
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileErr || !profile) {
        throw new Error(
          profileErr?.message === "JSON object requested, multiple (or no) rows returned"
            ? "Your profile was not found. Please contact your admin."
            : profileErr?.message || "Could not load your profile."
        );
      }

      // 3. Fetch tasks, logs, and all profiles in parallel — each one safe
      const [
        { data: tasks,   error: tasksErr  },
        { data: logs,    error: logsErr   },
        { data: users,   error: usersErr  },
      ] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("profiles").select("*").order("full_name"),
      ]);

      // Surface any query errors with helpful context
      if (tasksErr)  throw new Error(`Tasks failed to load: ${tasksErr.message}`);
      if (logsErr)   throw new Error(`Activity logs failed to load: ${logsErr.message}`);
      if (usersErr)  throw new Error(`Team profiles failed to load: ${usersErr.message}`);

      setState({
        profile,
        tasks: tasks   || [],
        logs:  logs    || [],
        users: users   || [],
      });

    } catch (err: any) {
      setError(err.message || "Something went wrong loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // ── Loading screen ──────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100svh",
      fontFamily: "'DM Sans',-apple-system,sans-serif", gap: 16,
      background: "#f0f4f5",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11, background: B,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 4,
      }}>
        <span style={{ color: "white", fontSize: 24, fontWeight: 800 }}>P</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: B,
            animation: `prowess-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            opacity: 0.7,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading your dashboard…</div>
      <style>{`
        @keyframes prowess-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  // ── Error screen ────────────────────────────────────────────────
  if (error) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100svh", padding: 24,
      fontFamily: "'DM Sans',-apple-system,sans-serif", gap: 16,
      background: "#f0f4f5", textAlign: "center",
    }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
        Dashboard failed to load
      </div>
      <div style={{
        fontSize: 13, color: "#64748b", maxWidth: 340, lineHeight: 1.6,
        background: "white", padding: "14px 18px", borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}>
        {error}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={load}
          style={{
            padding: "11px 24px", borderRadius: 10, background: B,
            color: "white", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
          style={{
            padding: "11px 24px", borderRadius: 10, background: "white",
            color: "#374151", border: "1px solid #e2e8f0",
            cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── Dashboard ───────────────────────────────────────────────────
  async function createTask(form: any) {
    const { data, error } = await supabase.from("tasks").insert({
      title:       form.title,
      description: form.description,
      assigned_to: form.assignedTo || null,
      created_by:  state.profile.id,
      priority:    form.priority,
      project:     form.project,
      deadline:    form.deadline || null,
      links:       form.links?.length ? form.links : null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, tasks: [data, ...p.tasks] }));
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await supabase.from("tasks").update(updates).eq("id", taskId);
    setState((p: any) => ({
      ...p,
      tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, ...updates } : t),
    }));
  }

  async function deleteTask(taskId: string) {
    await supabase.from("tasks").delete().eq("id", taskId);
    setState((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
  }

  async function addLog(form: any) {
    const { data, error } = await supabase.from("activity_logs").insert({
      user_id:           state.profile.id,
      task_title:        form.taskTitle,
      description:       form.description,
      project:           form.project,
      time_spent:        parseFloat(form.timeSpent) || 0,
      completion_status: form.completionStatus || "in-progress",
      log_date:          new Date().toISOString().split("T")[0],
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, logs: [data, ...p.logs] }));
  }

  async function deleteLog(logId: string) {
    const { error } = await supabase.from("activity_logs").delete().eq("id", logId);
    if (!error) setState((p: any) => ({ ...p, logs: p.logs.filter((l: any) => l.id !== logId) }));
  }

  async function createMember(form: any) {
    const res = await fetch("/api/create-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create account.");
    const { data: users } = await supabase.from("profiles").select("*").order("full_name");
    setState((p: any) => ({ ...p, users: users || [] }));
  }

  async function updateProfile(updates: { full_name: string; job_title: string }) {
    await supabase.from("profiles").update(updates).eq("id", state.profile.id);
    setState((p: any) => ({ ...p, profile: { ...p.profile, ...updates } }));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <ProwessDashboard
      currentUser={state.profile}
      users={state.users}
      tasks={state.tasks}
      logs={state.logs}
      onCreateTask={createTask}
      onUpdateTaskStatus={updateTaskStatus}
      onDeleteTask={deleteTask}
      onAddLog={addLog}
      onDeleteLog={deleteLog}
      onUpdateProfile={updateProfile}
      onCreateMember={createMember}
      onSignOut={signOut}
    />
  );
}
