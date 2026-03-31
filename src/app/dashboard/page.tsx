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
      // getSession() reads from localStorage -- no LockManager, works with multiple tabs
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

      // Profile missing -- auto-create it from auth user metadata
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
        { data: weeklyWinners               },
        { data: monthlyWinners              },
        { data: sales                       },
        { data: payroll                     },
        { data: offlineIncome               },
        { data: offlineOutgoing             },
      ] = await Promise.all([
        supabase.from("tasks").select("*, task_assignments(user_id, assigned_by, status, submission_links, completed_at, approval_status, approval_note, approved_by, approved_at)").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("kpi_assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("kpi_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("weekly_winners").select("*").order("week_end", { ascending: false }),
        supabase.from("monthly_winners").select("*").order("month", { ascending: false }),
        supabase.from("commission_sales").select("*").order("sale_date", { ascending: false }),
        supabase.from("payroll_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("offline_income").select("*").order("income_date", { ascending: false }),
        supabase.from("offline_outgoing").select("*").order("payment_date", { ascending: false }),
      ]);

      if (tasksErr) throw new Error(`Tasks failed to load: ${tasksErr.message}`);
      if (logsErr)  throw new Error(`Activity logs failed to load: ${logsErr.message}`);
      if (usersErr) throw new Error(`Team profiles failed to load: ${usersErr.message}`);
      // KPI errors are non-fatal -- tables may not exist yet if schema not yet run
      setState({
        profile, tasks: tasks || [], logs: logs || [], users: users || [],
        kpiAssignments: kpiAssignments || [], kpiLogs: kpiLogs || [],
        weeklyWinners: weeklyWinners || [],
        monthlyWinners: monthlyWinners || [],
        sales: sales || [],
        payroll: payroll || [],
        offlineIncome: offlineIncome || [],
        offlineOutgoing: offlineOutgoing || [],
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
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading your dashboard...</div>
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

  // Error screen -- shows the actual error so Ngozi can debug
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

  function getAdminRecipients() {
    const seen = new Set<string>();
    return (state.users || []).filter((u: { email?: string | null; role?: string }) => {
      const email = String(u?.email || "").trim().toLowerCase();
      if (u?.role !== "admin" || !email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
  }

  async function notifyAdmins(payload: Record<string, unknown>) {
    const admins = getAdminRecipients();
    if (!admins.length) return;
    await Promise.allSettled(
      admins.map((admin: { email?: string | null }) =>
        fetch("/api/notify-dashboard-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, to: admin.email }),
        })
      )
    );
  }

  function getAssignableUserIds() {
    return new Set(
      (state.users || [])
        .filter((u: any) => u.role === "member" || u.role === "leader")
        .map((u: any) => u.id)
    );
  }

  async function createTask(form: any) {
    const assignableUserIds = getAssignableUserIds();
    const assigneeIds: string[] = (form.assigneeIds ?? (form.assignedTo ? [form.assignedTo] : []))
      .filter((uid: string) => assignableUserIds.has(uid));
    if (assigneeIds.length === 0) {
      throw new Error("Only active team members can be assigned tasks.");
    }
    const primaryAssignee = assigneeIds[0] ?? null;
    const { data, error } = await supabase.from("tasks").insert({
      title: form.title, description: form.description,
      assigned_to: primaryAssignee, created_by: state.profile.id,
      priority: form.priority, project: form.project,
      deadline: form.deadline || null,
      links: form.links?.length ? form.links : null,
      approval_status: "pending",
    }).select().single();
    if (!error && data) {
      // Insert all assignees into task_assignments
      if (assigneeIds.length > 0) {
        await supabase.from("task_assignments").insert(
          assigneeIds.map((uid: string) => ({
            task_id: data.id,
            user_id: uid,
            assigned_by: state.profile.id,
          }))
        );
      }
      // Attach task_assignments to local state so normTask can read them
      const taskWithAssignments = {
        ...data,
        task_assignments: assigneeIds.map((uid: string) => ({ user_id: uid, assigned_by: state.profile.id })),
      };
      setState((p: any) => ({ ...p, tasks: [taskWithAssignments, ...p.tasks] }));
      // Notify each assignee
      for (const uid of assigneeIds) {
        const assignee = state.users.find((u: any) => u.id === uid);
        if (assignee?.email) {
          fetch("/api/notify-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: assignee.email,
              assigneeName: assignee.full_name || assignee.email,
              assignerName: state.profile.full_name || "Your manager",
              taskTitle: form.title,
              taskDescription: form.description || "",
              priority: form.priority || "medium",
              deadline: form.deadline || null,
              project: form.project || "",
            }),
          }).catch(() => {});
        }
      }
    }
  }

  async function updateTaskStatus(taskId: string, status: string, submissionLinks?: any[] | null, resubmitNote?: string | null, assigneeId?: string | null) {
    const task = state.tasks.find((t: any) => t.id === taskId);
    if (assigneeId) {
      const assignmentUpdates: any = { status };
      if (status === "completed") {
        assignmentUpdates.completed_at = new Date().toISOString();
        assignmentUpdates.approval_status = "needs-review";
        assignmentUpdates.approval_note = null;
      }
      if (submissionLinks && submissionLinks.length > 0) assignmentUpdates.submission_links = submissionLinks;
      if (resubmitNote) assignmentUpdates.approval_note = resubmitNote;
      await supabase.from("task_assignments")
        .update(assignmentUpdates)
        .eq("task_id", taskId)
        .eq("user_id", assigneeId);
      setState((p: any) => ({
        ...p,
        tasks: p.tasks.map((t: any) => t.id === taskId ? {
          ...t,
          task_assignments: (t.task_assignments || []).map((a: any) =>
            a.user_id === assigneeId ? { ...a, ...assignmentUpdates } : a
          ),
        } : t),
      }));
      if (status === "completed") {
        const submitter = state.users.find((u: any) => u.id === assigneeId) || state.profile;
        await notifyAdmins({
          type: "task-submitted",
          submitterName: submitter?.full_name || submitter?.email || "A team member",
          taskTitle: task?.title || "Untitled task",
          project: task?.project || "",
        });
      }
      return; // don't touch the tasks row — other assignees must not be affected
    }
    const updates: any = { status };
    if (status === "completed") {
      updates.completed_at    = new Date().toISOString();
      updates.approval_status = "needs-review";
      updates.approval_note   = null;
    }
    if (submissionLinks && submissionLinks.length > 0) updates.submission_links = submissionLinks;
    if (resubmitNote) updates.approval_note = resubmitNote;
    await supabase.from("tasks").update(updates).eq("id", taskId);
    if (!assigneeId) {
      setState((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, ...updates } : t) }));
    }
    if (status === "completed") {
      await notifyAdmins({
        type: "task-submitted",
        submitterName: state.profile.full_name || state.profile.email || "A team member",
        taskTitle: task?.title || "Untitled task",
        project: task?.project || "",
      });
    }
  }

  async function deleteTask(taskId: string, assigneeId?: string | null) {
    if (assigneeId) {
      // Remove only this person's assignment
      await supabase.from("task_assignments").delete().eq("task_id", taskId).eq("user_id", assigneeId);
      // Check remaining assignments before updating state
      const remaining = (state.tasks.find((t: any) => t.id === taskId)?.task_assignments ?? [])
        .filter((a: any) => a.user_id !== assigneeId);
      if (remaining.length === 0) {
        // Last assignee removed — delete the whole task
        await supabase.from("tasks").delete().eq("id", taskId);
        setState((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
      } else {
        setState((p: any) => ({
          ...p,
          tasks: p.tasks.map((t: any) => t.id === taskId ? {
            ...t,
            task_assignments: remaining,
            assigned_to: t.assigned_to === assigneeId ? (remaining[0]?.user_id ?? null) : t.assigned_to,
          } : t),
        }));
      }
    } else {
      await supabase.from("tasks").delete().eq("id", taskId);
      setState((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
    }
  }

  async function reassignTask(taskId: string, assigneeIds: string[]) {
    const assignableUserIds = getAssignableUserIds();
    const validAssigneeIds = assigneeIds.filter((uid: string) => assignableUserIds.has(uid));
    await supabase.from("task_assignments").delete().eq("task_id", taskId);
    if (validAssigneeIds.length > 0) {
      await supabase.from("task_assignments").insert(
        validAssigneeIds.map((uid: string) => ({
          task_id: taskId,
          user_id: uid,
          assigned_by: state.profile.id,
        }))
      );
    }
    await supabase.from("tasks").update({ assigned_to: validAssigneeIds[0] ?? null }).eq("id", taskId);
    setState((p: any) => ({
      ...p,
      tasks: p.tasks.map((t: any) => t.id === taskId ? {
        ...t,
        assigned_to: validAssigneeIds[0] ?? null,
        task_assignments: validAssigneeIds.map((uid: string) => ({ user_id: uid, assigned_by: state.profile.id })),
      } : t),
    }));
    // Notify reassigned members
    const task = state.tasks.find((t: any) => t.id === taskId);
    for (const uid of validAssigneeIds) {
      const assignee = state.users.find((u: any) => u.id === uid);
      if (assignee?.email) {
        fetch("/api/notify-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: assignee.email,
            assigneeName: assignee.full_name || assignee.email,
            assignerName: state.profile.full_name || "Your manager",
            taskTitle: task?.title || "",
            taskDescription: task?.description || "",
            priority: task?.priority || "medium",
            deadline: task?.deadline || null,
            project: task?.project || "",
          }),
        }).catch(() => {});
      }
    }
  }

  async function addLog(form: any) {
    const { data, error } = await supabase.from("activity_logs").insert({
      user_id: state.profile.id, task_title: form.taskTitle,
      description: form.description, project: form.project,
      time_spent: parseFloat(form.timeSpent) || 0,
      completion_status: form.completionStatus || "in-progress",
      links: form.links?.length ? form.links : null,
      log_date: new Date().toISOString().split("T")[0],
      approval_status: "needs-review",
    }).select().single();
    if (!error && data) {
      setState((p: any) => ({ ...p, logs: [data, ...p.logs] }));
      await notifyAdmins({
        type: "activity-submitted",
        submitterName: state.profile.full_name || state.profile.email || "A team member",
        taskTitle: form.taskTitle || "New activity log",
        project: form.project || "",
      });
    }
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

  async function assignLeader(memberId: string, leaderId: string | null) {
    await supabase.from("profiles").update({ managed_by: leaderId }).eq("id", memberId);
    setState((p: any) => ({
      ...p,
      users: p.users.map((u: any) => u.id === memberId ? { ...u, managed_by: leaderId } : u),
    }));
  }

  async function disableMember(memberId: string, reason: string) {
    const res = await fetch("/api/disable-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to disable profile.");
    setState((p: any) => ({
      ...p,
      users: p.users.map((u: any) =>
        u.id === memberId
          ? { ...u, role: "disabled", managed_by: null, earns_commission: false, status_reason: data.disabledReason || reason }
          : u
      ),
    }));
    return data;
  }

  async function enableMember(memberId: string, reason: string) {
    const res = await fetch("/api/enable-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to enable profile.");
    setState((p: any) => ({
      ...p,
      users: p.users.map((u: any) =>
        u.id === memberId
          ? { ...u, role: data.role || "member", status_reason: data.enabledReason || reason }
          : u
      ),
    }));
    return data;
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

  async function approveTask(id: string, assigneeId?: string | null) {
    if (assigneeId) {
      await supabase.from("task_assignments").update({
        approval_status: "approved", approved_by: state.profile.id, approved_at: new Date().toISOString(), approval_note: null
      }).eq("task_id", id).eq("user_id", assigneeId);
      setState((p: any) => ({
        ...p,
        tasks: p.tasks.map((t: any) => t.id === id ? {
          ...t,
          task_assignments: (t.task_assignments || []).map((a: any) =>
            a.user_id === assigneeId ? { ...a, approval_status: "approved", approved_by: state.profile.id, approval_note: null } : a
          ),
        } : t),
      }));
    } else {
      await supabase.from("tasks").update({ approval_status: "approved", approved_by: state.profile.id, approved_at: new Date().toISOString(), approval_note: null }).eq("id", id);
      setState((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === id ? { ...t, approval_status: "approved", approved_by: state.profile.id, approval_note: null } : t) }));
    }
  }

  async function rejectTask(id: string, note: string, assigneeId?: string | null) {
    if (assigneeId) {
      await supabase.from("task_assignments").update({
        approval_status: "rejected", approval_note: note, approved_by: state.profile.id, approved_at: new Date().toISOString()
      }).eq("task_id", id).eq("user_id", assigneeId);
      setState((p: any) => ({
        ...p,
        tasks: p.tasks.map((t: any) => t.id === id ? {
          ...t,
          task_assignments: (t.task_assignments || []).map((a: any) =>
            a.user_id === assigneeId ? { ...a, approval_status: "rejected", approval_note: note, approved_by: state.profile.id } : a
          ),
        } : t),
      }));
    } else {
      await supabase.from("tasks").update({ approval_status: "rejected", approval_note: note, approved_by: state.profile.id, approved_at: new Date().toISOString() }).eq("id", id);
      setState((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === id ? { ...t, approval_status: "rejected", approval_note: note } : t) }));
    }
  }

  async function approveLog(id: string) {
    await supabase.from("activity_logs").update({ approval_status: "approved", approved_by: state.profile.id, approved_at: new Date().toISOString(), approval_note: null }).eq("id", id);
    setState((p: any) => ({ ...p, logs: p.logs.map((l: any) => l.id === id ? { ...l, approval_status: "approved", approved_by: state.profile.id, approval_note: null } : l) }));
  }

  async function rejectLog(id: string, note: string) {
    await supabase.from("activity_logs").update({ approval_status: "rejected", approval_note: note, approved_by: state.profile.id, approved_at: new Date().toISOString() }).eq("id", id);
    setState((p: any) => ({ ...p, logs: p.logs.map((l: any) => l.id === id ? { ...l, approval_status: "rejected", approval_note: note } : l) }));
  }

  async function resubmitLog(id: string, fields: any) {
    await supabase.from("activity_logs").update({
      approval_status:   "needs-review",
      approval_note:     null,
      approved_by:       null,
      approved_at:       null,
      description:       fields.description,
      project:           fields.project || null,
      time_spent:        fields.time_spent || 0,
      completion_status: fields.completion_status,
      links:             fields.links?.length ? fields.links : null,
    }).eq("id", id);
    setState((p: any) => ({
      ...p,
      logs: p.logs.map((l: any) => l.id === id
        ? { ...l, approval_status: "needs-review", approval_note: null,
            description: fields.description, project: fields.project,
            time_spent: fields.time_spent, completion_status: fields.completion_status,
            links: fields.links }
        : l
      ),
    }));
  }

  async function logSale(form: any) {
    const loggedByAdmin = state.profile.role === "admin" && form.member_id !== state.profile.id;
    const { data, error } = await supabase.from("commission_sales").insert({
      member_id:       form.member_id,
      logged_by:       state.profile.id,
      client_name:     form.client_name,
      product_service: form.product_service,
      sale_amount:     parseFloat(form.sale_amount),
      currency_code:   form.currency_code,
      currency_symbol: form.currency_symbol,
      sale_date:       form.sale_date,
      notes:           form.notes || null,
      status:          loggedByAdmin ? "confirmed" : "pending",
      ...(loggedByAdmin ? { confirmed_by: state.profile.id, confirmed_at: new Date().toISOString() } : {}),
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, sales: [data, ...p.sales] }));
  }

  async function confirmSale(id: string) {
    await supabase.from("commission_sales").update({
      status: "confirmed", confirmed_by: state.profile.id,
      confirmed_at: new Date().toISOString(),
    }).eq("id", id);
    setState((p: any) => ({ ...p, sales: p.sales.map((s: any) => s.id === id ? { ...s, status: "confirmed" } : s) }));
  }

  async function rejectSale(id: string, note: string) {
    await supabase.from("commission_sales").update({
      status: "rejected", rejection_note: note,
      confirmed_by: state.profile.id, confirmed_at: new Date().toISOString(),
    }).eq("id", id);
    setState((p: any) => ({ ...p, sales: p.sales.map((s: any) => s.id === id ? { ...s, status: "rejected", rejection_note: note } : s) }));
  }

  async function markCommissionPaid(id: string) {
    await supabase.from("commission_sales").update({
      payout_status: "paid", payout_marked_by: state.profile.id,
      payout_marked_at: new Date().toISOString(),
    }).eq("id", id);
    setState((p: any) => ({ ...p, sales: p.sales.map((s: any) => s.id === id ? { ...s, payout_status: "paid" } : s) }));
    const sale = state.sales.find((s: any) => s.id === id);
    const member = sale && state.users.find((u: any) => u.id === sale.member_id);
    if (member?.email) {
      const month = new Date(sale.sale_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      fetch("/api/notify-commission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "commission-paid", to: member.email,
          recipientName: member.full_name,
          totalPaid: sale.commission_amount, currencySymbol: sale.currency_symbol, month,
        }),
      }).catch(() => {});
    }
  }


  async function bulkMarkCommissionPaid(memberIds: string[], month: string) {
    const salesToPay = state.sales.filter((s: any) =>
      memberIds.includes(s.member_id) && s.status === "confirmed" &&
      s.payout_status === "unpaid" && s.sale_date.slice(0, 7) === month
    );
    if (!salesToPay.length) return;
    const ids = salesToPay.map((s: any) => s.id);
    await supabase.from("commission_sales").update({
      payout_status: "paid", payout_marked_by: state.profile.id,
      payout_marked_at: new Date().toISOString(),
    }).in("id", ids);
    setState((p: any) => ({
      ...p,
      sales: p.sales.map((s: any) => ids.includes(s.id) ? { ...s, payout_status: "paid" } : s),
    }));
    const byMember: Record<string, any[]> = {};
    salesToPay.forEach((s: any) => { if (!byMember[s.member_id]) byMember[s.member_id] = []; byMember[s.member_id].push(s); });
    const monthLabel = new Date(month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    Object.entries(byMember).forEach(([memberId, memberSales]) => {
      const member = state.users.find((u: any) => u.id === memberId);
      if (!member?.email) return;
      const totalPaid = memberSales.reduce((sum: number, s: any) => sum + parseFloat(s.commission_amount), 0);
      fetch("/api/notify-commission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "commission-paid", to: member.email, recipientName: member.full_name, totalPaid, currencySymbol: memberSales[0].currency_symbol, month: monthLabel, saleCount: memberSales.length }),
      }).catch(() => {});
    });
  }
  async function markCommissionUnpaid(id: string) {
    await supabase.from("commission_sales").update({
      payout_status: "unpaid", payout_marked_by: null, payout_marked_at: null,
    }).eq("id", id);
    setState((p: any) => ({ ...p, sales: p.sales.map((s: any) => s.id === id ? { ...s, payout_status: "unpaid" } : s) }));
  }

  async function toggleCommission(memberId: string, value: boolean) {
    await supabase.from("profiles").update({ earns_commission: value }).eq("id", memberId);
    setState((p: any) => ({
      ...p,
      users: p.users.map((u: any) => u.id === memberId ? { ...u, earns_commission: value } : u),
    }));
  }

  async function markTaskAsArticle(taskId: string, value: boolean) {
    await supabase.from("tasks").update({ is_article: value }).eq("id", taskId);
    setState((p: any) => ({
      ...p,
      tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, is_article: value } : t),
    }));
  }

  async function updateMemberPaySettings(memberId: string, updates: { pay_type?: string; article_rate?: number | null; date_of_birth?: string | null }) {
    await supabase.from("profiles").update(updates).eq("id", memberId);
    setState((p: any) => ({
      ...p,
      users: p.users.map((u: any) => u.id === memberId ? { ...u, ...updates } : u),
    }));
  }

  async function logPayroll(form: any) {
    const { data, error } = await supabase.from("payroll_entries").insert({
      member_id:       form.member_id,
      logged_by:       state.profile.id,
      pay_type:        form.pay_type,
      month:           form.month,
      base_amount:     parseFloat(form.base_amount),
      adjustment:      parseFloat(form.adjustment || "0"),
      adjustment_note: form.adjustment_note || null,
      article_count:   form.article_count ? parseInt(form.article_count) : null,
      currency_code:   form.currency_code,
      currency_symbol: form.currency_symbol,
      status:          "pending",
      notes:           form.notes || null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, payroll: [data, ...p.payroll] }));
  }

  async function approvePayroll(id: string) {
    await supabase.from("payroll_entries").update({
      status: "approved", approved_by: state.profile.id,
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    setState((p: any) => ({ ...p, payroll: p.payroll.map((e: any) => e.id === id ? { ...e, status: "approved" } : e) }));
  }

  async function withholdPayroll(id: string) {
    await supabase.from("payroll_entries").update({ status: "withheld" }).eq("id", id);
    setState((p: any) => ({ ...p, payroll: p.payroll.map((e: any) => e.id === id ? { ...e, status: "withheld" } : e) }));
  }

  async function adjustPayroll(id: string, adjustment: number, note: string) {
    await supabase.from("payroll_entries").update({ adjustment, adjustment_note: note }).eq("id", id);
    setState((p: any) => ({ ...p, payroll: p.payroll.map((e: any) => e.id === id ? { ...e, adjustment, adjustment_note: note } : e) }));
  }

  async function markPayrollPaid(id: string) {
    await supabase.from("payroll_entries").update({
      payout_status: "paid", payout_marked_by: state.profile.id,
      payout_marked_at: new Date().toISOString(),
    }).eq("id", id);
    setState((p: any) => ({ ...p, payroll: p.payroll.map((e: any) => e.id === id ? { ...e, payout_status: "paid" } : e) }));
    const entry = state.payroll.find((e: any) => e.id === id);
    const member = entry && state.users.find((u: any) => u.id === entry.member_id);
    if (member?.email && entry) {
      const monthLabel = new Date(entry.month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      fetch("/api/notify-payroll", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: member.email,
          recipientName: member.full_name,
          month: monthLabel,
          finalAmount: entry.final_amount ?? (parseFloat(entry.base_amount) + parseFloat(entry.adjustment || "0")),
          currencySymbol: entry.currency_symbol,
          payType: entry.pay_type,
          articleCount: entry.article_count,
          adjustmentNote: entry.adjustment_note,
        }),
      }).catch(() => {});
    }
  }

  async function markPayrollUnpaid(id: string) {
    await supabase.from("payroll_entries").update({
      payout_status: "unpaid", payout_marked_by: null, payout_marked_at: null,
    }).eq("id", id);
    setState((p: any) => ({ ...p, payroll: p.payroll.map((e: any) => e.id === id ? { ...e, payout_status: "unpaid" } : e) }));
  }

  async function logOfflineIncome(form: any) {
    const { data, error } = await supabase.from("offline_income").insert({
      logged_by:       state.profile.id,
      description:     form.description,
      amount:          parseFloat(form.amount),
      currency_code:   form.currency_code,
      currency_symbol: form.currency_symbol,
      income_date:     form.income_date,
      category:        form.category || null,
      notes:           form.notes || null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, offlineIncome: [data, ...p.offlineIncome] }));
  }

  async function deleteOfflineIncome(id: string) {
    await supabase.from("offline_income").delete().eq("id", id);
    setState((p: any) => ({ ...p, offlineIncome: p.offlineIncome.filter((e: any) => e.id !== id) }));
  }

  async function logOfflineOutgoing(form: any) {
    const { data, error } = await supabase.from("offline_outgoing").insert({
      logged_by:       state.profile.id,
      description:     form.description,
      amount:          parseFloat(form.amount),
      currency_code:   form.currency_code,
      currency_symbol: form.currency_symbol,
      payment_date:    form.payment_date,
      category:        form.category || null,
      notes:           form.notes || null,
    }).select().single();
    if (!error && data) setState((p: any) => ({ ...p, offlineOutgoing: [data, ...p.offlineOutgoing] }));
  }

  async function deleteOfflineOutgoing(id: string) {
    await supabase.from("offline_outgoing").delete().eq("id", id);
    setState((p: any) => ({ ...p, offlineOutgoing: p.offlineOutgoing.filter((e: any) => e.id !== id) }));
  }

  async function closeWeek(weekStart: string, weekEnd: string, scores: any[]) {
    const winner = scores[0];
    if (!winner) return;
    const { data: winnerRow } = await supabase.from("weekly_winners").insert({
      week_start: weekStart, week_end: weekEnd,
      winner_id: winner.userId, winner_name: winner.name,
      total_points: winner.score, tasks_completed: winner.tasksCompleted,
      logs_submitted: winner.logsCount, created_by: state.profile.id,
    }).select().single();
    const snapshotRows = scores.map(s => ({
      week_start: weekStart, week_end: weekEnd,
      user_id: s.userId, user_name: s.name,
      total_points: s.score, tasks_completed: s.tasksCompleted, logs_submitted: s.logsCount,
    }));
    await supabase.from("weekly_scores").insert(snapshotRows);
    if (winnerRow) {
      setState((p: any) => ({ ...p, weeklyWinners: [winnerRow, ...(p.weeklyWinners || [])] }));
    }
  }

  async function closeMonth(month: string, scores: any[]) {
    const winner = scores[0];
    if (!winner) return;
    const existing = (state.monthlyWinners || []).find((row: any) => row.month === month);
    if (existing) {
      throw new Error("This month has already been closed.");
    }
    const { data: winnerRow, error: winnerError } = await supabase.from("monthly_winners").insert({
      month,
      winner_id: winner.userId,
      winner_name: winner.name,
      total_points: winner.score,
      tasks_completed: winner.tasksCompleted,
      logs_submitted: winner.logsCount,
      created_by: state.profile.id,
    }).select().single();
    if (winnerError) {
      if (/monthly_winners/i.test(winnerError.message) && /exist|found/i.test(winnerError.message)) {
        throw new Error("The monthly winner table is missing in Supabase. Run the SQL in supabase/monthly_winners.sql first.");
      }
      throw new Error(winnerError.message || "Failed to save the employee of the month.");
    }
    if (winnerRow) {
      setState((p: any) => ({ ...p, monthlyWinners: [winnerRow, ...(p.monthlyWinners || [])] }));
    }
    // Notify winner
    if (winner) {
      const winnerUser = state.users.find((u: any) => u.id === winner.userId);
      const monthLabel = new Date(month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      if (winnerUser?.email) {
        fetch("/api/notify-month-winner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: winnerUser.email,
            winnerName: winner.name,
            month: monthLabel,
            totalPoints: winner.score,
            tasksCompleted: winner.tasksCompleted,
            logsSubmitted: winner.logsCount,
            isWinner: true,
            teamSize: scores.length,
          }),
        }).catch(() => {});
      }
      // Notify rest of team
      for (const s of scores.slice(1)) {
        const u = state.users.find((usr: any) => usr.id === s.userId);
        if (u?.email) {
          fetch("/api/notify-month-winner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: u.email,
              winnerName: winner.name,
              month: monthLabel,
              totalPoints: winner.score,
              tasksCompleted: winner.tasksCompleted,
              logsSubmitted: winner.logsCount,
              isWinner: false,
              teamSize: scores.length,
            }),
          }).catch(() => {});
        }
      }
      await notifyAdmins({
        type: "month-marked",
        month: monthLabel,
        winnerName: winner.name,
        totalPoints: winner.score,
        tasksCompleted: winner.tasksCompleted,
        logsSubmitted: winner.logsCount,
      });
    }
  }

  return (
    <ProwessDashboard
      currentUser={state.profile}
      users={state.users}
      tasks={state.tasks}
      logs={state.logs}
      kpiAssignments={state.kpiAssignments}
      kpiLogs={state.kpiLogs}
      weeklyWinners={state.weeklyWinners || []}
      monthlyWinners={state.monthlyWinners || []}
      sales={state.sales || []}
      payroll={state.payroll || []}
      offlineIncome={state.offlineIncome || []}
      offlineOutgoing={state.offlineOutgoing || []}
      onCreateAssignment={createAssignment}
      onLogKPI={logKPI}
      onSetVerdict={setVerdict}
      onDeleteAssignment={deleteAssignment}
      onCreateTask={createTask}
      onUpdateTaskStatus={updateTaskStatus}
      onDeleteTask={deleteTask}
      onReassignTask={reassignTask}
      onAddLog={addLog}
      onDeleteLog={deleteLog}
      onResubmitLog={resubmitLog}
      onUpdateProfile={updateProfile}
      onAssignLeader={assignLeader}
      onDisableMember={disableMember}
      onEnableMember={enableMember}
      onCreateMember={createMember}
      onSignOut={signOut}
      onApproveTask={approveTask}
      onRejectTask={rejectTask}
      onApproveLog={approveLog}
      onRejectLog={rejectLog}
      onCloseWeek={closeWeek}
      onCloseMonth={closeMonth}
      onLogSale={logSale}
      onConfirmSale={confirmSale}
      onRejectSale={rejectSale}
      onMarkCommissionPaid={markCommissionPaid}
      onMarkCommissionUnpaid={markCommissionUnpaid}
      onBulkMarkCommissionPaid={bulkMarkCommissionPaid}
      onToggleCommission={toggleCommission}
      onMarkTaskAsArticle={markTaskAsArticle}
      onUpdateMemberPaySettings={updateMemberPaySettings}
      onLogPayroll={logPayroll}
      onApprovePayroll={approvePayroll}
      onWithholdPayroll={withholdPayroll}
      onAdjustPayroll={adjustPayroll}
      onMarkPayrollPaid={markPayrollPaid}
      onMarkPayrollUnpaid={markPayrollUnpaid}
      onLogOfflineIncome={logOfflineIncome}
      onLogOfflineOutgoing={logOfflineOutgoing}
      onDeleteOfflineIncome={deleteOfflineIncome}
      onDeleteOfflineOutgoing={deleteOfflineOutgoing}
    />
  );
}
