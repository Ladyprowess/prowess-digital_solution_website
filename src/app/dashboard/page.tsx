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
      // getSession() reads from localStorage — no LockManager, works with multiple tabs
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }

      // Fetch own profile first
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      let profile = profileData;

      // Profile missing — auto-create it from auth user metadata
      if (profileErr || !profile) {
        const initials = user.email ? user.email[0].toUpperCase() : "?";
        const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Team Member";
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || fallbackName,
            role: user.user_metadata?.role || "member",
            job_title: user.user_metadata?.job_title || null,
            avatar_initials: initials,
          })
          .select()
          .single();

        if (createErr || !created) {
          throw new Error(
            `Profile not found and could not be created automatically. Please ask your admin to run the schema setup SQL again, or manually insert a row in the profiles table for your user ID: ${user.id}`
          );
        }
        profile = created;
      }

      // Fetch everything else in parallel
      const [
        { data: tasks,    error: tasksErr   },
        { data: logs,     error: logsErr    },
        { data: users,    error: usersErr   },
        { data: kpiAssignments, error: kpiAErr },
        { data: kpiLogs,  error: kpiLErr    },
      ] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("kpi_assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("kpi_logs").select("*").order("created_at", { ascending: false }),
      ]);

      if (tasksErr) throw new Error(`Tasks failed to load: ${tasksErr.message}`);
      if (logsErr)  throw new Error(`Activity logs failed to load: ${logsErr.message}`);
      if (usersErr) throw new Error(`Team profiles failed to load: ${usersErr.message}`);
      // KPI errors are non-fatal — tables may not exist yet if schema not yet run
      setState({
        profile, tasks: tasks || [], logs: logs || [], users: users || [],
        kpiAssignments: kpiAssignments || [], kpiLogs: kpiLogs || [],
      });

    } catch (err: any) {
      setError(err.message || "Something went wrong loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Loading screen
  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100svh", gap: 16,
      background: "#f0f4f5", fontFamily: "'DM Sans',-apple-system,sans-serif",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11, background: B,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "white", fontSize: 24, fontWeight: 800 }}>P</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: B,
            animation: `prowess-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
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

  // Catch-all: if state or profile is somehow null past the loading screen, don't crash
  if (!state || !state.profile) return null;

  // Error screen — shows the actual error so Ngozi can debug
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
        border: "1px solid #e2e8f0", wordBreak: "break-word",
      }}>
        {error}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={load} style={{
          padding: "11px 24px", borderRadius: 10, background: B,
          color: "white", border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 600,
        }}>
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

  async function createTask(form: any) {
    const { data, error } = await supabase.from("tasks").insert({
      title: form.title, description: form.description,
      assigned_to: form.assignedTo || null, created_by: state.profile.id,
      priority: form.priority, project: form.project,
      deadline: form.deadline || null,
      links: form.links?.length ? form.links : null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, tasks: [data, ...p.tasks] }));
  }

  async function updateTaskStatus(taskId: string, status: string, submissionLinks?: any[] | null) {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    if (submissionLinks && submissionLinks.length > 0) updates.submission_links = submissionLinks;
    await supabase.from("tasks").update(updates).eq("id", taskId);
    setState((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, ...updates } : t) }));
  }

  async function deleteTask(taskId: string) {
    await supabase.from("tasks").delete().eq("id", taskId);
    setState((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
  }

  async function addLog(form: any) {
    const { data, error } = await supabase.from("activity_logs").insert({
      user_id: state.profile.id, task_title: form.taskTitle,
      description: form.description, project: form.project,
      time_spent: parseFloat(form.timeSpent) || 0,
      completion_status: form.completionStatus || "in-progress",
      links: form.links?.length ? form.links : null,
      log_date: new Date().toISOString().split("T")[0],
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, logs: [data, ...p.logs] }));
  }

  async function deleteLog(logId: string) {
    const { error } = await supabase.from("activity_logs").delete().eq("id", logId);
    if (!error) setState((p: any) => ({ ...p, logs: p.logs.filter((l: any) => l.id !== logId) }));
  }

  async function createMember(form: any) {
    const res = await fetch("/api/create-member", {
      method: "POST", headers: { "Content-Type": "application/json" },
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

  async function createAssignment(form: any) {
    const { data, error } = await supabase.from("kpi_assignments").insert({
      assigned_to:  form.assigned_to,
      assigned_by:  state.profile.id,
      metric_name:  form.metric_name,
      unit:         form.unit,
      metric_type:  form.metric_type,
      target_value: form.target_value,
      month:        form.month,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, kpiAssignments: [data, ...(p.kpiAssignments || [])] }));
  }

  async function logKPI(form: any) {
    const { data, error } = await supabase.from("kpi_logs").insert({
      assignment_id: form.assignment_id,
      value:         form.value,
      note:          form.note || null,
      logged_by:     state.profile.id,
      log_date:      new Date().toISOString().split("T")[0],
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, kpiLogs: [data, ...(p.kpiLogs || [])] }));
  }

  async function setVerdict(form: any) {
    await supabase.from("kpi_assignments").update({
      verdict:      form.verdict,
      verdict_note: form.verdict_note || null,
      verdict_by:   state.profile.id,
      verdict_at:   new Date().toISOString(),
    }).eq("id", form.id);
    setState((p: any) => ({
      ...p,
      kpiAssignments: (p.kpiAssignments || []).map((a: any) =>
        a.id === form.id ? { ...a, verdict: form.verdict, verdict_note: form.verdict_note } : a
      ),
    }));
  }

  async function deleteAssignment(id: string) {
    await supabase.from("kpi_assignments").delete().eq("id", id);
    setState((p: any) => ({ ...p, kpiAssignments: (p.kpiAssignments || []).filter((a: any) => a.id !== id) }));
  }

  return (
    <ProwessDashboard
      currentUser={state.profile}
      users={state.users}
      tasks={state.tasks}
      logs={state.logs}
      kpiAssignments={state.kpiAssignments}
      kpiLogs={state.kpiLogs}
      onCreateAssignment={createAssignment}
      onLogKPI={logKPI}
      onSetVerdict={setVerdict}
      onDeleteAssignment={deleteAssignment}
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
