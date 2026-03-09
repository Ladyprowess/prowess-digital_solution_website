"use client";

// FILE: src/app/dashboard/page.tsx
//
// What this file does:
// When someone visits /dashboard on your website, this runs.
// It checks if they are logged in using Supabase.
// If not logged in, it sends them to /login.
// If logged in, it fetches their data and shows the dashboard.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProwessDashboard from "@/components/dashboard/ProwessDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: profile },
        { data: tasks },
        { data: logs },
        { data: users },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("profiles").select("*").order("full_name"),
      ]);

      setState({ profile, tasks: tasks || [], logs: logs || [], users: users || [] });
    }
    load();
  }, []);

  if (!state) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#64748b", fontSize: 14 }}>
      Loading...
    </div>
  );

  async function createTask(form: any) {
    const { data, error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description,
      assigned_to: form.assignedTo || null,
      created_by: state.profile.id,
      priority: form.priority,
      project: form.project,
      deadline: form.deadline || null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, tasks: [data, ...p.tasks] }));
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await supabase.from("tasks").update(updates).eq("id", taskId);
    setState((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, ...updates } : t) }));
  }

  async function deleteTask(taskId: string) {
    await supabase.from("tasks").delete().eq("id", taskId);
    setState((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
  }

  async function addLog(form: any) {
    const { data, error } = await supabase.from("activity_logs").insert({
      user_id: state.profile.id,
      task_title: form.taskTitle,
      description: form.description,
      project: form.project,
      time_spent: parseFloat(form.timeSpent) || 0,
      log_date: new Date().toISOString().split("T")[0],
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, logs: [data, ...p.logs] }));
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
      onSignOut={signOut}
    />
  );
}
