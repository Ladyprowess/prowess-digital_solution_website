"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// --- iOS Safari zoom fix + global mobile resets -------------------------------
// Safari zooms when inputs have font-size < 16px. This injects the fix once.
const MOBILE_CSS = `
  input, textarea, select, button {
    font-size: 16px !important;
    -webkit-text-size-adjust: 100%;
  }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  :root { --safe-bottom: env(safe-area-inset-bottom, 0px); }
  @media (max-width: 640px) {
    .prowess-page-pad { padding: 16px !important; }
    .prowess-topbar   { padding: 0 16px !important; }
    .prowess-stat-row { flex-direction: column !important; }
    .prowess-two-col  { grid-template-columns: 1fr !important; }
    .prowess-actlog   { flex-direction: column !important; }
  }
`;

function GlobalStyles() {
  useEffect(() => {
    if (document.getElementById("prowess-mobile-css")) return;
    const tag = document.createElement("style");
    tag.id = "prowess-mobile-css";
    tag.textContent = MOBILE_CSS;
    document.head.appendChild(tag);
    return () => { document.getElementById("prowess-mobile-css")?.remove(); };
  }, []);
  return null;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return mobile;
}

const B = "#507c80";

const today = new Date();
const fmt = (d: string | Date) =>
  (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];

// Supabase stores names as full_name, job_title etc.
// This just converts them to the shorter names used in the UI
const normUser = (u: any) => u ? ({
  ...u,
  name:   u.full_name       ?? u.name   ?? "",
  avatar: u.avatar_initials ?? u.avatar ?? "?",
  title:  u.job_title       ?? u.title  ?? "",
}) : null;

const normTask = (t: any) => {
  if (!t) return null;
  const assignedTo = t.assigned_to ?? t.assignedTo ?? null;
  // task_assignments is the joined array from Supabase; fall back to legacy single assignee
  const assignees: string[] =
    Array.isArray(t.task_assignments) && t.task_assignments.length > 0
      ? t.task_assignments.map((a: any) => a.user_id)
      : (Array.isArray(t.assignees) && t.assignees.length > 0
          ? t.assignees
          : (assignedTo ? [assignedTo] : []));
  return {
    ...t,
    assignedTo,
    assignees,
    completedAt:     t.completed_at     ?? t.completedAt     ?? null,
    links:           t.links            ?? [],
    submission_links: t.submission_links ?? [],
    approvalStatus:  t.approval_status  ?? t.approvalStatus  ?? "approved",
    approvalNote:    t.approval_note    ?? t.approvalNote    ?? "",
  };
};

function expandTasksPerAssignee(tasks: any[]): any[] {
  const result: any[] = [];
  for (const t of tasks) {
    const assignees: string[] = t.assignees ?? [];
    const allAssignments: any[] = t.task_assignments ?? [];
    const isMulti = allAssignments.length > 1;

    if (assignees.length === 0) {
      result.push({ ...t, _singleAssignee: null, _expandedId: t.id });
      continue;
    }
    for (const uid of assignees) {
      const assignment = allAssignments.find((a: any) => a.user_id === uid);

      if (isMulti) {
        // Multi-assignee: each person is fully independent.
        // Never inherit from the shared tasks row — that would bleed one
        // person's submission status onto everyone else.
        result.push({
          ...t,
          assignees: [uid],
          _singleAssignee: uid,
          _expandedId: `${t.id}::${uid}`,
          status:           assignment?.status           ?? 'pending',
          submission_links: assignment?.submission_links ?? [],
          approvalStatus:   assignment?.approval_status  ?? 'pending',
          approvalNote:     assignment?.approval_note    ?? '',
          completedAt:      assignment?.completed_at     ?? null,
        });
      } else {
        // Single-assignee: fall back to tasks row for backward compat
        // (pre-migration rows don't have assignment-level status yet).
        const aStatus   = assignment?.status;
        const aApproval = assignment?.approval_status;
        result.push({
          ...t,
          assignees: [uid],
          _singleAssignee: uid,
          _expandedId: t.id,
          status:           (aStatus   && aStatus   !== 'pending') ? aStatus   : t.status,
          submission_links: assignment?.submission_links ?? t.submission_links ?? [],
          approvalStatus:   (aApproval && aApproval !== 'pending') ? aApproval : t.approvalStatus,
          approvalNote:     assignment?.approval_note ?? t.approvalNote,
          completedAt:      assignment?.completed_at  ?? t.completedAt,
        });
      }
    }
  }
  return result;
}

const normLog = (l: any) => l ? ({
  ...l,
  userId:         l.user_id        ?? l.userId        ?? "",
  taskTitle:      l.task_title     ?? l.taskTitle     ?? "",
  timeSpent:      l.time_spent     ?? l.timeSpent     ?? 0,
  date:           l.log_date       ?? l.date          ?? "",
  links:          l.links          ?? [],
  approvalStatus: l.approval_status ?? l.approvalStatus ?? "approved",
  approvalNote:   l.approval_note   ?? l.approvalNote   ?? "",
}) : null;

// Format a Supabase ISO timestamp -> "10 Mar 2026, 7:59 PM"
const fmtTime = (iso: string | null | undefined): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return ""; }
};

const COLORS = ["#507c80","#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];
const avatarColor = (id: string) =>
  COLORS[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];

// Reusable link list display - used in task detail + log detail modals
function LinkDisplay({ links }: { links: { label?: string; url: string }[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {links.map((link, i) => (
        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: B + "0d", borderRadius: 10, textDecoration: "none", border: `1px solid ${B}22` }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔗</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: B, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {link.label || link.url}
            </div>
            {link.label && <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>}
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>↗</span>
        </a>
      ))}
    </div>
  );
}

// Reusable link builder - used in create task form + activity log form
function LinkAttacher({ links, onChange }: { links: { label: string; url: string }[]; onChange: (links: { label: string; url: string }[]) => void }) {
  const add    = () => onChange([...links, { label: "", url: "" }]);
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const update = (i: number, field: "label" | "url", val: string) =>
    onChange(links.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          Attach Links <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
        </label>
        <button onClick={add} type="button" style={{ fontSize: 12, fontWeight: 600, color: B, background: B + "12", border: `1px solid ${B}30`, padding: "4px 12px", borderRadius: 8, cursor: "pointer" }}>
          + Add Link
        </button>
      </div>
      {links.length === 0 ? (
        <button onClick={add} type="button" style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px dashed #e2e8f0", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", textAlign: "center" }}>
          🔗 Attach a URL, doc, or submission link
        </button>
      ) : links.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <input placeholder="Label (e.g. Google Doc, Submission, Figma)" value={link.label}
              onChange={e => update(i, "label", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            <input placeholder="https://" value={link.url}
              onChange={e => update(i, "url", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <button onClick={() => remove(i)} type="button" style={{ padding: "8px 10px", borderRadius: 8, background: "#fef2f2", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, flexShrink: 0, marginTop: 2 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// Approval status badge
function ApprBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    "needs-review": { label: "Needs Review", color: "#d97706", bg: "#fffbeb" },
    "approved":     { label: "Approved",     color: "#059669", bg: "#d1fae5" },
    "rejected":     { label: "Rejected",     color: "#dc2626", bg: "#fee2e2" },
  };
  const s = cfg[status];
  if (!s) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

const PRI: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "#ef4444", bg: "#fef2f2" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#fffbeb" },
  low:    { label: "Low",    color: "#22c55e", bg: "#f0fdf4" },
};

const STA: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:       { label: "Pending",     color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  "in-progress": { label: "In Progress", color: "#3b82f6", bg: "#eff6ff", dot: "#3b82f6" },
  completed:     { label: "Completed",   color: "#22c55e", bg: "#f0fdf4", dot: "#22c55e" },
};

function isDisabledProfile(u: any) {
  if (!u) return false;
  return (
    u.role === "disabled" ||
    u.employment_status === "disabled" ||
    u.status === "disabled" ||
    !!u.disabled_at
  );
}

function isStaff(u: any) {
  return !isDisabledProfile(u) && (u.role === "member" || u.role === "leader");
}
function isPrivileged(u: any) { return u.role === "admin" || u.role === "leader"; }

// Helper: current week Monday..Sunday
function getWeekBounds(): { start: string; end: string } {
  const d = new Date(today);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: fmt(mon), end: fmt(sun) };
}

// All-time scores (approved items only, new point values)
function computeScores(tasks: any[], logs: any[], users: any[]) {
  const expanded = expandTasksPerAssignee(tasks.map(normTask));
  return users
    .filter(u => isStaff(u))
    .map(u => {
      const nu = normUser(u);
      let pts = 0;
      const ut = expanded.filter(t => t.assignees.includes(u.id) && t.approvalStatus === "approved");
      const overdueTasks = expanded.filter(t =>
        t.assignees.includes(u.id) &&
        t.deadline &&
        t.deadline < fmt(today) &&
        t.status !== "completed"
      );
      ut.forEach(t => {
        if (t.status === "completed") {
          pts += 10;
          if (t.priority === "high") pts += 5;
          if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
          else if (t.completedAt && t.deadline && t.completedAt > t.deadline) pts -= 5;
        }
      });
      pts -= overdueTasks.length * 3;
      const ul = logs.map(normLog).filter(l => l.userId === u.id && l.approvalStatus === "approved");
      pts += ul.length * 3;
      return {
        userId: u.id, name: nu.name, avatar: nu.avatar, title: nu.title,
        score: Math.max(0, pts),
        tasksCompleted: ut.filter(t => t.status === "completed").length,
        tasksTotal: ut.length,
        logsCount: ul.length,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// This-week scores (approved items completed/logged this week only)
function computeWeeklyScores(tasks: any[], logs: any[], users: any[]) {
  const { start: ws } = getWeekBounds();
  const expanded = expandTasksPerAssignee(tasks.map(normTask));
  return users
    .filter(u => isStaff(u))
    .map(u => {
      const nu = normUser(u);
      let pts = 0;
      const ut = expanded.filter(t =>
        t.assignees.includes(u.id) &&
        t.approvalStatus === "approved" &&
        t.status === "completed" &&
        t.completedAt && t.completedAt >= ws
      );
      const overdueTasks = expanded.filter(t =>
        t.assignees.includes(u.id) &&
        t.deadline &&
        t.deadline >= ws &&
        t.deadline < fmt(today) &&
        t.status !== "completed"
      );
      ut.forEach(t => {
        pts += 10;
        if (t.priority === "high") pts += 5;
        if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
        else if (t.completedAt && t.deadline && t.completedAt > t.deadline) pts -= 5;
      });
      pts -= overdueTasks.length * 3;
      const ul = logs.map(normLog).filter(l =>
        l.userId === u.id &&
        l.approvalStatus === "approved" &&
        l.date >= ws
      );
      pts += ul.length * 3;
      return {
        userId: u.id, name: nu.name, avatar: nu.avatar, title: nu.title,
        score: Math.max(0, pts),
        tasksCompleted: ut.length,
        logsCount: ul.length,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// This-month scores (approved items completed/logged this calendar month only)
function computeMonthlyScores(tasks: any[], logs: any[], users: any[]) {
  const thisMonth = fmt(new Date()).slice(0, 7);
  const expanded = expandTasksPerAssignee(tasks.map(normTask));
  return users
    .filter((u: any) => isStaff(u))
    .map((u: any) => {
      const nu = normUser(u);
      let pts = 0;
      const ut = expanded.filter((t: any) =>
        t.assignees.includes(u.id) && t.approvalStatus === "approved" &&
        (t.completedAt || "").slice(0, 7) === thisMonth
      );
      const overdueTasks = expanded.filter((t: any) =>
        t.assignees.includes(u.id) &&
        t.deadline &&
        t.deadline.slice(0, 7) === thisMonth &&
        t.deadline < fmt(today) &&
        t.status !== "completed"
      );
      ut.forEach((t: any) => {
        if (t.status === "completed") {
          pts += 10;
          if (t.priority === "high") pts += 5;
          if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
          else if (t.completedAt && t.deadline && t.completedAt > t.deadline) pts -= 5;
        }
      });
      pts -= overdueTasks.length * 3;
      const ul = logs.map(normLog).filter((l: any) =>
        l.userId === u.id && l.approvalStatus === "approved" && l.date.slice(0, 7) === thisMonth
      );
      pts += ul.length * 3;
      return {
        userId: u.id, name: nu.name, avatar: nu.avatar, title: nu.title,
        score: Math.max(0, pts),
        tasksCompleted: ut.filter((t: any) => t.status === "completed").length,
        tasksTotal: ut.length,
        logsCount: ul.length,
      };
    })
    .sort((a: any, b: any) => b.score - a.score);
}

// Small avatar circle
function Av({ user, size = 36 }: { user: any; size?: number }) {
  if (!user) return null;
  const u = normUser(user);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(u.id || "x"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {u.avatar}
    </div>
  );
}

// Coloured label badge
function Pill({ type, value }: { type: "priority" | "status"; value: string }) {
  const cfg = type === "priority" ? PRI[value] : STA[value];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600, flexShrink: 0,
    }}>
      {type === "status" && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: (cfg as any).dot || cfg.color }} />
      )}
      {cfg.label}
    </span>
  );
}

function Card({ children, style = {}, ...rest }: { children: React.ReactNode; style?: React.CSSProperties; [key: string]: any }) {
  return (
    <div style={{
      background: "white", borderRadius: 16,
      border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === total || Math.abs(p - page) <= 1);
  const withEllipsis: (number | "...")[] = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - (visible[i - 1] as number) > 1) withEllipsis.push("...");
    withEllipsis.push(p);
  });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "white", color: page === 1 ? "#cbd5e1" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
        {"< Prev"}
      </button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} style={{ color: "#94a3b8", fontSize: 13, padding: "0 4px" }}>...</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${p === page ? B : "#e2e8f0"}`, background: p === page ? B : "white", color: p === page ? "white" : "#374151", cursor: "pointer", fontSize: 13, fontWeight: p === page ? 700 : 400 }}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: page === total ? "#f8fafc" : "white", color: page === total ? "#cbd5e1" : "#374151", cursor: page === total ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
        {"Next >"}
      </button>
    </div>
  );
}

function Stat({ icon, label, value, sub, color = B, trend }: {
  icon: string; label: string; value: string | number;
  sub?: string; color?: string; trend?: number;
}) {
  return (
    <Card style={{ padding: 24, flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color + "18", display: "flex", alignItems: "center",
          justifyContent: "center", color, fontSize: 20,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 12, color: trend >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  );
}

const SEL: React.CSSProperties = {
  padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 16, color: "#374151", background: "white", cursor: "pointer", outline: "none",
};

const sBtn = (c: string): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 8, background: c + "18",
  border: `1px solid ${c}30`, color: c, fontSize: 14,
  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
});

const NAV = [
  { id: "dashboard",   label: "Dashboard",    icon: "🏠" },
  { id: "tasks",       label: "Tasks",        icon: "✅" },
  { id: "activity",    label: "Activity Log", icon: "📝" },
  { id: "kpi",         label: "KPIs",         icon: "🎯" },
  { id: "leaderboard", label: "Leaderboard",  icon: "🏆" },
  { id: "commission",  label: "Commission",   icon: "💰", commissionOnly: true },
  { id: "payroll",     label: "Payroll",      icon: "💳", privileged: true },
  { id: "finance",     label: "Finance",      icon: "📈", adminOnly: true },
  { id: "reports",     label: "Reports",      icon: "📊", privileged: true },
  { id: "team",        label: "Team",         icon: "👥", privileged: true },
  { id: "settings",    label: "Settings",     icon: "⚙️" },
];

// --- Currency helpers ---------------------------------------------------------
const CURRENCIES = [
  { country: "Nigeria",        code: "NGN", symbol: "₦"    },
  { country: "Ghana",          code: "GHS", symbol: "GH₵"  },
  { country: "Kenya",          code: "KES", symbol: "KSh"  },
  { country: "South Africa",   code: "ZAR", symbol: "R"    },
  { country: "Uganda",         code: "UGX", symbol: "USh"  },
  { country: "Tanzania",       code: "TZS", symbol: "TSh"  },
  { country: "Rwanda",         code: "RWF", symbol: "FRw"  },
  { country: "Senegal",        code: "XOF", symbol: "CFA"  },
  { country: "Cameroon",       code: "XAF", symbol: "FCFA" },
  { country: "Ethiopia",       code: "ETB", symbol: "Br"   },
  { country: "Egypt",          code: "EGP", symbol: "E£"   },
  { country: "United Kingdom", code: "GBP", symbol: "£"    },
  { country: "United States",  code: "USD", symbol: "$"    },
  { country: "European Union", code: "EUR", symbol: "€"    },
];

function getCurrencyForCountry(country: string) {
  return CURRENCIES.find(c => c.country.toLowerCase() === (country || "").toLowerCase())
    ?? { code: "", symbol: "" };
}

function fmtMoney(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- Mobile drawer (slides in from left) --------------------------------------
function MobileDrawer({ user, page, setPage, onLogout, open, onClose, approvalCount = 0, setApprovalsOpen }: any) {
  const items = NAV.filter(n => {
    if (n.privileged && !isPrivileged(user)) return false;
    if ((n as any).commissionOnly && !isPrivileged(user) && !user.earns_commission) return false;
    if ((n as any).adminOnly && user.role !== "admin") return false;
    return true;
  });
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            zIndex: 80, WebkitTapHighlightColor: "transparent",
          }}
        />
      )}
      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 280,
        background: "#111827", zIndex: 90,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {/* Drawer header */}
        <div style={{
          padding: "16px 16px 14px", borderBottom: "1px solid #1f2937",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 18, fontWeight: 800 }}>P</span>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Prowess</div>
              <div style={{ color: "#4b5563", fontSize: 11 }}>Digital Solutions</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#374151", border: "none", borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
            ✕
          </button>
        </div>

        {/* User pill */}
        <div style={{ margin: "14px 12px 4px", padding: "12px 14px", background: "#1f2937", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Av user={user} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ color: "#6b7280", fontSize: 11 }}>{user.role === "admin" ? "Administrator" : user.role === "leader" ? "Team Leader" : "Team Member"}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "10px 12px", overflowY: "auto" }}>
          {items.map(n => {
            const on = page === n.id;
            return (
              <button key={n.id} onClick={() => { setPage(n.id); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "12px 14px", borderRadius: 11, marginBottom: 3,
                background: on ? B + "22" : "transparent",
                border: on ? `1px solid ${B}44` : "1px solid transparent",
                cursor: "pointer", color: on ? "#7ecfd4" : "#9ca3af",
                fontSize: 14, fontWeight: on ? 600 : 400, textAlign: "left",
              }}>
                <span style={{ fontSize: 20, width: 26, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.id === "approvals" && approvalCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#ef4444", color: "white", borderRadius: 20, padding: "1px 7px", flexShrink: 0 }}>{approvalCount}</span>
                )}
                {on && <div style={{ width: 6, height: 6, borderRadius: "50%", background: B }} />}
              </button>
            );
          })}
        </nav>

        {/* Approvals button - privileged only */}
        {isPrivileged(user) && (
          <div style={{ padding: "0 12px 6px" }}>
            <button onClick={() => { setApprovalsOpen(true); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "12px 14px", borderRadius: 11,
              background: approvalCount > 0 ? "#d97706" + "22" : "transparent",
              border: approvalCount > 0 ? "1px solid #d9770640" : "1px solid transparent",
              cursor: "pointer", color: approvalCount > 0 ? "#fbbf24" : "#9ca3af",
              fontSize: 14, fontWeight: approvalCount > 0 ? 600 : 400, textAlign: "left",
            }}>
              <span style={{ fontSize: 20, width: 26, textAlign: "center", flexShrink: 0 }}>🔍</span>
              <span style={{ flex: 1 }}>Approvals</span>
              {approvalCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#ef4444", color: "white", borderRadius: 20, padding: "1px 7px", flexShrink: 0 }}>{approvalCount}</span>
              )}
            </button>
          </div>
        )}

        {/* Sign out */}
        <div style={{ padding: "12px 12px 16px", borderTop: "1px solid #1f2937" }}>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "12px 14px", borderRadius: 11, background: "#1f2937",
            border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, fontWeight: 500,
          }}>
            <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// --- Desktop sidebar -----------------------------------------------------------
function Sidebar({ user, page, setPage, onLogout, open, setOpen, approvalCount = 0, setApprovalsOpen }: any) {
  return (
    <div style={{
      width: open ? 228 : 64, background: "#111827", height: "100vh",
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "sticky", top: 0, transition: "width 0.2s ease", overflow: "hidden",
    }}>
      <div style={{ padding: "16px 12px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {open && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: 18, fontWeight: 800 }}>P</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.3, whiteSpace: "nowrap" }}>Prowess</div>
              <div style={{ color: "#4b5563", fontSize: 10, whiteSpace: "nowrap" }}>Digital Solutions</div>
            </div>
          </div>
        )}
        {!open && (
          <div style={{ width: 34, height: 34, borderRadius: 9, background: B, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <span style={{ color: "white", fontSize: 18, fontWeight: 800 }}>P</span>
          </div>
        )}
        <button onClick={() => setOpen((v: boolean) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <span style={{ display: "block", width: 18, height: 2, background: "#9ca3af", borderRadius: 2 }} />
          <span style={{ display: "block", width: 18, height: 2, background: "#9ca3af", borderRadius: 2 }} />
          <span style={{ display: "block", width: 18, height: 2, background: "#9ca3af", borderRadius: 2 }} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {NAV.filter(n => {
          if (n.privileged && !isPrivileged(user)) return false;
          if ((n as any).commissionOnly && !isPrivileged(user) && !user.earns_commission) return false;
    if ((n as any).adminOnly && user.role !== "admin") return false;
          return true;
        }).map(n => {
          const on = page === n.id;
          return (
            <button key={n.id} onClick={() => setPage(n.id)} title={n.label} style={{
              display: "flex", alignItems: "center", gap: open ? 11 : 0, width: "100%",
              padding: open ? "10px 12px" : "10px 0", borderRadius: 10, justifyContent: open ? "flex-start" : "center",
              background: on ? B + "22" : "transparent", border: "none", cursor: "pointer",
              color: on ? "#7ecfd4" : "#9ca3af", fontSize: 14, fontWeight: on ? 600 : 400,
              marginBottom: 2, textAlign: "left", overflow: "hidden", whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {open && <span style={{ flex: 1 }}>{n.label}</span>}
              {open && n.id === "approvals" && approvalCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#ef4444", color: "white", borderRadius: 20, padding: "1px 7px", flexShrink: 0 }}>{approvalCount}</span>
              )}
              {!open && n.id === "approvals" && approvalCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              )}
              {open && on && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: B, flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Approvals button - privileged only */}
      {isPrivileged(user) && (
        <div style={{ padding: "0 8px 6px" }}>
          <button onClick={() => setApprovalsOpen(true)} title="Approvals" style={{
            display: "flex", alignItems: "center", gap: open ? 11 : 0, width: "100%",
            padding: open ? "10px 12px" : "10px 0", borderRadius: 10, justifyContent: open ? "flex-start" : "center",
            background: approvalCount > 0 ? "#d97706" + "22" : "transparent",
            border: approvalCount > 0 ? "1px solid #d9770640" : "1px solid transparent",
            cursor: "pointer", color: approvalCount > 0 ? "#fbbf24" : "#9ca3af",
            fontSize: 14, fontWeight: approvalCount > 0 ? 600 : 400,
            marginBottom: 2, textAlign: "left", overflow: "hidden", whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>🔍</span>
            {open && <span style={{ flex: 1 }}>Approvals</span>}
            {open && approvalCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "#ef4444", color: "white", borderRadius: 20, padding: "1px 7px", flexShrink: 0 }}>{approvalCount}</span>
            )}
            {!open && approvalCount > 0 && (
              <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            )}
          </button>
        </div>
      )}

      <div style={{ padding: "12px 8px", borderTop: "1px solid #1f2937" }}>
        {open ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "0 4px" }}>
              <Av user={user} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "white", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ color: "#6b7280", fontSize: 11 }}>{user.role === "admin" ? "Administrator" : user.title}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 8, background: "#1f2937", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={onLogout} title="Sign Out" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "10px 0", borderRadius: 8, background: "#1f2937", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>
            ⏻
          </button>
        )}
      </div>
    </div>
  );
}

function TopBar({ user, page, isMobile, onMenuOpen }: { user: any; page: string; isMobile?: boolean; onMenuOpen?: () => void }) {
  const titles: Record<string, string> = {
    dashboard: "Dashboard", tasks: "Tasks", activity: "Activity Log",
    kpi: "KPI Tracker", leaderboard: "Leaderboard", reports: "Reports", team: "Team", settings: "Settings",
  };
  const icons: Record<string, string> = {
    dashboard: "🏠", tasks: "✅", activity: "📝", kpi: "🎯",
    leaderboard: "🏆", reports: "📊", team: "👥", settings: "⚙️",
  };
  return (
    <div style={{
      background: "white", borderBottom: "1px solid #e2e8f0",
      padding: isMobile ? "0 14px" : "0 28px",
      height: isMobile ? 54 : 58,
      display: "flex", alignItems: "center",
      justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Mobile: hamburger button */}
        {isMobile && (
          <button onClick={onMenuOpen} style={{
            background: "#f1f5f9", border: "none", borderRadius: 9, width: 38, height: 38,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, cursor: "pointer", flexShrink: 0,
          }}>
            <span style={{ display: "block", width: 16, height: 2, background: "#374151", borderRadius: 2 }} />
            <span style={{ display: "block", width: 16, height: 2, background: "#374151", borderRadius: 2 }} />
            <span style={{ display: "block", width: 10, height: 2, background: "#374151", borderRadius: 2, alignSelf: "flex-start", marginLeft: 3 }} />
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {isMobile && <span style={{ fontSize: 18 }}>{icons[page]}</span>}
          <h1 style={{ fontSize: isMobile ? 16 : 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {titles[page]}
          </h1>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 14 }}>
        {!isMobile && (
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", padding: "5px 10px 5px 6px", borderRadius: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 500, maxWidth: isMobile ? 90 : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name}
          </span>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ tasks, logs, users, kpiAssignments, kpiLogs, weeklyWinners, monthlyWinners, setPage }: any) {
  const scores  = useMemo(() => computeScores(tasks, logs, users), [tasks, logs, users]);

  // Derive effective status per task — assignment-level status takes priority over task-level
  const effectiveStatus = (t: any) => {
    const assignments: any[] = t.task_assignments || [];
    if (assignments.length === 0) return t.status || "pending";
    if (assignments.every((a: any) => a.status === "completed")) return "completed";
    if (assignments.some((a: any) => a.status === "in-progress" || a.status === "completed")) return "in-progress";
    return t.status || "pending";
  };

  const thisMonthStr = fmt(today).slice(0, 7); // reused below as thisMonth
  const monthTasks = tasks.filter((t: any) => (t.created_at || "").slice(0, 7) === thisMonthStr);
  const total     = monthTasks.length;
  const completed = monthTasks.filter((t: any) => effectiveStatus(t) === "completed").length;
  const inProg    = monthTasks.filter((t: any) => effectiveStatus(t) === "in-progress").length;
  const overdue   = tasks.filter((t: any) => t.deadline && t.deadline < fmt(today) && effectiveStatus(t) !== "completed").length;

  const { start: weekBarStart } = getWeekBounds();
  const weekBarDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekBar = weekBarDays.map((day, i) => {
    const d = new Date(weekBarStart);
    d.setDate(d.getDate() + i);
    const dateStr = fmt(d);
    const count = tasks.filter((t: any) => {
      const ca = (t.completed_at ?? t.completedAt ?? "");
      return effectiveStatus(t) === "completed" && ca.slice(0, 10) === dateStr;
    }).length;
    return { day, tasks: count };
  });
  const pie = [
    { name: "Completed",   value: completed,                       color: "#22c55e" },
    { name: "In Progress", value: inProg,                          color: "#3b82f6" },
    { name: "Pending",     value: total - completed - inProg,      color: "#cbd5e1" },
  ];
  const recent = [...logs].map(normLog).sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 3);

  // -- KPI health for this month ----------------------------------------------
  const thisMonth = fmt(today).slice(0, 7);
  const monthKpis = (kpiAssignments || []).filter((a: any) => a.month === thisMonth);
  const staffUsers = (users || []).filter((u: any) => u.role === "member" || u.role === "leader");
  const membersWithKpi = new Set(monthKpis.map((a: any) => a.assigned_to));
  const membersWithoutKpi = staffUsers.filter((u: any) => !membersWithKpi.has(u.id));
  const onTrack  = monthKpis.filter((a: any) => kpiPct(kpiCurrentValue(a, kpiLogs || []), a.target_value) >= 50).length;
  const behind   = monthKpis.filter((a: any) => {
    const p = kpiPct(kpiCurrentValue(a, kpiLogs || []), a.target_value);
    return p < 50 && !a.verdict;
  }).length;
  const kpiTotal = monthKpis.length;

  const pendingApprovals = expandTasksPerAssignee(tasks.map(normTask)).filter((t: any) =>
    t.approvalStatus === "needs-review" && t._singleAssignee
  ).length + logs.map(normLog).filter((l: any) => l.approvalStatus === "needs-review").length;
  const computedMonthLeader = computeMonthlyScores(tasks, logs, users)[0] || null;
  const monthWinner =
    (monthlyWinners || []).find((w: any) => w.month === thisMonth) ||
    (monthlyWinners || [])[0] ||
    (computedMonthLeader ? {
      month: thisMonth,
      winner_id: computedMonthLeader.userId,
      winner_name: computedMonthLeader.name,
      total_points: computedMonthLeader.score,
      tasks_completed: computedMonthLeader.tasksCompleted,
      logs_submitted: computedMonthLeader.logsCount,
    } : null);
  const lastWinner = !monthWinner && weeklyWinners && weeklyWinners.length > 0 ? weeklyWinners[0] : null;

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      {lastWinner && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#fffbeb,#fef9c3)", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 20px" }}>
          <span style={{ fontSize: 32 }}>🏆</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Team Member of the Week</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{lastWinner.winner_name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {lastWinner.total_points}pts -- {lastWinner.tasks_completed} tasks -- {lastWinner.logs_submitted} logs
              {" | "} Week of {lastWinner.week_start}
            </div>
          </div>
        </div>
      )}
      {/* Team Member of the Month banner */}
      {(() => {
        if (!monthWinner) return null;
        const monthLabel = new Date(monthWinner.month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#fdf4ff,#fae8ff)", border: "1px solid #e879f9", borderRadius: 14, padding: "14px 20px" }}>
            <span style={{ fontSize: 32 }}>🌟</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#86198f", textTransform: "uppercase", letterSpacing: "0.5px" }}>{(monthlyWinners || []).length > 0 ? "Employee of the Month" : "Current Employee of the Month"} — {monthLabel}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{monthWinner.winner_name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {monthWinner.total_points}pts · {monthWinner.tasks_completed} tasks · {monthWinner.logs_submitted} logs
              </div>
            </div>
          </div>
        );
      })()}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Stat icon="📋" label="Total Tasks"  value={total}     sub="This month"   color="#6366f1" />
        <Stat icon="✅" label="Completed"    value={completed} sub={`${total ? Math.round(completed / total * 100) : 0}% rate`} color="#22c55e" />
        <Stat icon="🔄" label="In Progress"  value={inProg}    sub="Active now"   color="#3b82f6" />
        <Stat icon="⚠️" label="Overdue"      value={overdue}   sub="Need attention" color="#ef4444" />
        {pendingApprovals > 0 && (
          <Stat icon="🔍" label="Need Approval" value={pendingApprovals} sub="Tasks and logs" color="#d97706" />
        )}
      </div>

      <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Weekly Task Completion</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weekBar} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="tasks" fill={B} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Task Status Split</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {pie.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ color: "#64748b", flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Recent Team Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recent.map((log: any) => {
              const u = normUser(users.find((u: any) => u.id === log.userId));
              return (
                <div key={log.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Av user={u} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u?.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {log.taskTitle} {" | "} {log.timeSpent}h {" | "} {log.project}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {fmtTime(log.created_at) || log.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>🏆 Top Performers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scores.slice(0, 4).map((s: any, i: number) => {
              const u = users.find((u: any) => u.id === s.userId);
              return (
                <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#f59e0b" : "#94a3b8", width: 18 }}>
                    #{i + 1}
                  </div>
                  <Av user={u} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{s.tasksCompleted} tasks done</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: B }}>{s.score}pt</div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setPage("leaderboard")} style={{
            marginTop: 16, width: "100%", padding: "10px", borderRadius: 10,
            background: B + "12", border: `1px solid ${B}30`, color: B,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            View Full Leaderboard
          </button>
        </Card>
      </div>
      {/* -- KPI Health this month -- */}
      {(kpiTotal > 0 || membersWithoutKpi.length > 0) && (
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🎯 KPI Health - {new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
            <button onClick={() => setPage("kpi")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: B + "12", border: `1px solid ${B}30`, color: B, fontWeight: 600, cursor: "pointer" }}>
              Manage KPIs {">"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: membersWithoutKpi.length > 0 ? 18 : 0 }}>
            {[
              { label: "Total KPIs", value: kpiTotal, color: "#6366f1", icon: "📊" },
              { label: "On Track",   value: onTrack,  color: "#22c55e", icon: "✅" },
              { label: "Behind",     value: behind,   color: behind > 0 ? "#ef4444" : "#94a3b8", icon: "⚠️" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {membersWithoutKpi.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
                ⚡ {membersWithoutKpi.length} member{membersWithoutKpi.length !== 1 ? "s" : ""} with no KPIs set this month
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {membersWithoutKpi.slice(0, 6).map((u: any) => {
                  const nu = normUser(u);
                  return (
                    <div key={nu.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "white", borderRadius: 20, padding: "3px 10px 3px 4px", border: "1px solid #fde68a" }}>
                      <Av user={nu} size={20} />
                      <span style={{ fontSize: 12, color: "#78350f", fontWeight: 500 }}>{nu.name}</span>
                    </div>
                  );
                })}
                {membersWithoutKpi.length > 6 && (
                  <span style={{ fontSize: 12, color: "#92400e", padding: "3px 8px" }}>+{membersWithoutKpi.length - 6} more</span>
                )}
              </div>
              <button onClick={() => setPage("kpi")} style={{ marginTop: 10, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#d97706", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>
                Assign KPIs Now
              </button>
            </div>
          )}
        </Card>
      )}

      {/* If no KPIs set at all yet, show a gentle prompt */}
      {kpiTotal === 0 && membersWithoutKpi.length === 0 && staffUsers.length > 0 && (
        <Card style={{ padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No KPIs set for this month yet</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Assign KPI targets to your team to start tracking performance.</div>
          </div>
          <button onClick={() => setPage("kpi")} style={{ padding: "10px 16px", borderRadius: 10, background: B, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Set KPIs
          </button>
        </Card>
      )}
    </div>
  );
}

function MemberDashboard({ user, tasks, logs, users, kpiAssignments, kpiLogs, weeklyWinners, monthlyWinners, setPage }: any) {
  const myT  = expandTasksPerAssignee(tasks.map(normTask)).filter((t: any) => t._singleAssignee === user.id);
  const myL  = logs.map(normLog).filter((l: any) => l.userId === user.id);
  const done = myT.filter((t: any) => t.status === "completed").length;
  const od   = myT.filter((t: any) => t.deadline && t.deadline < fmt(today) && t.status !== "completed").length;

  // Weekly scoring (approved only)
  const weeklyScores = useMemo(() => computeWeeklyScores(tasks, logs, users || []), [tasks, logs, users]);
  const myWeekly = weeklyScores.find((s: any) => s.userId === user.id);
  const weeklyPts = myWeekly?.score || 0;
  const weeklyRank = weeklyScores.findIndex((s: any) => s.userId === user.id) + 1;
  const leader = weeklyScores[0];
  const toFirst = leader && leader.userId !== user.id ? Math.max(0, leader.score - weeklyPts + 1) : 0;
  const pctToFirst = leader && leader.score > 0 ? Math.min(100, Math.round((weeklyPts / leader.score) * 100)) : (weeklyPts > 0 ? 100 : 0);
  const thisMonth   = fmt(today).slice(0, 7);

  const computedMonthLeader = computeMonthlyScores(tasks, logs, users)[0] || null;
  const monthWinner =
    (monthlyWinners || []).find((w: any) => w.month === thisMonth) ||
    (monthlyWinners || [])[0] ||
    (computedMonthLeader ? {
      month: thisMonth,
      winner_id: computedMonthLeader.userId,
      winner_name: computedMonthLeader.name,
      total_points: computedMonthLeader.score,
      tasks_completed: computedMonthLeader.tasksCompleted,
      logs_submitted: computedMonthLeader.logsCount,
    } : null);

  // Last winner from DB
  const lastWinner = !monthWinner && weeklyWinners && weeklyWinners.length > 0 ? weeklyWinners[0] : null;
  const isTMOTW = lastWinner && lastWinner.winner_id === user.id;
  const isCurrentLeader = weeklyScores.length > 0 && weeklyScores[0].userId === user.id && weeklyPts > 0;

  let pts = 0;
  myT.forEach((t: any) => {
    if (t.status === "completed" && t.approvalStatus === "approved") {
      pts += 10;
      if (t.priority === "high") pts += 5;
      if (t.completedAt && t.completedAt <= t.deadline) pts += 5;
      else if (t.completedAt && t.deadline && t.completedAt > t.deadline) pts -= 5;
    }
  });
  pts = Math.max(0, pts + myL.filter((l: any) => l.approvalStatus === "approved").length * 3);
  const prog = myT.length ? Math.round(done / myT.length * 100) : 0;

  // -- KPI snapshot ----------------------------------------------------------
  const myKpis      = (kpiAssignments || []).filter((a: any) => a.assigned_to === user.id && a.month === thisMonth);
  const kpiOnTrack  = myKpis.filter((a: any) => kpiPct(kpiCurrentValue(a, kpiLogs || []), a.target_value) >= 50).length;
  const kpiUnlogged = myKpis.filter((a: any) => !(kpiLogs || []).some((l: any) => l.assignment_id === a.id)).length;

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Rejected items alert - shown prominently so member knows to resubmit */}
      {(() => {
        const rejectedTasks = myT.filter((t: any) => t.approvalStatus === "rejected");
        const rejectedLogs  = myL.filter((l: any) => l.approvalStatus === "rejected");
        const total = rejectedTasks.length + rejectedLogs.length;
        if (total === 0) return null;
        return (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>❌</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>
                {total} item{total !== 1 ? "s" : ""} rejected -- action required
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rejectedTasks.map((t: any) => (
                <div key={t.id} style={{ background: "white", borderRadius: 10, padding: "10px 14px", border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Task: {t.title}</div>
                  {t.approvalNote && <div style={{ fontSize: 12, color: "#7f1d1d" }}>Reason: {t.approvalNote}</div>}
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>Go to Tasks to resubmit</div>
                </div>
              ))}
              {rejectedLogs.map((l: any) => (
                <div key={l.id} style={{ background: "white", borderRadius: 10, padding: "10px 14px", border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Log: {l.taskTitle}</div>
                  {l.approvalNote && <div style={{ fontSize: 12, color: "#7f1d1d" }}>Reason: {l.approvalNote}</div>}
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>Go to Activity Log to resubmit</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {!monthWinner && isTMOTW && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#fffbeb,#fef9c3)", border: "2px solid #f59e0b", borderRadius: 16, padding: "16px 20px" }}>
          <span style={{ fontSize: 40 }}>🏆</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Team Member of the Week</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Congratulations, {user.name}!</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {lastWinner.total_points}pts -- {lastWinner.tasks_completed} tasks -- {lastWinner.logs_submitted} logs
            </div>
          </div>
        </div>
      )}
      {!monthWinner && !isTMOTW && isCurrentLeader && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #86efac", borderRadius: 14, padding: "12px 18px" }}>
          <span style={{ fontSize: 28 }}>🌟</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>You are currently #1 this week!</div>
            <div style={{ fontSize: 12, color: "#4ade80" }}>Keep going to claim the weekly title.</div>
          </div>
        </div>
      )}
      {/* Team Member of the Month banner */}
      {(() => {
        if (!monthWinner) return null;
        const monthLabel = new Date(monthWinner.month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const isMonthWinner = monthWinner.winner_id === user.id;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 14,
            background: isMonthWinner ? "linear-gradient(135deg,#fdf4ff,#fae8ff)" : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
            border: isMonthWinner ? "2px solid #e879f9" : "1px solid #e2e8f0",
            borderRadius: 16, padding: "16px 20px" }}>
            <span style={{ fontSize: isMonthWinner ? 40 : 28 }}>{isMonthWinner ? "🌟" : "🏆"}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isMonthWinner ? "#86198f" : "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {((monthlyWinners || []).length > 0 ? "Employee of the Month" : "Current Employee of the Month")} — {monthLabel}
              </div>
              {isMonthWinner ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Congratulations, {user.name}! 🎉</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{monthWinner.total_points}pts · {monthWinner.tasks_completed} tasks · {monthWinner.logs_submitted} logs</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{monthWinner.winner_name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{monthWinner.total_points}pts · {monthWinner.tasks_completed} tasks · {monthWinner.logs_submitted} logs</div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Stat icon="📋" label="Assigned Tasks" value={myT.length}       color="#6366f1" />
        <Stat icon="✅" label="Completed"      value={done}             color="#22c55e" />
        <Stat icon="⚡" label="All-Time Score" value={`${pts}pt`}       sub="Approved only" color={B} />
        <Stat icon="📅" label="Weekly Points"  value={`${weeklyPts}pt`} sub={`Rank #${weeklyRank}`} color="#f59e0b" />
        <Stat icon="⚠️" label="Overdue"        value={od}               color="#ef4444" />
      </div>

      {/* Weekly progress to #1 */}
      {weeklyScores.length > 1 && (
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Weekly Race</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Rank #{weeklyRank} of {weeklyScores.length}</div>
          </div>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${pctToFirst}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)", borderRadius: 10, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {isCurrentLeader
              ? "You are leading this week!"
              : `${toFirst} more point${toFirst !== 1 ? "s" : ""} to reach #1 (${leader?.name || ""})`}
          </div>
          {/* Mini leaderboard top 3 */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {weeklyScores.slice(0, 3).map((s: any, i: number) => (
              <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: s.userId === user.id ? B + "12" : "#f8fafc", border: s.userId === user.id ? `1px solid ${B}30` : "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <Av user={users?.find((u: any) => u.id === s.userId)} size={26} />
                <span style={{ fontSize: 13, fontWeight: s.userId === user.id ? 700 : 400, color: "#0f172a", flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#f59e0b" : "#64748b" }}>{s.score}pt</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Weekly Progress</div>
          <div style={{ fontSize: 14, color: B, fontWeight: 800 }}>{prog}%</div>
        </div>
        <div style={{ height: 10, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${prog}%`,
            background: `linear-gradient(90deg,${B},#7dd3d8)`,
            borderRadius: 10, transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
          {done} of {myT.length} tasks completed
        </div>
      </Card>

      {/* -- KPI Summary card -- */}
      {myKpis.length > 0 && (
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🎯 My KPIs this month</div>
            <button onClick={() => setPage("kpi")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: B + "12", border: `1px solid ${B}30`, color: B, fontWeight: 600, cursor: "pointer" }}>
              View all {">"}
            </button>
          </div>

          {/* Nudge banner */}
          {kpiUnlogged > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                  {kpiUnlogged} KPI{kpiUnlogged !== 1 ? "s" : ""} with no progress logged yet
                </div>
                <div style={{ fontSize: 12, color: "#b45309" }}>Log your progress so your leader can see your work.</div>
              </div>
              <button onClick={() => setPage("kpi")} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "#d97706", border: "none", color: "white", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Log Now
              </button>
            </div>
          )}

          {/* Summary pills */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ padding: "6px 14px", borderRadius: 20, background: "#f1f5f9", fontSize: 13, color: "#374151" }}>
              <strong style={{ color: "#0f172a" }}>{myKpis.length}</strong> assigned
            </div>
            <div style={{ padding: "6px 14px", borderRadius: 20, background: "#dcfce7", fontSize: 13, color: "#166534" }}>
              <strong>{kpiOnTrack}</strong> on track
            </div>
            {myKpis.filter((a: any) => a.verdict).length > 0 && (
              <div style={{ padding: "6px 14px", borderRadius: 20, background: "#dbeafe", fontSize: 13, color: "#1e40af" }}>
                <strong>{myKpis.filter((a: any) => a.verdict).length}</strong> reviewed
              </div>
            )}
          </div>

          {/* Mini progress bars for each KPI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myKpis.slice(0, 4).map((a: any) => {
              const cur = kpiCurrentValue(a, kpiLogs || []);
              const pct = kpiPct(cur, a.target_value);
              const barColor = pct >= 100 ? "#059669" : pct >= 50 ? "#2563eb" : "#d97706";
              return (
                <div key={a.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{a.metric_name}</span>
                    <span style={{ fontSize: 12, color: barColor, fontWeight: 700 }}>
                      {cur} / {a.target_value} {a.unit}
                      {a.verdict && <> {" | "} <VerdictBadge verdict={a.verdict} /></>}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
            {myKpis.length > 4 && (
              <button onClick={() => setPage("kpi")} style={{ fontSize: 12, color: B, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, marginTop: 2 }}>
                +{myKpis.length - 4} more KPIs {">"}
              </button>
            )}
          </div>
        </Card>
      )}

      <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>My Tasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myT.filter((t: any) => t.status !== "completed" || t.approvalStatus === "rejected")
              .sort((a: any, b: any) => (a.deadline || "").localeCompare(b.deadline || ""))
              .slice(0, 5)
              .map((task: any) => (
                <div key={task.id} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${task.approvalStatus === "rejected" ? "#fecaca" : "#f1f5f9"}`, background: task.approvalStatus === "rejected" ? "#fef2f2" : "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{task.title}</div>
                    <Pill type="priority" value={task.priority} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Pill type="status" value={task.status} />
                    {task.approvalStatus && task.approvalStatus !== "pending" && task.approvalStatus !== "approved" && (
                      <ApprBadge status={task.approvalStatus} />
                    )}
                    <span style={{ fontSize: 11, color: task.deadline < fmt(today) ? "#ef4444" : "#94a3b8" }}>
                      📅 {task.deadline}
                    </span>
                  </div>
                </div>
              ))}
            {myT.filter((t: any) => t.status !== "completed" || t.approvalStatus === "rejected").length === 0 && (
              <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                All caught up! 🎉
              </div>
            )}
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...myL].sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 5).map((log: any) => (
              <div key={log.id} style={{ paddingBottom: 10, borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{log.taskTitle}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{log.timeSpent}h</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.description}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {log.project && <>{log.project} {" | "}</>}
                    {fmtTime(log.created_at) || log.date}
                  </span>
                  {log.approvalStatus && log.approvalStatus !== "approved" && (
                    <ApprBadge status={log.approvalStatus} />
                  )}
                </div>
              </div>
            ))}
            {myL.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>No activity logged yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, users, user, onClose, onUpdate, onDelete, onApproveTask, onRejectTask, onReassign }: any) {
  const assigneeUsers = task.assignees
    .map((uid: string) => normUser(users.find((u: any) => u.id === uid)))
    .filter(Boolean);
  const late = task.deadline < fmt(today) && task.status !== "completed";
  const [subLinks,       setSubLinks]       = useState<{ label: string; url: string }[]>(
    task.approvalStatus === "rejected" && task.submission_links ? task.submission_links : []
  );
  const [resubmitNote,   setResubmitNote]   = useState("");
  const [rejectMode,     setRejectMode]     = useState(false);
  const [rejectNote,     setRejectNote]     = useState("");
  const [approveSaving,  setApproveSaving]  = useState(false);
  const [reassignMode,   setReassignMode]   = useState(false);
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>(task.assignees ?? []);
  const [reassignSaving, setReassignSaving] = useState(false);

  async function handleReassign() {
    if (newAssigneeIds.length === 0) return;
    setReassignSaving(true);
    await onReassign?.(task.id, newAssigneeIds);
    setReassignSaving(false);
    setReassignMode(false);
    onClose();
  }

  // Can this user approve? Admin approves all non-admins. Leader approves their team members.
  const canApprove = (() => {
    if (task.approvalStatus !== "needs-review") return false;
    const rawAssigneeUsers = task.assignees.map((uid: string) => users.find((u: any) => u.id === uid)).filter(Boolean);
    if (user.role === "admin") return rawAssigneeUsers.some((a: any) => a.role !== "admin");
    if (user.role === "leader") return rawAssigneeUsers.some((a: any) => a.managed_by === user.id && a.role !== "admin");
    return false;
  })();

  async function handleApprove() {
    setApproveSaving(true);
    await onApproveTask?.(task.id, task._singleAssignee ?? null);
    setApproveSaving(false);
    onClose();
  }
  async function handleReject() {
    if (!rejectNote.trim()) return;
    setApproveSaving(true);
    await onRejectTask?.(task.id, rejectNote.trim(), task._singleAssignee ?? null);
    setApproveSaving(false);
    onClose();
  }

  const STATUS_ORDER = ["pending", "in-progress", "completed"];
  const currentIdx = STATUS_ORDER.indexOf(task.status);

  const handleStatusUpdate = (s: string) => {
    const validLinks = subLinks.filter(l => l.url.trim());
    onUpdate(task.id, s, validLinks.length ? validLinks : null, resubmitNote.trim() || null, task._singleAssignee ?? null);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ padding: 32, width: 520, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{task.title}</div>
            {late && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, background: "#fef2f2", padding: "2px 8px", borderRadius: 20 }}>Overdue</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", flexShrink: 0, padding: 4 }}>✕</button>
        </div>

        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: task.links?.length ? 16 : 22, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {task.description || "No description provided."}
        </div>

        {/* Reference links set by admin when creating the task */}
        {task.links && task.links.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Reference Links</div>
            <LinkDisplay links={task.links} />
          </div>
        )}

        {/* Submitted work links - shown when already submitted */}
        {task.submission_links && task.submission_links.length > 0 && (
          <div style={{ marginBottom: 18, padding: "14px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>✅ Submitted Work</div>
            <LinkDisplay links={task.submission_links} />
          </div>
        )}

        <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[
            ["Priority",   <Pill type="priority" value={task.priority} />],
            ["Status",     <Pill type="status" value={task.status} />],
            ["Project",    <span style={{ fontSize: 13, color: "#374151" }}>📁 {task.project || "None"}</span>],
            ["Deadline",   <span style={{ fontSize: 13, color: late ? "#ef4444" : "#374151" }}>📅 {task.deadline || "No deadline"}</span>],
            ["Assigned To", assigneeUsers.length > 0
              ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {assigneeUsers.map((a: any) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Av user={a} size={18} /><span style={{ fontSize: 12 }}>{a.name}</span>
                    </div>
                  ))}
                </div>
              : <span style={{ fontSize: 13, color: "#94a3b8" }}>Unassigned</span>],
            ["Created",    <span style={{ fontSize: 13, color: "#374151" }}>{task.created_at ? task.created_at.slice(0, 10) : ""}</span>],
          ].map(([label, val]) => (
            <div key={label as string} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
              <div>{val}</div>
            </div>
          ))}
        </div>

        {/* Approval status banner */}
        {task.approvalStatus === "needs-review" && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Waiting for admin approval</div>
              <div style={{ fontSize: 12, color: "#b45309" }}>Points will count once approved.</div>
            </div>
          </div>
        )}
        {task.approvalStatus === "rejected" && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>Task rejected by admin</div>
            {task.approvalNote && <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>Reason: {task.approvalNote}</div>}
            <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>Update your submission below and click Resubmit.</div>
          </div>
        )}

        {/* Submission links - show when task is not yet approved, only for assignees */}
        {(task.status !== "completed" || task.approvalStatus === "rejected") && task.assignees.includes(user.id) && (
          <div style={{ marginBottom: 16, padding: "16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>
              📎 Attach work links <span style={{ fontWeight: 400, color: "#94a3b8" }}>- add before or when marking complete</span>
            </div>
            <LinkAttacher links={subLinks} onChange={setSubLinks} />
          </div>
        )}

        {/* Status controls */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Update Status</div>
          {task.approvalStatus === "needs-review" ? (
            <div style={{ fontSize: 13, color: "#94a3b8", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
              This task is pending approval and cannot be changed right now.
            </div>
          ) : task.approvalStatus === "approved" && task.status === "completed" ? (
            <div style={{ fontSize: 13, color: "#059669", padding: "10px 14px", background: "#d1fae5", borderRadius: 10, fontWeight: 600 }}>
              ✅ Approved and counted in your score.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_ORDER.map((s, idx) => (
                  <button key={s}
                    disabled={task.status === s || (!isPrivileged(user) && idx < currentIdx)}
                    onClick={() => handleStatusUpdate(s)}
                    style={{
                      padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      cursor: task.status === s ? "default" : "pointer",
                      background: task.status === s ? B : "#f1f5f9",
                      color: task.status === s ? "white" : "#374151",
                      border: task.status === s ? `2px solid ${B}` : "2px solid transparent",
                      opacity: !isPrivileged(user) && idx < currentIdx ? 0.4 : 1,
                    }}
                  >
                    {s === "pending" ? "Pending" : s === "in-progress" ? "In Progress" : "Completed"}
                  </button>
                ))}
              </div>
              {task.approvalStatus === "rejected" && task.status === "completed" && task.assignees.includes(user.id) && (
                <>
                  <div style={{ marginTop: 12, marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Add a note (optional)
                    </label>
                    <textarea value={resubmitNote} onChange={e => setResubmitNote(e.target.value)} rows={2}
                      placeholder="Briefly explain what you changed or fixed..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <button onClick={() => { handleStatusUpdate("completed"); }}
                    style={{ marginTop: 10, width: "100%", padding: "11px", borderRadius: 10, background: "#d97706", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Resubmit for Approval
                  </button>
                </>
              )}
              {!isPrivileged(user) && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Only admins and leaders can move a task backwards</div>}
            </>
          )}
        </div>

        {/* ── Approve / Reject ── shown to admin/leader when task needs review */}
        {canApprove && (
          <div style={{ marginBottom: 16, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 12 }}>
              This task is awaiting your approval
            </div>
            {!rejectMode ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleApprove} disabled={approveSaving}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#16a34a", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: approveSaving ? "not-allowed" : "pointer", opacity: approveSaving ? 0.7 : 1 }}>
                  {approveSaving ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => setRejectMode(true)} disabled={approveSaving}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Reject
                </button>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Reason for rejection (required)
                </label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3}
                  placeholder="e.g. Submission link missing, task not fully completed..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleReject} disabled={approveSaving || !rejectNote.trim()}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#dc2626", border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: !rejectNote.trim() ? "not-allowed" : "pointer", opacity: !rejectNote.trim() ? 0.6 : 1 }}>
                    {approveSaving ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                  <button onClick={() => { setRejectMode(false); setRejectNote(""); }}
                    style={{ padding: "10px 16px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Reassign Task ── privileged users only */}
        {isPrivileged(user) && (
          <div style={{ marginBottom: 14 }}>
            {!reassignMode ? (
              <button onClick={() => setReassignMode(true)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                👥 Reassign Task
              </button>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Reassign to</div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 10px", background: "white", marginBottom: 12 }}>
                  {users.filter((u: any) => isStaff(u)).map((u: any) => {
                    const nu = normUser(u);
                    const checked = newAssigneeIds.includes(u.id);
                    return (
                      <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", borderRadius: 8, background: checked ? B + "10" : "transparent" }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => setNewAssigneeIds(p =>
                            e.target.checked ? [...p, u.id] : p.filter((id: string) => id !== u.id)
                          )}
                          style={{ width: 15, height: 15, accentColor: B, cursor: "pointer" }} />
                        <Av user={nu} size={20} />
                        <span style={{ fontSize: 13, color: "#374151" }}>{nu.name}</span>
                      </label>
                    );
                  })}
                </div>
                {newAssigneeIds.length > 0 && (
                  <div style={{ fontSize: 11, color: B, marginBottom: 10 }}>
                    {newAssigneeIds.length} member{newAssigneeIds.length > 1 ? "s" : ""} selected
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleReassign} disabled={reassignSaving || newAssigneeIds.length === 0}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: newAssigneeIds.length === 0 ? "not-allowed" : "pointer", opacity: newAssigneeIds.length === 0 ? 0.5 : 1 }}>
                    {reassignSaving ? "Saving..." : "Save Reassignment"}
                  </button>
                  <button onClick={() => { setReassignMode(false); setNewAssigneeIds(task.assignees ?? []); }}
                    style={{ padding: "10px 16px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {user.role === "admin" && (() => {
          const isMulti = (task.task_assignments ?? []).length > 1;
          return (
            <button
              onClick={() => { onDelete(task.id, isMulti ? task._singleAssignee : null); onClose(); }}
              style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {isMulti ? "Remove This Assignee" : "Delete Task"}
            </button>
          );
        })()}
      </Card>
    </div>
  );
}

function TasksPage({ user, tasks, setTasks, users, onCreateTask, onUpdateTaskStatus, onDeleteTask, onApproveTask, onRejectTask, onReassignTask }: any) {
  const [modal,      setModal]      = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [fStat,      setFStat]      = useState("all");
  const [fPri,       setFPri]       = useState("all");
  const [fPeriod,    setFPeriod]    = useState("all");
  const [taskPage,   setTaskPage]   = useState(1);
  const TASKS_PER_PAGE = 5;
  const [form,       setForm]       = useState({ title: "", description: "", assigneeIds: [] as string[], priority: "medium", project: "", deadline: "" });
  const [links,      setLinks]      = useState<{ label: string; url: string }[]>([]);

  const normTasks = tasks.map(normTask);
  const expandedTasks = expandTasksPerAssignee(normTasks);
  const base = user.role === "admin"
    ? expandedTasks
    : user.role === "leader"
      ? expandedTasks.filter((t: any) => {
          if (!t._singleAssignee) return false;
          if (t._singleAssignee === user.id) return true;
          const m = users.find((u: any) => u.id === t._singleAssignee);
          return m && m.managed_by === user.id;
        })
      : expandedTasks.filter((t: any) => t._singleAssignee === user.id);
  const filtered  = base.filter((t: any) => {
    if (fStat !== "all" && t.status !== fStat) return false;
    if (fPri  !== "all" && t.priority !== fPri) return false;
    if (fPeriod !== "all") {
      const d = t.createdAt || t.deadline || "";
      if (!d) return false;
      const dt = new Date(d);
      const now = new Date();
      if (fPeriod === "today") return d === fmt(today);
      if (fPeriod === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); return dt >= w; }
      if (fPeriod === "month") return d.slice(0, 7) === fmt(today).slice(0, 7);
      if (fPeriod === "year")  return d.slice(0, 4) === fmt(today).slice(0, 4);
    }
    return true;
  });
  const taskTotalPages = Math.ceil(filtered.length / TASKS_PER_PAGE);
  const pagedTasks = filtered.slice((taskPage - 1) * TASKS_PER_PAGE, taskPage * TASKS_PER_PAGE);

  const upd = (id: string, s: string, submissionLinks?: any[] | null, resubmitNote?: string | null, assigneeId?: string | null) => {
    if (onUpdateTaskStatus) onUpdateTaskStatus(id, s, submissionLinks, resubmitNote, assigneeId);
    setTasks((p: any[]) => p.map(t => t.id === id ? {
      ...t, status: s,
      approval_status: s === "completed" ? "needs-review" : t.approval_status,
      ...(submissionLinks ? { submission_links: submissionLinks } : {}),
      task_assignments: (t.task_assignments ?? []).map((a: any) =>
        a.user_id === assigneeId ? {
          ...a, status: s,
          approval_status: s === "completed" ? "needs-review" : a.approval_status,
          ...(submissionLinks ? { submission_links: submissionLinks } : {}),
        } : a
      ),
    } : t));
  };
  const del = (id: string, assigneeId?: string | null) => {
    if (onDeleteTask) onDeleteTask(id, assigneeId);
    else {
      if (assigneeId) {
        setTasks((p: any[]) => p.map((t: any) => t.id !== id ? t : {
          ...t,
          task_assignments: (t.task_assignments ?? []).filter((a: any) => a.user_id !== assigneeId),
        }).filter((t: any) => (t.task_assignments ?? []).length > 0 || t.id !== id));
      } else {
        setTasks((p: any[]) => p.filter(t => t.id !== id));
      }
    }
  };
  const create = async () => {
    if (!form.title || form.assigneeIds.length === 0) return;
    const validLinks = links.filter(l => l.url.trim());
    if (onCreateTask) await onCreateTask({ ...form, links: validLinks });
    else setTasks((p: any[]) => [...p, {
      id: "t" + Date.now(), ...form, links: validLinks,
      assigned_to: form.assigneeIds[0],
      assignees: form.assigneeIds,
      status: "pending", created_at: fmt(today),
    }]);
    setForm({ title: "", description: "", assigneeIds: [], priority: "medium", project: "", deadline: "" });
    setLinks([]);
    setModal(false);
  };

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {isPrivileged(user) && (
          <button onClick={() => setModal(true)} style={{ padding: "10px 18px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            New Task
          </button>
        )}
        <select value={fStat} onChange={e => { setFStat(e.target.value); setTaskPage(1); }} style={SEL}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={fPri} onChange={e => { setFPri(e.target.value); setTaskPage(1); }} style={SEL}>
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={fPeriod} onChange={e => { setFPeriod(e.target.value); setTaskPage(1); }} style={SEL}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto" }}>
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
            <div style={{ color: "#94a3b8" }}>No tasks match your filters</div>
          </Card>
        )}
        {pagedTasks.map((task: any) => {
          const assigneeUsers = task.assignees
            .map((uid: string) => normUser(users.find((u: any) => u.id === uid)))
            .filter(Boolean);
          const late = task.deadline < fmt(today) && task.status !== "completed";
          return (
            <Card key={task._expandedId}
              onClick={() => setDetailTask(task)}
              style={{ padding: "16px 20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onMouseEnter={(e: any) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={(e: any) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{task.title}</div>
                    {late && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, background: "#fef2f2", padding: "2px 8px", borderRadius: 20 }}>Overdue</span>}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Pill type="priority" value={task.priority} />
                    <Pill type="status" value={task.status} />
                    {task.approvalStatus && task.approvalStatus !== "pending" && (
                      <ApprBadge status={task.approvalStatus} />
                    )}
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {task.project}</span>
                    <span style={{ fontSize: 12, color: late ? "#ef4444" : "#94a3b8" }}>📅 {task.deadline}</span>
                    {task._singleAssignee && (() => {
                      const au = normUser(users.find((u: any) => u.id === task._singleAssignee));
                      return au ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Av user={au} size={18} />
                          <span style={{ fontSize: 12, color: "#64748b" }}>{au.name}</span>
                        </div>
                      ) : null;
                    })()}
                    {task.links?.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: B, background: B + "12", padding: "2px 8px", borderRadius: 20 }}>
                        🔗 {task.links.length} link{task.links.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {task.submission_links?.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20 }}>
                        ✅ Submitted
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: "#cbd5e1", flexShrink: 0, paddingTop: 2 }}>{">"}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tasks pagination */}
      {taskTotalPages > 1 && (
        <Pagination page={taskPage} total={taskTotalPages} onChange={setTaskPage} />
      )}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          user={user}
          onClose={() => setDetailTask(null)}
          onUpdate={upd}
          onDelete={del}
          onApproveTask={onApproveTask}
          onRejectTask={onRejectTask}
          onReassign={async (taskId: string, newIds: string[]) => {
            if (onReassignTask) await onReassignTask(taskId, newIds);
            else setTasks((p: any[]) => p.map((t: any) => t.id === taskId ? {
              ...t,
              assigned_to: newIds[0] ?? null,
              assignees: newIds,
              task_assignments: newIds.map((uid: string) => ({ user_id: uid })),
            } : t));
          }}
        />
      )}

      {/* Create task modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ padding: 32, width: 520, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Create New Task</div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Description - textarea */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                placeholder="Full task details, instructions, requirements..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
            </div>

            {/* Project + Deadline side by side */}
            <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Project</label>
                <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            {/* Assign To - multi-select checkboxes */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                Assign To <span style={{ fontWeight: 400, color: "#94a3b8" }}>(select one or more)</span>
              </label>
              <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 10px", background: "#fafafa" }}>
                {users.filter((u: any) => isStaff(u)).map((u: any) => {
                  const nu = normUser(u);
                  const checked = form.assigneeIds.includes(u.id);
                  return (
                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", borderRadius: 8, background: checked ? B + "10" : "transparent" }}>
                      <input type="checkbox" checked={checked}
                        onChange={e => setForm(f => ({
                          ...f,
                          assigneeIds: e.target.checked
                            ? [...f.assigneeIds, u.id]
                            : f.assigneeIds.filter((id: string) => id !== u.id),
                        }))}
                        style={{ width: 15, height: 15, accentColor: B, cursor: "pointer" }} />
                      <Av user={nu} size={20} />
                      <span style={{ fontSize: 13, color: "#374151" }}>{nu.name}</span>
                    </label>
                  );
                })}
              </div>
              {form.assigneeIds.length > 0 && (
                <div style={{ fontSize: 11, color: B, marginTop: 5 }}>
                  {form.assigneeIds.length} member{form.assigneeIds.length > 1 ? "s" : ""} selected
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <LinkAttacher links={links} onChange={setLinks} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={create} style={{ flex: 1, padding: "12px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Create Task
              </button>
              <button onClick={() => { setModal(false); setLinks([]); }} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#f1f5f9", color: "#374151", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function LogDetailModal({ log, users, currentUser, onClose, onDelete, onResubmit }: any) {
  const lu = normUser(users.find((u: any) => u.id === log.userId));
  const isRejected = log.approvalStatus === "rejected";

  const [editDesc,       setEditDesc]       = useState(log.description || "");
  const [editProject,    setEditProject]    = useState(log.project || "");
  const [editTimeSpent,  setEditTimeSpent]  = useState(String(log.timeSpent || ""));
  const [editStatus,     setEditStatus]     = useState(log.completion_status || "in-progress");
  const [editLinks,      setEditLinks]      = useState<{ label: string; url: string }[]>(log.links || []);
  const [saving,         setSaving]         = useState(false);

  const cs = isRejected ? editStatus : log.completion_status;

  async function handleResubmit() {
    setSaving(true);
    await onResubmit?.(log.id, {
      description:       editDesc,
      project:           editProject,
      time_spent:        parseFloat(editTimeSpent) || 0,
      completion_status: editStatus,
      links:             editLinks,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ padding: 32, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{log.taskTitle}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", padding: 4 }}>✕</button>
        </div>

        {/* Rejection banner */}
        {isRejected && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>This log was rejected</div>
            {log.approvalNote && <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>Reason: {log.approvalNote}</div>}
            <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>Edit anything below and resubmit.</div>
          </div>
        )}

        {/* Needs review banner */}
        {log.approvalStatus === "needs-review" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Waiting for approval</div>
          </div>
        )}

        {lu && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: B + "0d", borderRadius: 12, marginBottom: 20 }}>
            <Av user={lu} size={36} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{lu.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{lu.title || "Team Member"}</div>
            </div>
          </div>
        )}

        {/* Description - editable if rejected */}
        {isRejected ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
          </div>
        ) : (
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 22, padding: "14px 16px", background: "#f8fafc", borderRadius: 12 }}>
            {log.description}
          </div>
        )}

        {/* Fields grid - editable if rejected */}
        {isRejected ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Time Spent (hrs)</label>
              <input type="number" value={editTimeSpent} onChange={e => setEditTimeSpent(e.target.value)} min="0" step="0.5"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Project</label>
              <input value={editProject} onChange={e => setEditProject(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Completion Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                style={{ ...SEL, width: "100%" }}>
                <option value="in-progress">Still in progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              ["Logged At",   fmtTime(log.created_at) || log.date],
              ["Time Spent", `${log.timeSpent}h`],
              ["Project",    log.project || "None"],
              ["Status",     cs === "completed" ? "Completed" : cs === "blocked" ? "Blocked" : "In Progress"],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: label === "Status" ? (cs === "completed" ? "#22c55e" : cs === "blocked" ? "#ef4444" : "#3b82f6") : "#374151" }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Links - editable if rejected, read-only otherwise */}
        {isRejected ? (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Attached Links</label>
            <LinkAttacher links={editLinks} onChange={setEditLinks} />
          </div>
        ) : log.links && log.links.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Attached Links</div>
            <LinkDisplay links={log.links} />
          </div>
        )}

        {/* Resubmit button - only for the log owner */}
        {isRejected && onResubmit && currentUser?.id === log.userId && (
          <button onClick={handleResubmit} disabled={saving || !editDesc.trim()}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14,
              cursor: saving || !editDesc.trim() ? "not-allowed" : "pointer", marginBottom: 10, opacity: saving || !editDesc.trim() ? 0.7 : 1 }}>
            {saving ? "Resubmitting..." : "Resubmit for Approval"}
          </button>
        )}

        {onDelete && (
          <button onClick={() => { onDelete(log.id); onClose(); }} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Delete Entry
          </button>
        )}
      </Card>
    </div>
  );
}

const COMPLETION_STATUS = [
  { value: "in-progress", label: "Still in progress" },
  { value: "completed",   label: "Completed today"   },
  { value: "blocked",     label: "Blocked"            },
];

function ActivityLogPage({ user, users, logs, setLogs, onAddLog, onDeleteLog, onResubmitLog }: any) {
  const [form, setForm] = useState({ taskTitle: "", description: "", project: "", timeSpent: "", completionStatus: "in-progress" });
  const [logLinks, setLogLinks] = useState<{ label: string; url: string }[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [logModal,  setLogModal]  = useState(false);
  const [detailLog, setDetailLog] = useState<any>(null);
  const [fPeriod,   setFPeriod]   = useState("all");
  const [fUser,     setFUser]     = useState("all");
  const [logPage,   setLogPage]   = useState(1);
  const LOGS_PER_PAGE = 5;
  const normLogs = logs.map(normLog);
  const visible = user.role === "admin"
    ? normLogs
    : user.role === "leader"
      ? normLogs.filter((l: any) => {
          const member = users.find((u: any) => u.id === l.userId);
          return l.userId === user.id || (member && member.managed_by === user.id);
        })
      : normLogs.filter((l: any) => l.userId === user.id);
  const filteredLogs = visible.filter((l: any) => {
    if (fUser !== "all" && l.userId !== fUser) return false;
    if (fPeriod !== "all") {
      const d = l.date || "";
      if (!d) return false;
      const dt = new Date(d);
      const now = new Date();
      if (fPeriod === "today") return d === fmt(today);
      if (fPeriod === "week")  { const w = new Date(now); w.setDate(now.getDate() - 7); return dt >= w; }
      if (fPeriod === "month") return d.slice(0, 7) === fmt(today).slice(0, 7);
      if (fPeriod === "year")  return d.slice(0, 4) === fmt(today).slice(0, 4);
    }
    return true;
  });
  const sorted = [...filteredLogs].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const logTotalPages = Math.ceil(sorted.length / LOGS_PER_PAGE);
  const pagedLogs = sorted.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

  const add = async () => {
    if (!form.taskTitle || !form.description) return;
    setSaving(true);
    const validLinks = logLinks.filter(l => l.url.trim());
    if (onAddLog) await onAddLog({ ...form, links: validLinks });
    else setLogs((p: any[]) => [...p, {
      id: "l" + Date.now(), user_id: user.id, task_title: form.taskTitle,
      description: form.description, project: form.project,
      time_spent: parseFloat(form.timeSpent) || 0,
      completion_status: form.completionStatus,
      links: validLinks,
      log_date: fmt(today),
    }]);
    setForm({ taskTitle: "", description: "", project: "", timeSpent: "", completionStatus: "in-progress" });
    setLogLinks([]);
    setSaving(false);
    setLogModal(false);
  };

  const deleteLog = (id: string) => {
    if (onDeleteLog) onDeleteLog(id);
    else setLogs((p: any[]) => p.filter((l: any) => l.id !== id));
  };

  const grp: Record<string, any[]> = {};
  pagedLogs.forEach((l: any) => { (grp[l.date] = grp[l.date] || []).push(l); });

  const yesterday = fmt(new Date(today.getTime() - 86400000));

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>

      {/* Filter bar + Log button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <select value={fPeriod} onChange={e => { setFPeriod(e.target.value); setLogPage(1); }} style={SEL}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        {isPrivileged(user) && (
          <select value={fUser} onChange={e => { setFUser(e.target.value); setLogPage(1); }} style={SEL}>
            <option value="all">All Members</option>
            {users.filter((u: any) => isStaff(u)).map((u: any) => (
              <option key={u.id} value={u.id}>{normUser(u).name}</option>
            ))}
          </select>
        )}
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto" }}>
          {sorted.length} entr{sorted.length !== 1 ? "ies" : "y"}
        </span>
        {(user.role === "member" || user.role === "leader") && (
          <button onClick={() => setLogModal(true)}
            style={{ padding: "9px 18px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Log Today&apos;s Work
          </button>
        )}
      </div>

      {/* Entries */}
      {Object.keys(grp).length === 0 && (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
          <div style={{ color: "#94a3b8", marginBottom: 16 }}>No activity logged yet</div>
          {(user.role === "member" || user.role === "leader") && (
            <button onClick={() => setLogModal(true)}
              style={{ padding: "10px 20px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + Log Your First Entry
            </button>
          )}
        </Card>
      )}
      {Object.entries(grp).map(([date, dl]) => (
        <div key={date} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
            {date === fmt(today) ? "Today" : date === yesterday ? "Yesterday" : date}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dl.map((log: any) => {
              const lu = normUser(users.find((u: any) => u.id === log.userId));
              return (
                <Card key={log.id}
                  onClick={() => setDetailLog(log)}
                  style={{ padding: "16px 18px", cursor: "pointer" }}
                  onMouseEnter={(e: any) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                  onMouseLeave={(e: any) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Av user={lu} size={32} />
                      <div style={{ width: 2, flex: 1, background: "#f1f5f9", borderRadius: 2, minHeight: 16, marginTop: 4 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{log.taskTitle}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{log.timeSpent}h</div>
                      </div>
                      {isPrivileged(user) && lu && (
                        <div style={{ fontSize: 12, color: B, fontWeight: 600, marginBottom: 3 }}>{lu.name}</div>
                      )}
                      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{log.description}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>📁 {log.project}</div>
                        {log.created_at && (
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>🕐 {fmtTime(log.created_at)}</div>
                        )}
                        {log.completion_status && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: log.completion_status === "completed" ? "#f0fdf4" : log.completion_status === "blocked" ? "#fef2f2" : "#eff6ff",
                            color: log.completion_status === "completed" ? "#22c55e" : log.completion_status === "blocked" ? "#ef4444" : "#3b82f6" }}>
                            {log.completion_status === "completed" ? "Completed" : log.completion_status === "blocked" ? "Blocked" : "In Progress"}
                          </span>
                        )}
                        {log.approvalStatus && log.approvalStatus !== "approved" && (
                          <ApprBadge status={log.approvalStatus} />
                        )}
                        {log.links?.length > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: B, background: B + "12", padding: "2px 8px", borderRadius: 20 }}>
                            🔗 {log.links.length} link{log.links.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {logTotalPages > 1 && (
        <Pagination page={logPage} total={logTotalPages} onChange={setLogPage} />
      )}

      {/* Log Today's Work modal */}
      {logModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setLogModal(false); } }}>
          <Card style={{ padding: 28, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Log Today&apos;s Work</div>
              <button onClick={() => setLogModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", padding: 4 }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Task Title</label>
              <input value={form.taskTitle} onChange={e => setForm(f => ({ ...f, taskTitle: e.target.value }))}
                placeholder="What task were you working on?"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>What did you do?</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                placeholder="Describe what you worked on and what you accomplished..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Project</label>
                <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Time Spent (hrs)</label>
                <input type="number" value={form.timeSpent} onChange={e => setForm(f => ({ ...f, timeSpent: e.target.value }))} min="0" step="0.5"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Completion Status</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {COMPLETION_STATUS.map(opt => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `2px solid ${form.completionStatus === opt.value ? B : "#e2e8f0"}`, cursor: "pointer", background: form.completionStatus === opt.value ? B + "0d" : "white" }}>
                    <input type="radio" name="completionStatus" value={opt.value} checked={form.completionStatus === opt.value}
                      onChange={e => setForm(f => ({ ...f, completionStatus: e.target.value }))}
                      style={{ accentColor: B }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <LinkAttacher links={logLinks} onChange={setLogLinks} />

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={add} disabled={saving || !form.taskTitle || !form.description}
                style={{ flex: 1, padding: "13px", borderRadius: 10, background: B, color: "white", border: "none",
                  cursor: saving || !form.taskTitle || !form.description ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 700, opacity: !form.taskTitle || !form.description ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Log Activity"}
              </button>
              <button onClick={() => setLogModal(false)}
                style={{ padding: "13px 20px", borderRadius: 10, background: "#f1f5f9", color: "#374151", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}

      {detailLog && (
        <LogDetailModal
          log={detailLog}
          users={users}
          currentUser={user}
          onClose={() => setDetailLog(null)}
          onDelete={isPrivileged(user) ? deleteLog : undefined}
          onResubmit={onResubmitLog}
        />
      )}
    </div>
  );
}

function LeaderboardPage({ tasks, logs, users, user, weeklyWinners, onCloseWeek, monthlyWinners, onCloseMonth }: any) {
  const [lbTab,           setLbTab]           = useState<"week" | "alltime" | "history">("week");
  const [lbPage,          setLbPage]          = useState(1);
  const [closeModal,      setCloseModal]      = useState(false);
  const [closing,         setClosing]         = useState(false);
  const [closeMonthModal, setCloseMonthModal] = useState(false);
  const [closingMonth,    setClosingMonth]    = useState(false);
  const LB_PER_PAGE = 10;
  const { start: weekStart, end: weekEnd } = getWeekBounds();

  const weeklySc   = useMemo(() => computeWeeklyScores(tasks, logs, users), [tasks, logs, users]);
  const alltimeSc  = useMemo(() => computeScores(tasks, logs, users),       [tasks, logs, users]);
  const monthlySc  = useMemo(() => computeMonthlyScores(tasks, logs, users), [tasks, logs, users]);
  const sc         = lbTab === "week" ? weeklySc : alltimeSc;
  const [top, ...rest] = sc;
  const medals     = ["🥇", "🥈", "🥉"];
  const lbTotalPages = Math.ceil(rest.length / LB_PER_PAGE);
  const pagedRest  = rest.slice((lbPage - 1) * LB_PER_PAGE, lbPage * LB_PER_PAGE);
  const lastWinner = weeklyWinners && weeklyWinners.length > 0 ? weeklyWinners[0] : null;
  const thisMonth = fmt(new Date()).slice(0, 7);
  const lastMonthWinner = (monthlyWinners || []).length > 0 ? monthlyWinners[0] : null;
  const isCurrentMonthClosed = (monthlyWinners || []).some((w: any) => w.month === thisMonth);

  async function handleCloseWeek() {
    if (!weeklySc.length) return;
    setClosing(true);
    await onCloseWeek?.(weekStart, weekEnd, weeklySc);
    setClosing(false);
    setCloseModal(false);
  }

  async function handleCloseMonth() {
    if (!monthlySc.length || isCurrentMonthClosed) return;
    setClosingMonth(true);
    try {
      await onCloseMonth?.(thisMonth, monthlySc);
      setCloseMonthModal(false);
    } catch (e: any) {
      window.alert(e?.message || "Failed to close this month.");
    } finally {
      setClosingMonth(false);
    }
  }

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>

      {/* Tab bar + Close Week / Close Month buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["week", "alltime", "history"] as const).map(t => (
            <button key={t} onClick={() => { setLbTab(t); setLbPage(1); }}
              style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: lbTab === t ? B : "#f1f5f9", color: lbTab === t ? "white" : "#64748b" }}>
              {t === "week" ? "This Week" : t === "alltime" ? "All Time" : "Past Winners"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {user?.role === "admin" && lbTab !== "history" && (
            <button onClick={() => setCloseModal(true)}
              style={{ padding: "9px 18px", borderRadius: 11, background: "#f59e0b", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🏁 Close Week
            </button>
          )}
          {user?.role === "admin" && (
            <button onClick={() => !isCurrentMonthClosed && setCloseMonthModal(true)}
              style={{ padding: "9px 18px", borderRadius: 11, background: isCurrentMonthClosed ? "#c4b5fd" : "#9333ea", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: isCurrentMonthClosed ? "not-allowed" : "pointer" }}>
              {isCurrentMonthClosed ? "🌟 Month Closed" : "🌟 Close Month"}
            </button>
          )}
        </div>
      </div>

      {/* Past Winners tab */}
      {lbTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Monthly Winners section */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🌟</span> Team Member of the Month — History
            </div>
            {(!monthlyWinners || monthlyWinners.length === 0) ? (
              <Card style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌟</div>
                <div style={{ color: "#94a3b8" }}>No monthly winners recorded yet. Close the first month to start the history.</div>
              </Card>
            ) : monthlyWinners.map((w: any, i: number) => {
              const monthLabel = new Date(w.month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
              return (
                <Card key={w.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 10, background: i === 0 ? "linear-gradient(135deg,#fdf4ff,#fae8ff)" : "white", borderColor: i === 0 ? "#e879f9" : "#e2e8f0" }}>
                  <div style={{ fontSize: 28 }}>{i === 0 ? "🌟" : "⭐"}</div>
                  <Av user={users.find((u: any) => u.id === w.winner_id)} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{w.winner_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{monthLabel}</div>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[["Points", w.total_points, "#9333ea"], ["Tasks", w.tasks_completed, "#22c55e"], ["Logs", w.logs_submitted, "#6366f1"]].map(([l, v, clr]) => (
                      <div key={String(l)} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: String(clr) }}>{v}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Weekly Winners section */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏆</span> Team Member of the Week — History
            </div>
            {(!weeklyWinners || weeklyWinners.length === 0) ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>🏆</div>
                <div style={{ color: "#94a3b8" }}>No weekly winners recorded yet. Close the first week to start the history.</div>
              </Card>
            ) : weeklyWinners.map((w: any, i: number) => (
              <Card key={w.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ fontSize: 28 }}>{i === 0 ? "🏆" : "🥈"}</div>
                <Av user={users.find((u: any) => u.id === w.winner_id)} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{w.winner_name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Week of {w.week_start} to {w.week_end}</div>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[["Points", w.total_points, "#f59e0b"], ["Tasks", w.tasks_completed, "#22c55e"], ["Logs", w.logs_submitted, "#6366f1"]].map(([l, v, clr]) => (
                    <div key={String(l)} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: String(clr) }}>{v}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rankings tab (This Week or All Time) */}
      {lbTab !== "history" && (
        <>
          {/* Current leader / last winner card */}
          {lbTab === "week" && lastWinner && (
            <Card style={{ padding: 22, background: "linear-gradient(135deg,#fffbeb,#fef9c3)", borderColor: "#fde68a", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 36 }}>🏆</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Week Winner</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{lastWinner.winner_name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{lastWinner.total_points}pts -- {lastWinner.tasks_completed} tasks -- {lastWinner.logs_submitted} logs</div>
              </div>
            </Card>
          )}
          {top && (
            <Card style={{ padding: 28, background: `linear-gradient(135deg,${B}12,#e8f4f5)`, borderColor: B + "30", marginBottom: 18, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: B, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 14 }}>
                {lbTab === "week" ? "This Week Leader" : "All-Time Leader"}
              </div>
              <Av user={users.find((u: any) => u.id === top.userId)} size={64} />
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 12 }}>{top.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{top.title}</div>
              <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 18 }}>
                {([["Points", top.score, B], ["Tasks", top.tasksCompleted, "#22c55e"], ["Logs", top.logsCount, "#6366f1"]] as const).map(([l, v, clr]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: clr as string }}>{v as number}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {!top && (
            <Card style={{ padding: 40, textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>
              <div style={{ color: "#94a3b8" }}>No approved activity this {lbTab === "week" ? "week" : "period"} yet.</div>
            </Card>
          )}
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Full Rankings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sc.slice(0, 1).concat(pagedRest).map((s: any, i: number) => {
                const idx = i === 0 ? 0 : (lbPage - 1) * LB_PER_PAGE + i;
                const u = users.find((u: any) => u.id === s.userId);
                const max = sc[0]?.score || 1;
                return (
                  <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14,
                    background: idx === 0 ? "#fffbeb" : "#fafafa", border: idx === 0 ? "1px solid #fde68a" : "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: idx < 3 ? 22 : 16, fontWeight: 700, width: 32, textAlign: "center",
                      color: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7c2f" : "#cbd5e1" }}>
                      {idx < 3 ? medals[idx] : `#${idx + 1}`}
                    </div>
                    <Av user={u} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 6, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(s.score / max) * 100}%`, background: idx === 0 ? "#f59e0b" : B, borderRadius: 6 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                        {s.score}<span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>pt</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{s.tasksCompleted} done {" | "} {s.logsCount} logs</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {lbTotalPages > 1 && (
              <Pagination page={lbPage} total={lbTotalPages} onChange={setLbPage} />
            )}
          </Card>
        </>
      )}

      {/* Close Week confirmation modal */}
      {closeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ padding: 32, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Close Week</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              This will save the current weekly scores permanently and record {weeklySc[0]?.name || "the top scorer"} as Team Member of the Week for {weekStart} to {weekEnd}.
            </div>
            {weeklySc.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {weeklySc.map((s: any, i: number) => (
                  <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
                    background: i === 0 ? "#fffbeb" : "#f8fafc", border: i === 0 ? "1px solid #fde68a" : "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{i === 0 ? "🏆" : `#${i + 1}`}</span>
                    <Av user={users.find((u: any) => u.id === s.userId)} size={30} />
                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 400, flex: 1, color: "#0f172a" }}>{s.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "#f59e0b" : "#64748b" }}>{s.score}pt</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "14px", background: "#fef2f2", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
                No approved activity this week yet. Close anyway?
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCloseWeek} disabled={closing}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#f59e0b", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: closing ? "not-allowed" : "pointer", opacity: closing ? 0.7 : 1 }}>
                {closing ? "Saving..." : "Confirm Close Week"}
              </button>
              <button onClick={() => setCloseModal(false)}
                style={{ padding: "12px 20px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Close Month confirmation modal */}
      {closeMonthModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ padding: 32, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>🌟 Close Month</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              This will record {monthlySc[0]?.name || "the top scorer"} as Team Member of the Month for{" "}
              {new Date(thisMonth + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })} and notify the whole team.
            </div>
            {monthlySc.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {monthlySc.map((s: any, i: number) => (
                  <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
                    background: i === 0 ? "linear-gradient(135deg,#fdf4ff,#fae8ff)" : "#f8fafc",
                    border: i === 0 ? "1px solid #e879f9" : "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{i === 0 ? "🌟" : `#${i + 1}`}</span>
                    <Av user={users.find((u: any) => u.id === s.userId)} size={30} />
                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 400, flex: 1, color: "#0f172a" }}>{s.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "#9333ea" : "#64748b" }}>{s.score}pt</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "14px", background: "#fef2f2", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
                No approved activity this month yet. Close anyway?
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCloseMonth} disabled={closingMonth}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#9333ea", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: closingMonth ? "not-allowed" : "pointer", opacity: closingMonth ? 0.7 : 1 }}>
                {closingMonth ? "Saving..." : "Confirm Close Month"}
              </button>
              <button onClick={() => setCloseMonthModal(false)}
                style={{ padding: "12px 20px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// APPROVAL PAGE -- Admin only
// -------------------------------------------------------------------
function ApprovalPage({ user, tasks, logs, users, onApproveTask, onRejectTask, onApproveLog, onRejectLog, onMarkTaskAsArticle }: any) {
  const [tab,         setTab]         = useState<"tasks" | "logs">("tasks");
  const [selected,    setSelected]    = useState<any>(null);
  const [selectedType,setSelectedType]= useState<"task" | "log">("task");
  const [rejectMode,  setRejectMode]  = useState(false);
  const [rejectNote,  setRejectNote]  = useState("");
  const [saving,      setSaving]      = useState(false);

  const approvableIds: Set<string> = (() => {
    if (user.role === "admin") {
      return new Set(users.filter((u: any) => u.role !== "admin").map((u: any) => u.id));
    }
    if (user.role === "leader") {
      return new Set(
        users
          .filter((u: any) => u.managed_by === user.id && u.role !== "admin")
          .map((u: any) => u.id)
      );
    }
    return new Set();
  })();

  const expandedForApprovals = expandTasksPerAssignee(tasks.map(normTask));
  const pendingTasks = expandedForApprovals.filter((t: any) =>
    t.approvalStatus === "needs-review" &&
    t._singleAssignee && approvableIds.has(t._singleAssignee)
  );
  const pendingLogs = logs.map(normLog).filter((l: any) =>
    l.approvalStatus === "needs-review" && approvableIds.has(l.userId)
  );

  function openDetail(item: any, type: "task" | "log") {
    setSelected(item);
    setSelectedType(type);
    setRejectMode(false);
    setRejectNote("");
  }

  function closeDetail() {
    setSelected(null);
    setRejectMode(false);
    setRejectNote("");
  }

  async function handleApprove() {
    if (!selected) return;
    setSaving(true);
    if (selectedType === "task") await onApproveTask?.(selected.id, selected._singleAssignee ?? null);
    else await onApproveLog?.(selected.id);
    setSaving(false);
    closeDetail();
  }

  async function handleReject() {
    if (!selected || !rejectNote.trim()) return;
    setSaving(true);
    if (selectedType === "task") await onRejectTask?.(selected.id, rejectNote.trim(), selected._singleAssignee ?? null);
    else await onRejectLog?.(selected.id, rejectNote.trim());
    setSaving(false);
    closeDetail();
  }

  async function handleToggleArticle() {
    if (selectedType !== "task" || !selected) return;
    const nextValue = !selected.is_article;
    await onMarkTaskAsArticle?.(selected.id, nextValue);
    setSelected((prev: any) => prev ? { ...prev, is_article: nextValue } : prev);
  }

  return (
    <div style={{ padding: "20px 20px" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("tasks")}
          style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: tab === "tasks" ? B : "#f1f5f9", color: tab === "tasks" ? "white" : "#64748b" }}>
          Tasks ({pendingTasks.length})
        </button>
        <button onClick={() => setTab("logs")}
          style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: tab === "logs" ? B : "#f1f5f9", color: tab === "logs" ? "white" : "#64748b" }}>
          Activity Logs ({pendingLogs.length})
        </button>
      </div>

      {/* Pending Tasks - clickable summary cards */}
      {tab === "tasks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendingTasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
              No tasks pending approval
            </div>
          ) : pendingTasks.map((task: any) => {
            const taskAssignees = task.assignees
              .map((uid: string) => normUser(users.find((u: any) => u.id === uid)))
              .filter(Boolean);
            return (
              <div key={task._expandedId} onClick={() => openDetail(task, "task")}
                style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 16px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{task.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {taskAssignees.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {taskAssignees.slice(0, 3).map((a: any) => <Av key={a.id} user={a} size={20} />)}
                      {taskAssignees.length === 1
                        ? <span style={{ fontSize: 12, color: "#64748b" }}>{taskAssignees[0].name}</span>
                        : taskAssignees.length > 3
                          ? <span style={{ fontSize: 11, color: "#94a3b8" }}>+{taskAssignees.length - 3}</span>
                          : null}
                    </div>
                  )}
                  <Pill type="priority" value={task.priority} />
                  {task.project && <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {task.project}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginTop: 8 }}>Tap to review</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Logs - clickable summary cards */}
      {tab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendingLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
              No activity logs pending approval
            </div>
          ) : pendingLogs.map((log: any) => {
            const logUser = normUser(users.find((u: any) => u.id === log.userId));
            return (
              <div key={log.id} onClick={() => openDetail(log, "log")}
                style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 16px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{log.taskTitle}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {logUser && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Av user={logUser} size={20} />
                      <span style={{ fontSize: 12, color: "#64748b" }}>{logUser.name}</span>
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{log.date}</span>
                  {log.project && <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {log.project}</span>}
                </div>
                {log.description && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {log.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginTop: 8 }}>Tap to review</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal - opens when a card is tapped */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) closeDetail(); }}>
          <div style={{
            background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560,
            maxHeight: "85vh", overflowY: "auto", padding: "24px 24px 36px",
            animation: "slideUp 0.22s ease",
          }}>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 20px" }} />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", flex: 1, paddingRight: 12, lineHeight: 1.4 }}>
                {selectedType === "task" ? selected.title : selected.taskTitle}
              </div>
              <button onClick={closeDetail} style={{ background: "#f1f5f9", border: "none", borderRadius: 9, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#64748b", flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Task detail fields */}
            {selectedType === "task" && (() => {
              const selAssignees = selected.assignees
                .map((uid: string) => normUser(users.find((u: any) => u.id === uid)))
                .filter(Boolean);
              return (
                <>
                  {selAssignees.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                      {selAssignees.map((a: any) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Av user={a} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    <Pill type="priority" value={selected.priority} />
                    <Pill type="status" value={selected.status} />
                    {selected.project && <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {selected.project}</span>}
                    {selected.deadline && <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {selected.deadline}</span>}
                  </div>
                  {selected.description && (
                    <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {selected.description}
                    </div>
                  )}
                  {selected.links && selected.links.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Reference Links</div>
                      <LinkDisplay links={selected.links} />
                    </div>
                  )}
                  {selected.submission_links && selected.submission_links.length > 0 && (
                    <div style={{ marginBottom: 16, padding: "14px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Submitted Work</div>
                      <LinkDisplay links={selected.submission_links} />
                    </div>
                  )}
                </>
              );
            })()}

            {/* Log detail fields */}
            {selectedType === "log" && (() => {
              const logUser = normUser(users.find((u: any) => u.id === selected.userId));
              return (
                <>
                  {logUser && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Av user={logUser} size={28} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{logUser.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{selected.date}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                    {selected.project && <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {selected.project}</span>}
                    {selected.timeSpent > 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {selected.timeSpent}h</span>}
                    {selected.completion_status && (
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: selected.completion_status === "completed" ? "#f0fdf4" : selected.completion_status === "blocked" ? "#fef2f2" : "#eff6ff",
                        color: selected.completion_status === "completed" ? "#22c55e" : selected.completion_status === "blocked" ? "#ef4444" : "#3b82f6" }}>
                        {selected.completion_status === "completed" ? "Completed" : selected.completion_status === "blocked" ? "Blocked" : "In Progress"}
                      </span>
                    )}
                  </div>
                  {selected.description && (
                    <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {selected.description}
                    </div>
                  )}
                  {selected.links && selected.links.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Attached Links</div>
                      <LinkDisplay links={selected.links} />
                    </div>
                  )}
                </>
              );
            })()}

            {/* Count as Article toggle (tasks only, admin only) */}
            {selectedType === "task" && user.role === "admin" && selected.status === "completed" && (
              <button
                type="button"
                onClick={handleToggleArticle}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 18px",
                  background: selected.is_article ? B + "10" : "#f8fafc",
                  borderRadius: 14,
                  border: `1px solid ${selected.is_article ? B + "35" : "#e2e8f0"}`,
                  marginBottom: 16,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📰 Count as Article</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Marks this task for per-article pay calculation
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selected.is_article ? B : "#64748b",
                    background: selected.is_article ? B + "14" : "#e2e8f0",
                    padding: "5px 9px",
                    borderRadius: 999,
                  }}>
                    {selected.is_article ? "On" : "Off"}
                  </span>
                  <span style={{
                    position: "relative",
                    width: 58,
                    height: 34,
                    borderRadius: 999,
                    background: selected.is_article ? B : "#cbd5e1",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      position: "absolute",
                      top: 3,
                      left: selected.is_article ? 27 : 3,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </span>
                </div>
              </button>
            )}

            {/* Reject reason input - shown when reject is tapped */}
            {rejectMode && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Reason for rejection</div>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Submission link missing, task not fully completed..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                />
              </div>
            )}

            {/* Action buttons */}
            {!rejectMode ? (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={handleApprove} disabled={saving}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#22c55e", border: "none", color: "white", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => setRejectMode(true)}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#fee2e2", border: "none", color: "#dc2626", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Reject
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={handleReject} disabled={saving || !rejectNote.trim()}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#dc2626", border: "none", color: "white", fontWeight: 700, fontSize: 15,
                    cursor: saving || !rejectNote.trim() ? "not-allowed" : "pointer", opacity: !rejectNote.trim() ? 0.5 : 1 }}>
                  {saving ? "Rejecting..." : "Confirm Reject"}
                </button>
                <button onClick={() => { setRejectMode(false); setRejectNote(""); }}
                  style={{ padding: "14px 18px", borderRadius: 12, background: "#f1f5f9", border: "none", color: "#374151", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsPage({ tasks, logs, users, user }: any) {
  const sc      = useMemo(() => computeScores(tasks, logs, users), [tasks, logs, users]);
  const members = user
    ? user.role === "leader"
      ? users.filter((u: any) => isStaff(u) && (u.id === user.id || u.managed_by === user.id))
      : users.filter((u: any) => isStaff(u))
    : users.filter((u: any) => isStaff(u));
  const normT   = expandTasksPerAssignee(tasks.map(normTask));
  const normL   = logs.map(normLog);

  const byMember = members.map((u: any) => {
    const nu = normUser(u);
    return {
      name:      nu.name.split(" ")[0],
      completed: normT.filter((t: any) => t.assignees.includes(u.id) && t.status === "completed").length,
      total:     normT.filter((t: any) => t.assignees.includes(u.id)).length,
    };
  });

  // Calculate real weekly trend from task completions over last 6 weeks
  const trend = useMemo(() => {
    const weeks = [];
    for (let w = 5; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (w * 7) - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const ws = fmt(weekStart);
      const we = fmt(weekEnd);
      const completedInWeek = normT.filter((t: any) =>
        t.status === "completed" && t.completedAt &&
        t.completedAt.slice(0, 10) >= ws && t.completedAt.slice(0, 10) <= we
      ).length;
      const logsInWeek = normL.filter((l: any) => l.date >= ws && l.date <= we).length;
      weeks.push({ week: `W${6 - w}`, score: completedInWeek * 10 + logsInWeek * 2 });
    }
    return weeks;
  }, [normT, normL]);

  const compl  = normT.filter((t: any) => t.status === "completed").length;
  const totHrs = normL.reduce((s: number, l: any) => s + (l.timeSpent || 0), 0);

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Stat icon="📈" label="Total Points"    value={sc.reduce((s: number, u: any) => s + u.score, 0)} color={B} />
        <Stat icon="✅" label="Completion Rate" value={`${tasks.length ? Math.round(compl / tasks.length * 100) : 0}%`} color="#22c55e" />
        <Stat icon="📝" label="Activity Entries" value={logs.length} color="#6366f1" />
        <Stat icon="⏱" label="Hours Logged"     value={`${totHrs.toFixed(1)}h`} color="#f59e0b" />
      </div>

      <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Tasks Completed per Member</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={byMember} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="completed" name="Completed" fill={B} radius={[6, 6, 0, 0]} />
              <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Productivity Trend</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="score" stroke={B} strokeWidth={3} dot={{ fill: B, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Weekly Report Summary</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
              {["Team Member", "Role", "Tasks Done", "Logs", "Score", "Rank"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sc.map((s: any, i: number) => {
              const u = users.find((u: any) => u.id === s.userId);
              return (
                <tr key={s.userId} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Av user={u} size={26} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>{s.title}</td>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{s.tasksCompleted}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>{s.logsCount}</td>
                  <td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: B }}>{s.score}pt</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2f" : "#94a3b8" }}>
                      {["🥇 #1", "🥈 #2", "🥉 #3"][i] || `#${i + 1}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// --- Birthday Banner ----------------------------------------------------------
function BirthdayBanner({ users }: { users: any[] }) {
  const [dismissed, setDismissed] = useState(false);
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const celebrants = users.filter((u: any) => {
    if (!u.date_of_birth) return false;
    const dob = u.date_of_birth; // "YYYY-MM-DD"
    return dob.slice(5) === `${mm}-${dd}`;
  });
  if (celebrants.length === 0 || dismissed) return null;
  return (
    <div style={{ background: "linear-gradient(135deg,#fdf4ff,#fce7f3)", border: "1px solid #f0abfc", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>🎂</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#7e22ce", marginBottom: 2 }}>
          {celebrants.length === 1
            ? `Today is ${normUser(celebrants[0])?.name}'s birthday!`
            : `Today is ${celebrants.map((u: any) => normUser(u)?.name).join(" & ")}'s birthday!`}
        </div>
        <div style={{ fontSize: 12, color: "#a855f7" }}>
          Send them a message or wish them happy birthday in person! 🥳
        </div>
      </div>
      <button onClick={() => setDismissed(true)}
        style={{ background: "#f3e8ff", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#7e22ce", fontSize: 16, fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ✕
      </button>
    </div>
  );
}

// --- Payroll ------------------------------------------------------------------
function PayrollBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: "#fef9c3", color: "#854d0e", label: "Pending"   },
    approved:  { bg: "#dcfce7", color: "#166534", label: "Approved"  },
    withheld:  { bg: "#fee2e2", color: "#991b1b", label: "Withheld"  },
    unpaid:    { bg: "#f1f5f9", color: "#475569", label: "Unpaid"    },
    paid:      { bg: "#dcfce7", color: "#166534", label: "Paid"      },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
}

function payrollTypeLabel(member: any, payType?: string | null) {
  const base = payType === "per_article" ? "Per Article" : "Monthly Salary";
  return member?.earns_commission ? `${base} + Commission` : base;
}

function getApprovedArticleCount(tasks: any[], memberId: string, month: string) {
  return expandTasksPerAssignee(tasks.map(normTask)).filter((t: any) =>
    t._singleAssignee === memberId &&
    t.is_article === true &&
    t.approvalStatus === "approved" &&
    (t.completedAt || "").slice(0, 7) === month
  ).length;
}

function LogPayrollModal({ user, users, tasks, onClose, onSubmit }: any) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [memberId, setMemberId] = useState(user.role === "admin" ? "" : user.id);
  const [month,    setMonth]    = useState(thisMonth);
  const [adjustment,     setAdjustment]     = useState("0");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  const payableMembers = user.role === "admin"
    ? users.filter((u: any) => u.role !== "admin")
    : [];

  const selectedMember = users.find((u: any) => u.id === (memberId || user.id));
  const currency    = getCurrencyForCountry(selectedMember?.country || "");
  const payType     = selectedMember?.pay_type || "monthly";
  const monthlyRate = parseFloat(selectedMember?.monthly_rate) || 0;
  const articleRate = parseFloat(selectedMember?.article_rate) || 0;

  // For per_article: count approved article tasks in the selected month
  const articleCount = useMemo(() => {
    if (payType !== "per_article" || !selectedMember) return 0;
    return getApprovedArticleCount(tasks, selectedMember.id, month);
  }, [tasks, selectedMember, month, payType]);

  const adj         = parseFloat(adjustment) || 0;
  const baseAmount  = payType === "per_article" ? articleCount * articleRate : monthlyRate;
  const finalAmount = baseAmount + adj;

  async function submit() {
    const mid = memberId || user.id;
    if (!mid || !month) { setErr("Please select a member and month."); return; }
    if (payType === "monthly" && monthlyRate <= 0 && adj === 0) {
      setErr("This member has no monthly rate set. Add a reward/deduction in Adjustment, or set a monthly rate first.");
      return;
    }
    setSaving(true); setErr("");
    try {
      await onSubmit({
        member_id:       mid,
        month,
        pay_type:        payType,
        base_amount:     baseAmount,
        adjustment:      adj,
        adjustment_note: adjustmentNote || null,
        article_count:   payType === "per_article" ? articleCount : null,
        currency_code:   currency.code,
        currency_symbol: currency.symbol,
        notes:           notes || null,
      });
      onClose();
    } catch (e: any) { setErr(e.message || "Failed to log payroll."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Log Payroll Entry</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Member selector */}
          {user.role === "admin" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Team Member *</label>
              <select value={memberId} onChange={e => setMemberId(e.target.value)} style={{ ...SEL, width: "100%" }}>
                <option value="">Select member...</option>
                {payableMembers.map((u: any) => (
                  <option key={u.id} value={u.id}>{normUser(u)?.name} - {payrollTypeLabel(u, u.pay_type)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Month *</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>

          {/* Pay summary card */}
          {selectedMember && (
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                Pay Type: <span style={{ color: B }}>{payrollTypeLabel(selectedMember, payType)}</span>
              </div>

              {payType === "monthly" && (
                <div style={{ fontSize: 14, color: "#374151" }}>
                  {monthlyRate > 0
                    ? <>Monthly rate: <strong>{fmtMoney(monthlyRate, currency.symbol)}</strong></>
                    : <span style={{ color: adj !== 0 ? "#166534" : "#ef4444" }}>
                        {adj !== 0
                          ? "Bonus-only / adjustment-only payment will be logged with base pay set to 0."
                          : "⚠️ No monthly rate set - go to Team → member profile to set it, or enter a reward in Adjustment."}
                      </span>
                  }
                </div>
              )}

              {payType === "per_article" && (
                <>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                    Approved articles this month: <strong>{articleCount}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                    Rate per article: <strong>{fmtMoney(articleRate, currency.symbol)}</strong>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: B, marginTop: 8 }}>
                    Base Pay: {fmtMoney(baseAmount, currency.symbol)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Adjustment */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
              Adjustment <span style={{ fontWeight: 400, color: "#94a3b8" }}>({currency.code}) - optional</span>
            </label>
            <input type="number" placeholder="e.g. -5000 for deduction, +10000 for bonus"
              value={adjustment} onChange={e => setAdjustment(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>

          {adj !== 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Adjustment Note</label>
              <input type="text" placeholder="e.g. Deduction for 2 days lateness"
                value={adjustmentNote} onChange={e => setAdjustmentNote(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>
          )}

          {/* Final amount preview */}
          {selectedMember && (baseAmount > 0 || adj !== 0) && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#166534" }}>
              Final Amount: {fmtMoney(finalAmount, currency.symbol)}
              {adj !== 0 && <span style={{ fontSize: 12, fontWeight: 400, color: "#4ade80", marginLeft: 8 }}>({fmtMoney(baseAmount, currency.symbol)} {adj > 0 ? "+" : ""}{fmtMoney(adj, currency.symbol)})</span>}
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes (optional)</label>
            <textarea placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          </div>

          {err && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>{err}</div>}

          <button onClick={submit} disabled={saving}
            style={{ padding: "13px", borderRadius: 12, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Logging..." : "Log Payroll Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollDetailModal({ entry, users, user, onClose, onApprove, onWithhold, onAdjust, onMarkPaid, onMarkUnpaid }: any) {
  const member = users.find((u: any) => u.id === entry.member_id);
  const mn = normUser(member);
  const [adjMode, setAdjMode] = useState(false);
  const [adjVal, setAdjVal] = useState(String(entry.adjustment || "0"));
  const [adjNote, setAdjNote] = useState(entry.adjustment_note || "");
  const [saving, setSaving] = useState(false);
  const isAdmin = user.role === "admin";
  const baseAmount = parseFloat(entry.base_amount) || 0;
  const adjustment = parseFloat(entry.adjustment) || 0;
  const finalAmount = entry.final_amount ?? (baseAmount + adjustment);
  const monthLabel = entry.month ? new Date(entry.month + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : entry.month;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Payroll Detail</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
        </div>

        {mn && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "14px 16px", background: "#f8fafc", borderRadius: 12 }}>
            <Av user={member} size={40} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{mn.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{mn.title} · {payrollTypeLabel(member, entry.pay_type)}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[
            ["Month", monthLabel],
            entry.pay_type === "per_article" && ["Articles Counted", `${entry.article_count || 0} articles`],
            ["Base Pay", fmtMoney(baseAmount, entry.currency_symbol)],
            ["Payment Made", `${adjustment >= 0 ? "+" : ""}${fmtMoney(adjustment, entry.currency_symbol)}`],
            (entry.notes || entry.adjustment_note) && ["Reason for Payment", entry.notes || entry.adjustment_note],
          ].filter(Boolean).map(([label, value]: any) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</span>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: B, borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4 }}>
            <span>Final Amount</span>
            <span>{fmtMoney(finalAmount, entry.currency_symbol)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <PayrollBadge status={entry.status} />
          {entry.status === "approved" && <PayrollBadge status={entry.payout_status} />}
        </div>

        {isAdmin && !adjMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entry.status === "pending" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={async () => { setSaving(true); await onApprove(entry.id); setSaving(false); onClose(); }}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#22c55e", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Approve
                </button>
                <button onClick={async () => { setSaving(true); await onWithhold(entry.id); setSaving(false); onClose(); }}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#fee2e2", border: "none", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Withhold
                </button>
              </div>
            )}
            {entry.status === "approved" && entry.payout_status === "unpaid" && (
              <button onClick={async () => { setSaving(true); await onMarkPaid(entry.id); setSaving(false); onClose(); }}
                style={{ padding: "12px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Mark as Paid
              </button>
            )}
            {entry.status === "approved" && entry.payout_status === "paid" && (
              <button onClick={async () => { setSaving(true); await onMarkUnpaid(entry.id); setSaving(false); onClose(); }}
                style={{ padding: "12px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Mark as Unpaid
              </button>
            )}
            <button onClick={() => setAdjMode(true)}
              style={{ padding: "10px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Edit Adjustment
            </button>
          </div>
        )}

        {isAdmin && adjMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Adjustment ({entry.currency_symbol})</label>
              <input type="number" value={adjVal} onChange={e => setAdjVal(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Note</label>
              <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                placeholder="Reason for adjustment..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async () => { setSaving(true); await onAdjust(entry.id, parseFloat(adjVal) || 0, adjNote); setSaving(false); setAdjMode(false); onClose(); }}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Save
              </button>
              <button onClick={() => setAdjMode(false)}
                style={{ padding: "12px 18px", borderRadius: 10, background: "#f1f5f9", border: "none", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PayrollPage({ user, users, tasks, payroll, onLogPayroll, onApprovePayroll, onWithholdPayroll, onAdjustPayroll, onMarkPayrollPaid, onMarkPayrollUnpaid }: any) {
  const [logOpen, setLogOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayout, setFilterPayout] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [payPage, setPayPage] = useState(1);
  const PAY_PER_PAGE = 10;

  const isAdmin = user.role === "admin";

  const visible = useMemo(() => {
    let list = isAdmin ? payroll : payroll.filter((e: any) => e.member_id === user.id);
    if (filterStatus !== "all") list = list.filter((e: any) => e.status === filterStatus);
    if (filterPayout !== "all") list = list.filter((e: any) => e.payout_status === filterPayout);
    if (filterMember !== "all") list = list.filter((e: any) => e.member_id === filterMember);
    if (filterMonth) list = list.filter((e: any) => e.month === filterMonth);
    return list;
  }, [payroll, user, isAdmin, filterStatus, filterPayout, filterMember, filterMonth]);

  const payTotalPages = Math.ceil(visible.length / PAY_PER_PAGE);
  const pagedPayroll = visible.slice((payPage - 1) * PAY_PER_PAGE, payPage * PAY_PER_PAGE);

  const totalApproved = useMemo(() => {
    const base = isAdmin ? payroll : payroll.filter((e: any) => e.member_id === user.id);
    return base.filter((e: any) => e.status === "approved" && e.payout_status === "unpaid")
      .reduce((sum: number, e: any) => sum + parseFloat(e.final_amount ?? (parseFloat(e.base_amount) + parseFloat(e.adjustment || "0"))), 0);
  }, [payroll, user, isAdmin]);

  const staffMembers = users.filter((u: any) => u.role !== "admin");

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>💳 Payroll</div>
        {isAdmin && (
          <button onClick={() => setLogOpen(true)}
            style={{ padding: "10px 18px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            + Log Payroll Entry
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <Stat icon="⏳" label="Pending" value={payroll.filter((e: any) => (isAdmin || e.member_id === user.id) && e.status === "pending").length} color="#f59e0b" />
        <Stat icon="✅" label="Approved" value={payroll.filter((e: any) => (isAdmin || e.member_id === user.id) && e.status === "approved").length} color="#22c55e" />
        <Stat icon="🚫" label="Withheld" value={payroll.filter((e: any) => (isAdmin || e.member_id === user.id) && e.status === "withheld").length} color="#ef4444" />
        <Stat icon="💰" label="Unpaid (Approved)" value={payroll.filter((e: any) => (isAdmin || e.member_id === user.id) && e.status === "approved" && e.payout_status === "unpaid").length} color={B} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPayPage(1); }} style={SEL}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="withheld">Withheld</option>
        </select>
        <select value={filterPayout} onChange={e => { setFilterPayout(e.target.value); setPayPage(1); }} style={SEL}>
          <option value="all">All Payout</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        {isAdmin && (
          <select value={filterMember} onChange={e => { setFilterMember(e.target.value); setPayPage(1); }} style={SEL}>
            <option value="all">All Members</option>
            {staffMembers.map((u: any) => <option key={u.id} value={u.id}>{normUser(u)?.name}</option>)}
          </select>
        )}
        <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPayPage(1); }}
          style={{ ...SEL, fontSize: 14 }} />
        {filterMonth && <button onClick={() => setFilterMonth("")} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto" }}>{visible.length} entries</span>
      </div>

      {/* Table */}
      <Card>
        {visible.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>No payroll entries found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {isAdmin && <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Member</th>}
                  {["Month", "Type", "Amount", "Adjustment", "Final", "Status", "Payout"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedPayroll.map((entry: any, i: number) => {
                  const m = users.find((u: any) => u.id === entry.member_id);
                  const adj = parseFloat(entry.adjustment) || 0;
                  const finalAmt = entry.final_amount ?? (parseFloat(entry.base_amount) + adj);
                  return (
                    <tr key={entry.id} onClick={() => setDetail(entry)}
                      style={{ borderBottom: i < pagedPayroll.length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                      {isAdmin && <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{normUser(m)?.name || "-"}</td>}
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#0f172a", whiteSpace: "nowrap" }}>
                        {new Date(entry.month + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {entry.pay_type === "per_article"
                          ? `${payrollTypeLabel(m, entry.pay_type)} (${entry.article_count || 0})`
                          : payrollTypeLabel(m, entry.pay_type)}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                        {entry.pay_type === "per_article" ? fmtMoney(parseFloat(entry.base_amount) || 0, entry.currency_symbol) : "-"}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: adj >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {adj !== 0 ? `${adj >= 0 ? "+" : ""}${fmtMoney(adj, entry.currency_symbol)}` : "-"}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 800, color: B, whiteSpace: "nowrap" }}>{fmtMoney(finalAmt, entry.currency_symbol)}</td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}><PayrollBadge status={entry.status} /></td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        {entry.status === "approved" ? <PayrollBadge status={entry.payout_status} /> : <span style={{ color: "#cbd5e1", fontSize: 12 }}>-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "0 16px 8px" }}>
              <Pagination page={payPage} total={payTotalPages} onChange={setPayPage} />
            </div>
          </div>
        )}
      </Card>

      {logOpen && <LogPayrollModal user={user} users={users} tasks={tasks} onClose={() => setLogOpen(false)} onSubmit={onLogPayroll} />}
      {detail && (
        <PayrollDetailModal entry={detail} users={users} user={user} onClose={() => setDetail(null)}
          onApprove={onApprovePayroll} onWithhold={onWithholdPayroll}
          onAdjust={onAdjustPayroll} onMarkPaid={onMarkPayrollPaid} onMarkUnpaid={onMarkPayrollUnpaid}
        />
      )}
    </div>
  );
}

function OutgoingModal({ currency, onClose, onSubmit }: any) {
  const [form, setForm] = useState({
    description: "", amount: "", category: "", notes: "",
    currency_code: currency.code, currency_symbol: currency.symbol,
    payment_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.description || !form.amount || !form.payment_date) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Log Offline Outgoing</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Description *</label>
            <input type="text" placeholder="e.g. Office supplies, Software subscription"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Category</label>
            <input type="text" placeholder="e.g. Operations, Tools, Marketing"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Amount *</label>
            <input type="number" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Currency</label>
            <select value={form.currency_code}
              onChange={e => {
                const c = CURRENCIES.find(c => c.code === e.target.value);
                setForm(f => ({ ...f, currency_code: e.target.value, currency_symbol: c?.symbol || "" }));
              }}
              style={{ ...SEL, width: "100%" }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.country}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Date *</label>
            <input type="date" value={form.payment_date}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes (optional)</label>
            <textarea placeholder="Any additional notes..." value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <button onClick={submit} disabled={saving || !form.description || !form.amount || !form.payment_date}
            style={{ padding: "13px", borderRadius: 12, background: "#ef4444", border: "none", color: "white", fontWeight: 700, fontSize: 15,
              cursor: saving || !form.description || !form.amount ? "not-allowed" : "pointer",
              opacity: !form.description || !form.amount ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Log Outgoing Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Finance Dashboard --------------------------------------------------------
function FinancePage({ user, users, sales, payroll, offlineIncome, offlineOutgoing, onLogOfflineIncome, onDeleteOfflineIncome, onLogOfflineOutgoing, onDeleteOfflineOutgoing }: any) {
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedQuarter, setSelectedQuarter] = useState(`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [outgoingOpen, setOutgoingOpen] = useState(false);
  const [incPage, setIncPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const FIN_PER_PAGE = 10;

  const currency = getCurrencyForCountry(user.country || "Nigeria");

  // Filter helpers
  function inPeriod(dateStr: string) {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (period === "monthly") return d.slice(0, 7) === selectedMonth;
    if (period === "yearly")  return d.slice(0, 4) === selectedYear;
    if (period === "quarterly") {
      const [yr, q] = selectedQuarter.split("-Q");
      const qMonth = (parseInt(q) - 1) * 3;
      const dDate = new Date(d);
      return dDate.getFullYear() === parseInt(yr) && Math.floor(dDate.getMonth() / 3) === parseInt(q) - 1;
    }
    return false;
  }

  // Income: commission payouts IN (confirmed sales) + offline income
  const commissionIncome = sales.filter((s: any) => s.status === "confirmed" && inPeriod(s.sale_date));
  const offlineFiltered  = offlineIncome.filter((e: any) => inPeriod(e.income_date));
  const totalCommIncome  = commissionIncome.reduce((sum: number, s: any) => sum + parseFloat(s.sale_amount), 0);
  const totalOfflineIncome = offlineFiltered.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
  const totalIncome = totalCommIncome + totalOfflineIncome;

  // Outgoings: commission payouts + payroll payouts
  const commPaid   = sales.filter((s: any) => s.payout_status === "paid" && inPeriod(s.sale_date));
  const payrollPaid = payroll.filter((e: any) => e.payout_status === "paid" && inPeriod(e.month + "-01"));
  const totalCommOut   = commPaid.reduce((sum: number, s: any) => sum + parseFloat(s.commission_amount), 0);
  const totalPayrollOut = payrollPaid.reduce((sum: number, e: any) => {
    const adj = parseFloat(e.adjustment) || 0;
    const final = e.final_amount ?? (parseFloat(e.base_amount) + adj);
    return sum + (e.pay_type === "monthly" ? adj : parseFloat(final));
  }, 0);
  const offlineOutFiltered = (offlineOutgoing || []).filter((e: any) => inPeriod(e.payment_date));
  const totalOfflineOut = offlineOutFiltered.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
  const totalOut = totalCommOut + totalPayrollOut + totalOfflineOut;
  const netBalance = totalIncome - totalOut;

  // All outgoings merged for table
  const allOutgoings = [
    ...commPaid.map((s: any) => ({
      id: s.id, date: s.sale_date, description: `Commission - ${s.client_name}`,
      amount: parseFloat(s.commission_amount), symbol: s.currency_symbol, type: "Commission",
    })),
    ...payrollPaid.map((e: any) => {
      const adj = parseFloat(e.adjustment) || 0;
      const final = e.final_amount ?? (parseFloat(e.base_amount) + adj);
      const m = users.find((u: any) => u.id === e.member_id);
      return {
        id: e.id, date: e.month + "-01", description: `Payroll - ${normUser(m)?.name || ""}`,
        amount: e.pay_type === "monthly" ? adj : parseFloat(final), symbol: e.currency_symbol, type: e.pay_type === "per_article" ? "Per-Article Pay" : "Monthly Pay",
      };
    }),
    ...offlineOutFiltered.map((e: any) => ({
      id: e.id, date: e.payment_date, description: e.description,
      amount: parseFloat(e.amount), symbol: e.currency_symbol, type: e.category || "Offline Payment",
      deletable: true,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const allIncome = [
    ...commissionIncome.map((s: any) => ({
      id: s.id, date: s.sale_date, description: `Sale - ${s.client_name} (${s.product_service})`,
      amount: parseFloat(s.sale_amount), symbol: s.currency_symbol, type: "Commission Sale",
    })),
    ...offlineFiltered.map((e: any) => ({
      id: e.id, date: e.income_date, description: e.description,
      amount: parseFloat(e.amount), symbol: e.currency_symbol, type: e.category || "Offline Income",
      deletable: true,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const incTotalPages = Math.ceil(allIncome.length / FIN_PER_PAGE);
  const outTotalPages = Math.ceil(allOutgoings.length / FIN_PER_PAGE);
  const pagedIncome   = allIncome.slice((incPage - 1) * FIN_PER_PAGE, incPage * FIN_PER_PAGE);
  const pagedOutgoing = allOutgoings.slice((outPage - 1) * FIN_PER_PAGE, outPage * FIN_PER_PAGE);

  const years = Array.from(new Set([
    ...sales.map((s: any) => s.sale_date?.slice(0, 4)),
    ...offlineIncome.map((e: any) => e.income_date?.slice(0, 4)),
    String(new Date().getFullYear()),
  ])).filter(Boolean).sort().reverse();

  const quarters = ["Q1", "Q2", "Q3", "Q4"].map(q => `${selectedYear}-${q}`);

  // Log income modal
  const [incForm, setIncForm] = useState({ description: "", amount: "", currency_code: currency.code, currency_symbol: currency.symbol, income_date: new Date().toISOString().slice(0, 10), category: "", notes: "" });
  const [incSaving, setIncSaving] = useState(false);

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>📈 Finance Dashboard</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setOutgoingOpen(true)}
            style={{ padding: "10px 18px", borderRadius: 10, background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            + Log Outgoing
          </button>
          <button onClick={() => setIncomeOpen(true)}
            style={{ padding: "10px 18px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            + Log Income
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["monthly", "quarterly", "yearly"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: period === p ? B : "#f1f5f9", color: period === p ? "white" : "#64748b" }}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <div style={{ display: "flex", gap: 8, marginLeft: 8, flexWrap: "wrap" }}>
          {period === "monthly" && (
            <input type="month" value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setIncPage(1); setOutPage(1); }}
              style={{ ...SEL, fontSize: 14 }} />
          )}
          {period === "quarterly" && (
            <>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={SEL}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedQuarter} onChange={e => { setSelectedQuarter(e.target.value); setIncPage(1); setOutPage(1); }} style={SEL}>
                {quarters.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </>
          )}
          {period === "yearly" && (
            <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setIncPage(1); setOutPage(1); }} style={SEL}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <Card style={{ padding: 24, flex: 1, minWidth: 160, borderLeft: "4px solid #22c55e" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Total Income</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#22c55e" }}>{fmtMoney(totalIncome, currency.symbol)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Sales + Offline</div>
        </Card>
        <Card style={{ padding: 24, flex: 1, minWidth: 160, borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Total Outgoings</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ef4444" }}>{fmtMoney(totalOut, currency.symbol)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Commission + Payroll paid</div>
        </Card>
        <Card style={{ padding: 24, flex: 1, minWidth: 160, borderLeft: `4px solid ${netBalance >= 0 ? B : "#f59e0b"}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Net Balance</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: netBalance >= 0 ? B : "#f59e0b" }}>{fmtMoney(netBalance, currency.symbol)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Income − Outgoings</div>
        </Card>
      </div>

      {/* Income table */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
          💚 Income ({allIncome.length})
        </div>
        {allIncome.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No income recorded for this period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Date", "Description", "Type", "Amount", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedIncome.map((row: any, i: number) => (
                  <tr key={row.id} style={{ borderBottom: i < pagedIncome.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(row.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#0f172a" }}>{row.description}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: 20, fontWeight: 600, fontSize: 11 }}>{row.type}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#22c55e", whiteSpace: "nowrap" }}>{fmtMoney(row.amount, row.symbol)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {row.deletable && (
                        <button onClick={() => onDeleteOfflineIncome(row.id)}
                          style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "4px 10px", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 16px 8px" }}>
              <Pagination page={incPage} total={incTotalPages} onChange={setIncPage} />
            </div>
          </div>
        )}
      </Card>

      {/* Outgoings table */}
      <Card>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
          🔴 Outgoings ({allOutgoings.length})
        </div>
        {allOutgoings.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No outgoings recorded for this period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Date", "Description", "Type", "Amount", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedOutgoing.map((row: any, i: number) => (
                  <tr key={row.id + row.type} style={{ borderBottom: i < pagedOutgoing.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(row.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#0f172a" }}>{row.description}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <span style={{ background: "#fef2f2", color: "#991b1b", padding: "2px 8px", borderRadius: 20, fontWeight: 600, fontSize: 11 }}>{row.type}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#ef4444", whiteSpace: "nowrap" }}>{fmtMoney(row.amount, row.symbol)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {row.deletable && (
                        <button onClick={() => onDeleteOfflineOutgoing?.(row.id)}
                          style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "4px 10px", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 16px 8px" }}>
              <Pagination page={outPage} total={outTotalPages} onChange={setOutPage} />
            </div>
          </div>
        )}
      </Card>

      {/* Log Income Modal */}
      {incomeOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Log Offline Income</div>
              <button onClick={() => setIncomeOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Description *", "description", "text", "e.g. Client retainer payment"],
                ["Category", "category", "text", "e.g. Consulting, Retainer, Training"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type={type} placeholder={ph} value={(incForm as any)[key]}
                    onChange={e => setIncForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Amount *</label>
                <input type="number" placeholder="0.00" value={incForm.amount}
                  onChange={e => setIncForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Currency</label>
                <select value={incForm.currency_code}
                  onChange={e => {
                    const c = CURRENCIES.find(c => c.code === e.target.value);
                    setIncForm(f => ({ ...f, currency_code: e.target.value, currency_symbol: c?.symbol || "" }));
                  }}
                  style={{ ...SEL, width: "100%" }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.country}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Date *</label>
                <input type="date" value={incForm.income_date}
                  onChange={e => setIncForm(f => ({ ...f, income_date: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={async () => {
                if (!incForm.description || !incForm.amount || !incForm.income_date) return;
                setIncSaving(true);
                await onLogOfflineIncome(incForm);
                setIncSaving(false);
                setIncomeOpen(false);
                setIncForm({ description: "", amount: "", currency_code: currency.code, currency_symbol: currency.symbol, income_date: new Date().toISOString().slice(0, 10), category: "", notes: "" });
              }} disabled={incSaving}
                style={{ padding: "13px", borderRadius: 12, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 15, cursor: incSaving ? "not-allowed" : "pointer", opacity: incSaving ? 0.7 : 1 }}>
                {incSaving ? "Saving..." : "Log Income"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Outgoing Modal */}
      {outgoingOpen && (
        <OutgoingModal
          currency={currency}
          onClose={() => setOutgoingOpen(false)}
          onSubmit={async (form: any) => {
            await onLogOfflineOutgoing?.(form);
            setOutgoingOpen(false);
          }}
        />
      )}
    </div>
  );
}

// --- Commission Badges --------------------------------------------------------
function CommBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: "#fef9c3", color: "#854d0e", label: "Pending"   },
    confirmed: { bg: "#dcfce7", color: "#166534", label: "Confirmed" },
    rejected:  { bg: "#fee2e2", color: "#991b1b", label: "Rejected"  },
    paid:      { bg: "#d1fae5", color: "#065f46", label: "Paid"      },
    unpaid:    { bg: "#f1f5f9", color: "#475569", label: "Unpaid"    },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// --- Log Sale Modal -----------------------------------------------------------
function LogSaleModal({ user, users, onClose, onSubmit }: any) {
  const isAdmin = user.role === "admin";
  const commissionMembers = users.filter((u: any) => u.earns_commission);
  const [form, setForm] = useState({
    member_id: isAdmin ? "" : user.id,
    client_name: "", product_service: "", sale_amount: "",
    sale_date: new Date().toISOString().split("T")[0], notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const selectedMember = users.find((u: any) => u.id === form.member_id);
  const currency = getCurrencyForCountry(selectedMember?.country || user.country || "");

  async function submit() {
    if (!form.member_id || !form.client_name || !form.product_service || !form.sale_amount || !form.sale_date) {
      setErr("Please fill in all required fields."); return;
    }
    setSaving(true); setErr("");
    try {
      await onSubmit({ ...form, currency_code: currency.code, currency_symbol: currency.symbol });
      onClose();
    } catch (e: any) { setErr(e.message || "Failed to log sale."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Log a Sale</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isAdmin && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Sales Rep *</label>
              <select value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                style={{ ...SEL, width: "100%" }}>
                <option value="">Select member...</option>
                {commissionMembers.map((u: any) => (
                  <option key={u.id} value={u.id}>{normUser(u).name}</option>
                ))}
              </select>
            </div>
          )}
          {[
            ["Client Name *", "client_name", "text", "e.g. Acme Ltd"],
            ["Product / Service *", "product_service", "text", "e.g. Business Strategy Course"],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
              <input type={type} placeholder={ph} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
              Sale Amount * {currency.code && <span style={{ fontWeight: 400, color: "#94a3b8" }}>({currency.code} {currency.symbol})</span>}
            </label>
            <input type="number" placeholder="0.00" value={form.sale_amount}
              onChange={e => setForm(f => ({ ...f, sale_amount: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Sale Date *</label>
            <input type="date" value={form.sale_date}
              onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
            <textarea placeholder="Any extra context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none", resize: "vertical" }} />
          </div>
          {err && <div style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", padding: "10px 14px", borderRadius: 8 }}>{err}</div>}
          <button onClick={submit} disabled={saving}
            style={{ padding: "12px", borderRadius: 10, background: saving ? "#94a3b8" : B, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700 }}>
            {saving ? "Saving..." : "Log Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sale Detail Modal --------------------------------------------------------
function SaleDetailModal({ sale, users, user, onClose, onConfirm, onReject, onMarkPaid, onMarkUnpaid }: any) {
  const [rejectNote, setRejectNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const member   = users.find((u: any) => u.id === sale.member_id);
  const isAdmin  = user.role === "admin";
  const isLeader = user.role === "leader";
  const canTogglePayout = isAdmin || (isLeader && sale.member_id !== user.id);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Sale Details</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {[
            ["Sales Rep", normUser(member)?.name || "-"],
            ["Client", sale.client_name],
            ["Product / Service", sale.product_service],
            ["Sale Date", new Date(sale.sale_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{value}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>Sale Amount</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{fmtMoney(Number(sale.sale_amount), sale.currency_symbol)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>Commission (1%)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(Number(sale.commission_amount), sale.currency_symbol)}</div>
          </div>
          {sale.notes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>Notes</div>
              <div style={{ fontSize: 13, color: "#374151" }}>{sale.notes}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Approval</div>
              <CommBadge status={sale.status} />
            </div>
            {sale.status === "confirmed" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Payout</div>
                <CommBadge status={sale.payout_status} />
              </div>
            )}
          </div>
          {sale.rejection_note && (
            <div style={{ background: "#fef2f2", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: "#991b1b" }}>
              <strong>Rejection note:</strong> {sale.rejection_note}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isAdmin && sale.status === "pending" && !rejectOpen && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onConfirm(sale.id); onClose(); }}
                style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                ✓ Confirm Sale
              </button>
              <button onClick={() => setRejectOpen(true)}
                style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                ✕ Reject
              </button>
            </div>
          )}
          {isAdmin && sale.status === "pending" && rejectOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea placeholder="Reason for rejection (optional)..." value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setRejectOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}>Cancel</button>
                <button onClick={() => { onReject(sale.id, rejectNote); onClose(); }}
                  style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
          {canTogglePayout && sale.status === "confirmed" && (
            sale.payout_status === "unpaid"
              ? <button onClick={() => { onMarkPaid(sale.id); onClose(); }}
                  style={{ padding: "11px", borderRadius: 9, border: "none", background: B, color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Mark as Paid
                </button>
              : <button onClick={() => { onMarkUnpaid(sale.id); onClose(); }}
                  style={{ padding: "11px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  Mark as Unpaid
                </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Commission Page ----------------------------------------------------------
function CommissionPage({ user, users, sales, onLogSale, onConfirmSale, onRejectSale, onMarkPaid, onMarkUnpaid, onBulkMarkPaid }: any) {
  const [logOpen,      setLogOpen]      = useState(false);
  const [detail,       setDetail]       = useState<any>(null);
  const [filter,       setFilter]       = useState("all");
  const [payFilter,    setPayFilter]    = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [commPage,     setCommPage]     = useState(1);
  const [bulkMonth,    setBulkMonth]    = useState(new Date().toISOString().slice(0, 7));
  const [bulkPaying,   setBulkPaying]   = useState<string | null>(null);
  const COMM_PER_PAGE = 10;

  const isAdmin  = user.role === "admin";
  const isLeader = user.role === "leader";

  const visibleSales = useMemo(() => {
    if (isAdmin) return sales;
    if (isLeader) {
      const myTeamIds = new Set(users.filter((u: any) => u.managed_by === user.id).map((u: any) => u.id));
      return sales.filter((s: any) => s.member_id === user.id || myTeamIds.has(s.member_id));
    }
    return sales.filter((s: any) => s.member_id === user.id);
  }, [sales, user, users, isAdmin, isLeader]);

  const filtered = useMemo(() => visibleSales.filter((s: any) => {
    if (filter !== "all"       && s.status        !== filter)       return false;
    if (payFilter !== "all"    && s.payout_status  !== payFilter)    return false;
    if (memberFilter !== "all" && s.member_id      !== memberFilter) return false;
    return true;
  }), [visibleSales, filter, payFilter, memberFilter]);

  const commTotalPages = Math.ceil(filtered.length / COMM_PER_PAGE);
  const pagedSales     = filtered.slice((commPage - 1) * COMM_PER_PAGE, commPage * COMM_PER_PAGE);

  const confirmedSales = visibleSales.filter((s: any) => s.status === "confirmed");
  const pendingCount   = visibleSales.filter((s: any) => s.status === "pending").length;

  const earningsByCurrency = useMemo(() => {
    const map: Record<string, { symbol: string; total: number; unpaid: number }> = {};
    confirmedSales.forEach((s: any) => {
      if (!map[s.currency_code]) map[s.currency_code] = { symbol: s.currency_symbol, total: 0, unpaid: 0 };
      map[s.currency_code].total += Number(s.commission_amount);
      if (s.payout_status === "unpaid") map[s.currency_code].unpaid += Number(s.commission_amount);
    });
    return Object.entries(map);
  }, [confirmedSales]);

  const teamMembers = isAdmin
    ? users.filter((u: any) => u.earns_commission)
    : users.filter((u: any) => u.managed_by === user.id && u.earns_commission);

  const filterBtn = (val: string, cur: string, set: (v: string) => void, dark?: boolean) => (
    <button key={val} onClick={() => { set(val); setCommPage(1); }} style={{
      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
      border: cur === val ? "none" : "1px solid #e2e8f0",
      background: cur === val ? (dark ? "#0f172a" : B) : "white",
      color: cur === val ? "white" : "#374151",
    }}>
      {val.charAt(0).toUpperCase() + val.slice(1)}
    </button>
  );

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>💰 Commission</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {isAdmin ? "Manage all team sales and payouts" : isLeader ? "Your earnings and your team's payouts" : "Your sales and commission earnings"}
          </div>
        </div>
        {(isAdmin || user.earns_commission) && (
          <button onClick={() => setLogOpen(true)}
            style={{ padding: "11px 22px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
            + Log a Sale
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="prowess-stat-row" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {earningsByCurrency.length === 0
          ? <Card style={{ padding: "18px 20px", flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Total Earnings</div><div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>-</div><div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>No confirmed sales yet</div></Card>
          : earningsByCurrency.map(([code, data]) => (
            <Card key={code} style={{ padding: "18px 20px", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Total Earned ({code})</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(data.total, data.symbol)}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{fmtMoney(data.unpaid, data.symbol)} unpaid</div>
            </Card>
          ))
        }
        <Card style={{ padding: "18px 20px", flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Pending Review</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: pendingCount > 0 ? "#d97706" : "#0f172a" }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>awaiting confirmation</div>
        </Card>
        <Card style={{ padding: "18px 20px", flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Confirmed Sales</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{confirmedSales.length}</div>
        </Card>
      </div>

      {/* Bulk Payout - admin only */}
      {isAdmin && (() => {
        const unpaidByMember = users
          .filter((u: any) => u.earns_commission && u.role !== "admin")
          .map((u: any) => {
            const unpaidSales = sales.filter((s: any) =>
              s.member_id === u.id && s.status === "confirmed" &&
              s.payout_status === "unpaid" && s.sale_date.slice(0, 7) === bulkMonth
            );
            const total = unpaidSales.reduce((sum: number, s: any) => sum + parseFloat(s.commission_amount), 0);
            return { user: u, sales: unpaidSales, total };
          })
          .filter((row: any) => row.sales.length > 0);

        return (
          <Card style={{ padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: unpaidByMember.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>💳 Bulk Payout</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="month" value={bulkMonth} onChange={e => setBulkMonth(e.target.value)}
                  style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
                {unpaidByMember.length > 0 && (
                  <button disabled={!!bulkPaying}
                    onClick={async () => {
                      setBulkPaying("all");
                      await onBulkMarkPaid?.(unpaidByMember.map((r: any) => r.user.id), bulkMonth);
                      setBulkPaying(null);
                    }}
                    style={{ padding: "7px 18px", borderRadius: 8, background: "#0f172a", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: bulkPaying ? "not-allowed" : "pointer", opacity: bulkPaying ? 0.6 : 1 }}>
                    {bulkPaying === "all" ? "Paying..." : "Pay All"}
                  </button>
                )}
              </div>
            </div>
            {unpaidByMember.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                No unpaid confirmed commissions for {new Date(bulkMonth + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {unpaidByMember.map((row: any) => {
                  const mu = normUser(row.user);
                  const sym = row.sales[0]?.currency_symbol || "";
                  return (
                    <div key={row.user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 10, padding: "12px 16px", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Av user={row.user} size={32} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{mu.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{row.sales.length} sale{row.sales.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(row.total, sym)}</div>
                        <button disabled={!!bulkPaying}
                          onClick={async () => {
                            setBulkPaying(row.user.id);
                            await onBulkMarkPaid?.([row.user.id], bulkMonth);
                            setBulkPaying(null);
                          }}
                          style={{ padding: "6px 16px", borderRadius: 8, background: B, color: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: bulkPaying ? "not-allowed" : "pointer", opacity: bulkPaying ? 0.6 : 1 }}>
                          {bulkPaying === row.user.id ? "Paying..." : "Mark Paid"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* Filters */}
      <div style={{ background: "white", borderRadius: 12, padding: "14px 18px", border: "1px solid #e2e8f0", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "rejected"].map(f => filterBtn(f, filter, setFilter))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "paid", "unpaid"].map(f => filterBtn(f, payFilter, setPayFilter, true))}
        </div>
        {(isAdmin || isLeader) && teamMembers.length > 0 && (
          <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
            style={{ ...SEL, fontSize: 13 }}>
            <option value="all">All members</option>
            {teamMembers.map((u: any) => (
              <option key={u.id} value={u.id}>{normUser(u).name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <Card style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            No sales found for the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {(isAdmin || isLeader) && <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Member</th>}
                  {["Client", "Product/Service", "Sale Amount", "Commission", "Date", "Status", "Payout"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedSales.map((sale: any, i: number) => {
                  const member = users.find((u: any) => u.id === sale.member_id);
                  return (
                    <tr key={sale.id} onClick={() => setDetail(sale)}
                      style={{ borderBottom: i < pagedSales.length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                      {(isAdmin || isLeader) && <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{normUser(member)?.name || "-"}</td>}
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#0f172a", whiteSpace: "nowrap" }}>{sale.client_name}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>{sale.product_service}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{fmtMoney(Number(sale.sale_amount), sale.currency_symbol)}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>{fmtMoney(Number(sale.commission_amount), sale.currency_symbol)}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>{new Date(sale.sale_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}><CommBadge status={sale.status} /></td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>{sale.status === "confirmed" ? <CommBadge status={sale.payout_status} /> : <span style={{ color: "#cbd5e1", fontSize: 12 }}>-</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "0 16px 8px" }}>
              <Pagination page={commPage} total={commTotalPages} onChange={setCommPage} />
            </div>
          </div>
        )}
      </Card>

      {logOpen && <LogSaleModal user={user} users={users} onClose={() => setLogOpen(false)} onSubmit={onLogSale} />}
      {detail && (
        <SaleDetailModal
          sale={detail} users={users} user={user}
          onClose={() => setDetail(null)}
          onConfirm={onConfirmSale} onReject={onRejectSale}
          onMarkPaid={onMarkPaid} onMarkUnpaid={onMarkUnpaid}
        />
      )}
    </div>
  );
}

function TeamPage({ users, user, tasks, logs, onCreateMember, onAssignLeader, onDisableMember, onEnableMember, onToggleCommission, onUpdateMemberPaySettings }: any) {
  const [modal,          setModal]          = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [saving,         setSaving]         = useState(false);
  const [statusReason,   setStatusReason]   = useState("");
  const [statusSaving,   setStatusSaving]   = useState(false);
  const [error,          setError]          = useState("");
  const [done,           setDone]           = useState(false);
  const [form,           setForm]           = useState({ fullName: "", email: "", password: "", jobTitle: "", role: "member", managedBy: "", country: "", earnsCommission: false });
  const [teamPage,       setTeamPage]       = useState(1);
  const TEAM_PER_PAGE = 12;
  const activeCount = users.filter((u: any) => !isDisabledProfile(u)).length;
  const disabledCount = users.filter((u: any) => isDisabledProfile(u)).length;

  const teamTotalPages = Math.ceil(users.length / TEAM_PER_PAGE);
  const pagedUsers     = users.slice((teamPage - 1) * TEAM_PER_PAGE, teamPage * TEAM_PER_PAGE);

  async function add() {
    if (!form.fullName || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreateMember({ ...form, managed_by: form.managedBy || null, earns_commission: form.earnsCommission });
      setDone(true);
      setTimeout(() => { setDone(false); setModal(false); setForm({ fullName: "", email: "", password: "", jobTitle: "", role: "member", managedBy: "", country: "", earnsCommission: false }); }, 1500);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {activeCount} active member{activeCount !== 1 ? "s" : ""}
          {disabledCount > 0 ? ` · ${disabledCount} disabled` : ""}
        </div>
        {user?.role === "admin" && (
          <button onClick={() => { setModal(true); setError(""); setDone(false); }}
            style={{ padding: "10px 18px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Add Team Member
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
        {pagedUsers.map((u: any) => {
          const nu = normUser(u);
          const leaders = users.filter((x: any) => x.role === "leader" || x.role === "admin");
          const assignedLeader = u.managed_by ? normUser(users.find((x: any) => x.id === u.managed_by)) : null;
          return (
            <Card key={u.id} style={{ padding: 24, textAlign: "center", cursor: "pointer", transition: "box-shadow 0.2s", opacity: isDisabledProfile(u) ? 0.62 : 1, borderColor: isDisabledProfile(u) ? "#fecaca" : "#e2e8f0" }}
              onClick={() => { setSelectedMember(u); setStatusReason(""); }}>
              <Av user={u} size={54} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 12 }}>{nu.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{nu.title || (u.role === "admin" ? "Administrator" : u.role === "leader" ? "Team Leader" : isDisabledProfile(u) ? "Disabled Profile" : "Team Member")}</div>
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20,
                background: u.role === "admin" ? B + "18" : u.role === "leader" ? "#fef9c3" : isDisabledProfile(u) ? "#fef2f2" : "#f1f5f9",
                color: u.role === "admin" ? B : u.role === "leader" ? "#b45309" : isDisabledProfile(u) ? "#dc2626" : "#64748b" }}>
                {u.role === "admin" ? "Admin" : u.role === "leader" ? "Leader" : isDisabledProfile(u) ? "Disabled" : "Member"}
              </span>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{u.email}</div>
              {assignedLeader && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Leader: <strong>{assignedLeader.name}</strong>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <Pagination page={teamPage} total={teamTotalPages} onChange={setTeamPage} />

      {/* Member detail modal */}
      {selectedMember && (() => {
        const mu = normUser(selectedMember);
        const leaders = users.filter((x: any) => x.role === "leader" || x.role === "admin");
        const assignedLeader = selectedMember.managed_by ? normUser(users.find((x: any) => x.id === selectedMember.managed_by)) : null;
        const memberTasks = (tasks || []).map(normTask).filter((t: any) => t.assignedTo === selectedMember.id);
        const memberLogs  = (logs  || []).map(normLog) .filter((l: any) => l.userId   === selectedMember.id);
        const approvedTasks = memberTasks.filter((t: any) => t.approvalStatus === "approved");
        const approvedLogs  = memberLogs.filter((l: any) => l.approvalStatus === "approved");
        const completed   = approvedTasks.filter((t: any) => t.status === "completed").length;
        const inProgress  = memberTasks.filter((t: any) => t.status === "in-progress").length;
        const overdue     = memberTasks.filter((t: any) => t.status !== "completed" && t.deadline && t.deadline < fmt(today)).length;
        let pts = 0;
        approvedTasks.forEach((t: any) => {
          if (t.status === "completed") {
            pts += 10;
            if (t.priority === "high") pts += 5;
            if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
            else if (t.completedAt && t.deadline && t.completedAt > t.deadline) pts -= 5;
          }
        });
        pts = Math.max(0, pts + approvedLogs.length * 3);
        const joinDate = selectedMember.created_at
          ? new Date(selectedMember.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : null;

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setSelectedMember(null)}>
            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Card style={{ padding: 32, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <Av user={selectedMember} size={56} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{mu.name}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{mu.title || "No job title"}</div>
                    <span style={{ display: "inline-block", marginTop: 4, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                      background: selectedMember.role === "admin" ? B + "18" : selectedMember.role === "leader" ? "#fef9c3" : isDisabledProfile(selectedMember) ? "#fef2f2" : "#f1f5f9",
                      color: selectedMember.role === "admin" ? B : selectedMember.role === "leader" ? "#b45309" : isDisabledProfile(selectedMember) ? "#dc2626" : "#64748b" }}>
                      {selectedMember.role === "admin" ? "Admin" : selectedMember.role === "leader" ? "Leader" : isDisabledProfile(selectedMember) ? "Disabled" : "Member"}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>{"x"}</button>
              </div>

              {/* Contact info */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Contact</div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  <strong>Email:</strong> {selectedMember.email}
                </div>
                {assignedLeader && (
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                    <strong>Reports to:</strong> {assignedLeader.name}
                  </div>
                )}
                {joinDate && (
                  <div style={{ fontSize: 13, color: "#374151" }}>
                    <strong>Joined:</strong> {joinDate}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Tasks Assigned", value: memberTasks.length,   color: "#6366f1" },
                  { label: "Completed",      value: completed,             color: "#22c55e" },
                  { label: "In Progress",    value: inProgress,            color: B },
                  { label: "Overdue",        value: overdue,               color: overdue > 0 ? "#ef4444" : "#94a3b8" },
                  { label: "Activity Logs",  value: approvedLogs.length,   color: "#6366f1" },
                  { label: "Score",          value: `${pts}pt`,            color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {user.role === "admin" && selectedMember.role !== "admin" && !isDisabledProfile(selectedMember) && (
                <div style={{ marginBottom: 20, padding: "14px 16px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>Disable profile</div>
                  <div style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.6, marginBottom: 12 }}>
                    Use this when a team member resigns. They will be marked as disabled and blocked from logging in.
                  </div>
                  <textarea
                    value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder="Reason for disabling this team member"
                    style={{ width: "100%", minHeight: 88, resize: "vertical", padding: "10px 12px", borderRadius: 10, border: "1px solid #fecaca", fontSize: 14, marginBottom: 12 }}
                  />
                  <button
                    onClick={async () => {
                      const reason = statusReason.trim();
                      if (!reason) {
                        window.alert("Please enter a reason before disabling this profile.");
                        return;
                      }
                      const ok = window.confirm(`Disable ${mu.name}'s profile? They will no longer be able to log in.`);
                      if (!ok) return;
                      try {
                        setStatusSaving(true);
                        await onDisableMember?.(selectedMember.id, reason);
                        setSelectedMember((prev: any) => prev ? { ...prev, role: "disabled", managed_by: null, earns_commission: false, status_reason: reason } : prev);
                        setStatusReason("");
                      } catch (e: any) {
                        window.alert(e?.message || "Failed to disable profile.");
                      } finally {
                        setStatusSaving(false);
                      }
                    }}
                    disabled={statusSaving}
                    style={{ padding: "10px 14px", borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: statusSaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: statusSaving ? 0.7 : 1 }}
                  >
                    {statusSaving ? "Saving..." : "Disable Profile"}
                  </button>
                </div>
              )}

              {isDisabledProfile(selectedMember) && (
                <div style={{ marginBottom: 20, padding: "14px 16px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>Profile disabled</div>
                  <div style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.6, marginBottom: 12 }}>
                    This team member has been disabled and should no longer have access to the dashboard.
                  </div>
                  {selectedMember.status_reason && (
                    <div style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 12 }}>
                      <strong>Latest status note:</strong> {selectedMember.status_reason}
                    </div>
                  )}
                  {user.role === "admin" && (
                    <>
                      <textarea
                        value={statusReason}
                        onChange={e => setStatusReason(e.target.value)}
                        placeholder="Reason for enabling this team member"
                        style={{ width: "100%", minHeight: 88, resize: "vertical", padding: "10px 12px", borderRadius: 10, border: "1px solid #fecaca", fontSize: 14, marginBottom: 12, background: "white" }}
                      />
                      <button
                        onClick={async () => {
                          const reason = statusReason.trim();
                          if (!reason) {
                            window.alert("Please enter a reason before enabling this profile.");
                            return;
                          }
                          try {
                            setStatusSaving(true);
                            const result = await onEnableMember?.(selectedMember.id, reason);
                            setSelectedMember((prev: any) => prev ? { ...prev, role: result?.role || "member", status_reason: reason } : prev);
                            setStatusReason("");
                          } catch (e: any) {
                            window.alert(e?.message || "Failed to enable profile.");
                          } finally {
                            setStatusSaving(false);
                          }
                        }}
                        disabled={statusSaving}
                        style={{ padding: "10px 14px", borderRadius: 10, background: "#16a34a", color: "white", border: "none", cursor: statusSaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: statusSaving ? 0.7 : 1 }}
                      >
                        {statusSaving ? "Saving..." : "Enable Profile"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Recent tasks */}
              {memberTasks.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Recent Tasks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...memberTasks].sort((a: any, b: any) => (b.deadline || "").localeCompare(a.deadline || "")).slice(0, 4).map((t: any) => (
                      <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, flex: 1, marginRight: 8 }}>{t.title}</div>
                        <Pill type="status" value={t.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign leader -- admin only */}
              {user.role === "admin" && selectedMember.role !== "admin" && !isDisabledProfile(selectedMember) && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Assign Team Leader</label>
                  <select
                    value={selectedMember.managed_by || ""}
                    onChange={e => {
                      const val = e.target.value || null;
                      onAssignLeader?.(selectedMember.id, val);
                      setSelectedMember((prev: any) => ({ ...prev, managed_by: val }));
                    }}
                    style={{ ...SEL, width: "100%" }}
                  >
                    <option value="">-- No leader assigned --</option>
                    {leaders.map((l: any) => (
                      <option key={l.id} value={l.id}>{normUser(l).name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Commission toggle -- admin only */}
              {user.role === "admin" && selectedMember.role !== "admin" && !isDisabledProfile(selectedMember) && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Earns Commission</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {selectedMember.country
                        ? `${selectedMember.country} · ${getCurrencyForCountry(selectedMember.country).code} ${getCurrencyForCountry(selectedMember.country).symbol}`
                        : "No country set"}
                      {" · "}1% per confirmed sale
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => {
                      const newVal = !selectedMember.earns_commission;
                      onToggleCommission?.(selectedMember.id, newVal);
                      setSelectedMember((prev: any) => ({ ...prev, earns_commission: newVal }));
                    }}
                    style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                      background: selectedMember.earns_commission ? B : "#e2e8f0", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute", top: 2, left: selectedMember.earns_commission ? 22 : 2, width: 20, height: 20,
                      borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>
              )}

              {/* Pay Settings -- admin only */}
              {user.role === "admin" && selectedMember.role !== "admin" && !isDisabledProfile(selectedMember) && (
                <div style={{ marginTop: 16, padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>💳 Pay Settings</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Pay Type</label>
                      <select value={selectedMember.pay_type || "monthly"}
                        onChange={e => {
                          onUpdateMemberPaySettings?.(selectedMember.id, { pay_type: e.target.value });
                          setSelectedMember((prev: any) => ({ ...prev, pay_type: e.target.value }));
                        }}
                        style={{ ...SEL, width: "100%", fontSize: 13 }}>
                        <option value="monthly">Monthly Salary</option>
                        <option value="per_article">Per Article</option>
                      </select>
                    </div>
                    {(selectedMember.pay_type === "per_article") && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                          Rate per Article ({getCurrencyForCountry(selectedMember.country || "").symbol})
                        </label>
                        <input type="number" placeholder="e.g. 5000"
                          defaultValue={selectedMember.article_rate || ""}
                          onBlur={e => {
                            const val = parseFloat(e.target.value) || null;
                            onUpdateMemberPaySettings?.(selectedMember.id, { article_rate: val });
                            setSelectedMember((prev: any) => ({ ...prev, article_rate: val }));
                          }}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                      </div>
                    )}
                    {(!selectedMember.pay_type || selectedMember.pay_type === "monthly") && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                          Monthly Salary ({getCurrencyForCountry(selectedMember.country || "").symbol})
                        </label>
                        <input type="number" placeholder="e.g. 150000"
                          defaultValue={selectedMember.monthly_rate || ""}
                          onBlur={e => {
                            const val = parseFloat(e.target.value) || null;
                            onUpdateMemberPaySettings?.(selectedMember.id, { monthly_rate: val });
                            setSelectedMember((prev: any) => ({ ...prev, monthly_rate: val }));
                          }}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Date of Birth</label>
                      <input type="date"
                        defaultValue={selectedMember.date_of_birth || ""}
                        onBlur={e => {
                          const val = e.target.value || null;
                          onUpdateMemberPaySettings?.(selectedMember.id, { date_of_birth: val });
                          setSelectedMember((prev: any) => ({ ...prev, date_of_birth: val }));
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                </div>
              )}

            </Card>
            </div>
          </div>
        );
      })()}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ padding: 32, width: 460, maxWidth: "100%" }}>
            {done ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Account created!</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>They can now log in at /login</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Add Team Member</div>

                {[
                  ["Full Name", "fullName", "text"],
                  ["Email Address", "email", "email"],
                  ["Password", "password", "password"],
                  ["Job Title", "jobTitle", "text"],
                ].map(([label, key, type]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                    <option value="member">Team Member</option>
                    <option value="leader">Team Leader</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {form.role !== "admin" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Assign to Leader <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
                    <select value={form.managedBy} onChange={e => setForm(f => ({ ...f, managedBy: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                      <option value="">-- No leader assigned --</option>
                      {users.filter((u: any) => u.role === "leader" || u.role === "admin").map((l: any) => (
                        <option key={l.id} value={l.id}>{normUser(l).name}</option>
                      ))}
                    </select>
                    {users.filter((u: any) => u.role === "leader" || u.role === "admin").length === 0 && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>No leaders yet -- you can assign one later from the Team page.</div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Country <span style={{ fontWeight: 400, color: "#94a3b8" }}>(sets currency)</span></label>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                    <option value="">-- Select country --</option>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.country}>{c.country} ({c.code} {c.symbol})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Earns Commission</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Member earns 1% on referred sales</div>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, earnsCommission: !f.earnsCommission }))}
                    style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                      background: form.earnsCommission ? B : "#e2e8f0", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute", top: 2, left: form.earnsCommission ? 22 : 2, width: 20, height: 20,
                      borderRadius: "50%", background: "white", transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>

                {error && (
                  <div style={{ fontSize: 13, color: "#ef4444", padding: "10px 14px", background: "#fef2f2", borderRadius: 8, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={add} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 10, background: saving ? "#94a3b8" : B, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
                    {saving ? "Creating..." : "Create Account"}
                  </button>
                  <button onClick={() => setModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#f1f5f9", color: "#374151", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ user, onUpdateProfile }: any) {
  const nu = normUser(user);
  const [name,    setName]    = useState(nu.name   || "");
  const [title,   setTitle]   = useState(nu.title  || "");
  const [status,  setStatus]  = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (!onUpdateProfile) return;
    setStatus("saving");
    try {
      await onUpdateProfile({ full_name: name, job_title: title });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  const btnLabel = status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : status === "error" ? "Error, try again" : "Save Changes";
  const btnColor = status === "saved" ? "#22c55e" : status === "error" ? "#ef4444" : B;

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", maxWidth: 580 }}>
      <Card style={{ padding: 32, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 22 }}>Account Settings</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26, padding: 20, background: "#f8fafc", borderRadius: 14 }}>
          <Av user={user} size={54} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{name || nu.name}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{user.email}</div>
            <span style={{ marginTop: 6, display: "inline-block", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: B + "18", color: B }}>
              {user.role === "admin" ? "Administrator" : title || nu.title}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Email Address</label>
          <input
            value={user.email}
            disabled
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none", background: "#f8fafc", color: "#94a3b8" }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Email cannot be changed here</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Job Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }}
          />
        </div>

        <button
          onClick={save}
          disabled={status === "saving"}
          style={{ padding: "12px 24px", borderRadius: 10, background: btnColor, color: "white", border: "none", cursor: status === "saving" ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, transition: "background 0.2s" }}
        >
          {btnLabel}
        </button>
      </Card>
      <Card style={{ padding: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Scoring Rules</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Task Completed", "+10 points", "#22c55e"],
            ["Early Completion", "+5 bonus", "#22c55e"],
            ["Overdue Task", "3 points", "#ef4444"],
            ["Activity Log Entry", "+2 points", "#22c55e"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- KPI helpers --------------------------------------------------------------
function kpiCurrentValue(assignment: any, logs: any[]): number {
  const myLogs = logs.filter((l: any) => l.assignment_id === assignment.id)
    .sort((a: any, b: any) => a.created_at?.localeCompare(b.created_at));
  if (!myLogs.length) return 0;
  if (assignment.metric_type === "snapshot") return myLogs[myLogs.length - 1].value;
  return myLogs.reduce((s: number, l: any) => s + Number(l.value), 0);
}

function kpiPct(current: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

const VERDICT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  exceeded:      { label: "Exceeded 🌟",      color: "#059669", bg: "#d1fae5" },
  met:           { label: "Met ✅",            color: "#2563eb", bg: "#dbeafe" },
  partially_met: { label: "Partially Met 🔶", color: "#d97706", bg: "#fef3c7" },
  not_met:       { label: "Not Met ❌",        color: "#dc2626", bg: "#fee2e2" },
};

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = VERDICT_CFG[verdict];
  if (!cfg) return null;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: 20 }}>
      {cfg.label}
    </span>
  );
}

// --- KPI Page -----------------------------------------------------------------
function KPIPage({ user, users, kpiAssignments, kpiLogs, onCreateAssignment, onLogKPI, onSetVerdict, onDeleteAssignment }: any) {
  const [month,        setMonth]        = useState(() => fmt(today).slice(0, 7));
  const [showAssign,   setShowAssign]   = useState(false);
  const [showLog,      setShowLog]      = useState<any>(null);
  const [showVerdict,  setShowVerdict]  = useState<any>(null);
  const [showHistory,  setShowHistory]  = useState<any>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  // Month navigation
  const prevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const monthLabel = () => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };

  const monthAssignments = (kpiAssignments || []).filter((a: any) => a.month === month);
  const isCurrentMonth = month === fmt(today).slice(0, 7);

  // Who can see what
  const visibleUsers = isPrivileged(user)
    ? (users || []).filter((u: any) => {
        if (user.role === "leader") return u.managed_by === user.id || u.id === user.id;
        return true;
      })
    : [normUser((users || []).find((u: any) => u.id === user.id)) || user];

  // -- Assign KPI modal --------------------------------------------------------
  const [aForm, setAForm] = useState({
    assignMode: "individual" as "individual" | "role",
    assignTo: "",
    assignRole: "",
    metricName: "",
    unit: "",
    metricType: "cumulative" as "cumulative" | "snapshot",
    targetValue: "",
  });

  const roleOptions = Array.from(new Set((users || []).map((u: any) => u.job_title || u.title).filter(Boolean)));

  async function submitAssign() {
    if (!aForm.metricName || !aForm.unit || !aForm.targetValue) return;
    setSaving(true);
    try {
      let targets: string[] = [];
      if (aForm.assignMode === "individual") {
        if (!aForm.assignTo) return;
        targets = [aForm.assignTo];
      } else {
        targets = (users || [])
          .filter((u: any) => (u.job_title || u.title) === aForm.assignRole)
          .map((u: any) => u.id);
      }
      for (const uid of targets) {
        await onCreateAssignment?.({
          assigned_to: uid,
          metric_name: aForm.metricName,
          unit: aForm.unit,
          metric_type: aForm.metricType,
          target_value: Number(aForm.targetValue),
          month,
        });
      }
      setShowAssign(false);
      setAForm({ assignMode: "individual", assignTo: "", assignRole: "", metricName: "", unit: "", metricType: "cumulative", targetValue: "" });
    } finally { setSaving(false); }
  }

  // -- Log KPI modal -----------------------------------------------------------
  const [lForm, setLForm] = useState({ value: "", note: "" });

  async function submitLog() {
    if (!lForm.value || !showLog) return;
    setSaving(true);
    try {
      await onLogKPI?.({ assignment_id: showLog.id, value: Number(lForm.value), note: lForm.note });
      setShowLog(null);
      setLForm({ value: "", note: "" });
    } finally { setSaving(false); }
  }

  // -- Verdict modal -----------------------------------------------------------
  const [vForm, setVForm] = useState({ verdict: "", note: "" });

  async function submitVerdict() {
    if (!vForm.verdict || !showVerdict) return;
    setSaving(true);
    try {
      await onSetVerdict?.({ id: showVerdict.id, verdict: vForm.verdict, verdict_note: vForm.note });
      setShowVerdict(null);
      setVForm({ verdict: "", note: "" });
    } finally { setSaving(false); }
  }

  // -- KPI card for a single assignment ---------------------------------------
  function KPICard({ assignment, canManage, isMine }: { assignment: any; canManage: boolean; isMine: boolean }) {
    const logs = (kpiLogs || []).filter((l: any) => l.assignment_id === assignment.id)
      .sort((a: any, b: any) => b.created_at?.localeCompare(a.created_at));
    const current = kpiCurrentValue(assignment, kpiLogs || []);
    const pct = kpiPct(current, assignment.target_value);
    const barColor = pct >= 100 ? "#059669" : pct >= 60 ? "#2563eb" : pct >= 30 ? "#d97706" : "#dc2626";

    return (
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{assignment.metric_name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {assignment.metric_type === "cumulative" ? "📈 Cumulative" : "📸 Snapshot"} {" | "} Target: <strong style={{ color: "#475569" }}>{assignment.target_value} {assignment.unit}</strong>
            </div>
          </div>
          {assignment.verdict
            ? <VerdictBadge verdict={assignment.verdict} />
            : (
              <span style={{ fontSize: 13, fontWeight: 800, color: barColor }}>
                {current} <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>{assignment.unit}</span>
              </span>
            )
          }
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
          <span>{current} / {assignment.target_value} {assignment.unit}</span>
          <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isMine && isCurrentMonth && !assignment.verdict && (
            <button onClick={() => { setShowLog(assignment); setLForm({ value: "", note: "" }); }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: B + "18", border: `1px solid ${B}30`, color: B, fontWeight: 600, cursor: "pointer" }}>
              + Log Progress
            </button>
          )}
          {canManage && !assignment.verdict && (
            <button onClick={() => { setShowVerdict(assignment); setVForm({ verdict: "", note: "" }); }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
              Set Verdict
            </button>
          )}
          {logs.length > 0 && (
            <button onClick={() => setShowHistory(assignment)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer" }}>
              📋 {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </button>
          )}
          {canManage && (
            <button onClick={() => onDeleteAssignment?.(assignment.id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#fee2e2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer", marginLeft: "auto" }}>
              Remove
            </button>
          )}
        </div>

        {/* Verdict note */}
        {assignment.verdict_note && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "white", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", fontStyle: "italic" }}>
            💬 "{assignment.verdict_note}"
          </div>
        )}
      </div>
    );
  }

  // -- Member KPI summary card (admin/leader view) -----------------------------
  function MemberKPICard({ member }: { member: any }) {
    const mu = normUser(member);
    if (!mu) return null;
    const myAssignments = monthAssignments.filter((a: any) => a.assigned_to === mu.id);
    const verdictCounts = myAssignments.filter((a: any) => a.verdict).length;
    const met = myAssignments.filter((a: any) => a.verdict === "met" || a.verdict === "exceeded").length;
    const isOpen = expandedUser === mu.id;

    return (
      <Card style={{ overflow: "hidden" }}>
        <button onClick={() => setExpandedUser(isOpen ? null : mu.id)} style={{
          width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
        }}>
          <Av user={mu} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{mu.name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{mu.title || mu.role}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {myAssignments.length === 0
              ? <span style={{ fontSize: 12, color: "#94a3b8" }}>No KPIs set</span>
              : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{myAssignments.length} KPI{myAssignments.length !== 1 ? "s" : ""}</div>
                  {verdictCounts > 0 && <div style={{ fontSize: 11, color: "#64748b" }}>{met}/{verdictCounts} met/exceeded</div>}
                </>
              )
            }
          </div>
          <span style={{ fontSize: 18, color: "#94a3b8", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>{">"}</span>
        </button>

        {isOpen && (
          <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f1f5f9" }}>
            {myAssignments.length === 0
              ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  No KPIs assigned for {monthLabel()}
                </div>
              )
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
                  {myAssignments.map((a: any) => (
                    <KPICard
                      key={a.id}
                      assignment={a}
                      canManage={user.role === "admin" || (user.role === "leader" && member.role !== "admin")}
                      isMine={mu.id === user.id}
                    />
                  ))}
                </div>
              )
            }
          </div>
        )}
      </Card>
    );
  }

  const [kpiPage, setKpiPage] = useState(1);
  const KPI_PER_PAGE = 8;
  const pagedVisibleUsers = visibleUsers.slice((kpiPage - 1) * KPI_PER_PAGE, kpiPage * KPI_PER_PAGE);
  const kpiTotalPages = Math.ceil(visibleUsers.length / KPI_PER_PAGE);

  // -- My KPIs (member view) ---------------------------------------------------
  const myAssignments = monthAssignments.filter((a: any) => a.assigned_to === user.id);
  const myTotal = myAssignments.length;
  const myMet = myAssignments.filter((a: any) => a.verdict === "met" || a.verdict === "exceeded").length;
  const myPending = myAssignments.filter((a: any) => !a.verdict).length;

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 12, padding: "6px 8px", border: "1px solid #e2e8f0" }}>
          <button onClick={prevMonth} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>{"<"}</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", minWidth: 140, textAlign: "center" }}>{monthLabel()}</span>
          <button onClick={nextMonth} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>{">"}</button>
        </div>
        {isPrivileged(user) && isCurrentMonth && (
          <button onClick={() => setShowAssign(true)} style={{ padding: "10px 18px", borderRadius: 11, background: B, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Assign KPI
          </button>
        )}
      </div>

      {/* Summary strip for members */}
      {!isPrivileged(user) && myTotal > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Assigned", value: myTotal, color: "#6366f1" },
            { label: "Met / Exceeded", value: myMet, color: "#059669" },
            { label: "Pending Verdict", value: myPending, color: "#d97706" },
          ].map(s => (
            <Card key={s.label} style={{ padding: "16px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin/Leader: member list */}
      {isPrivileged(user) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visibleUsers.length === 0
            ? <Card style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No team members yet</Card>
            : pagedVisibleUsers.map((u: any) => <MemberKPICard key={u.id} member={u} />)
          }
          {kpiTotalPages > 1 && <Pagination page={kpiPage} total={kpiTotalPages} onChange={setKpiPage} />}
        </div>
      ) : (
        /* Member: own KPIs */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myAssignments.length === 0
            ? (
              <Card style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>No KPIs for {monthLabel()}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Your admin or leader will assign KPI targets for this month.</div>
              </Card>
            )
            : myAssignments.map((a: any) => (
              <KPICard key={a.id} assignment={a} canManage={false} isMine={true} />
            ))
          }
        </div>
      )}

      {/* -- Assign KPI modal -- */}
      {showAssign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setShowAssign(false); }}>
          <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "28px 24px 40px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🎯 Assign KPI - {monthLabel()}</div>

            {/* Assign mode */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["individual", "role"] as const).map(m => (
                <button key={m} onClick={() => setAForm(f => ({ ...f, assignMode: m }))} style={{ flex: 1, padding: "9px", borderRadius: 10, border: `2px solid ${aForm.assignMode === m ? B : "#e2e8f0"}`, background: aForm.assignMode === m ? B + "12" : "white", color: aForm.assignMode === m ? B : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {m === "individual" ? "👤 Individual" : "👥 By Role / Team"}
                </button>
              ))}
            </div>

            {aForm.assignMode === "individual" ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Assign to</label>
                <select value={aForm.assignTo} onChange={e => setAForm(f => ({ ...f, assignTo: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                  <option value="">Select member...</option>
                  {visibleUsers.map((u: any) => {
                    const nu = normUser(u);
                    return <option key={nu.id} value={nu.id}>{nu.name} {nu.title ? `- ${nu.title}` : ""}</option>;
                  })}
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Apply to all members with role</label>
                <select value={aForm.assignRole} onChange={e => setAForm(f => ({ ...f, assignRole: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                  <option value="">Select role...</option>
                  {roleOptions.map((r: any) => <option key={r} value={r}>{r}</option>)}
                </select>
                {aForm.assignRole && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                    Will assign to {(users || []).filter((u: any) => (u.job_title || u.title) === aForm.assignRole).length} member(s)
                  </div>
                )}
              </div>
            )}

            {/* Metric details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>KPI Name</label>
                <input value={aForm.metricName} onChange={e => setAForm(f => ({ ...f, metricName: e.target.value }))} placeholder="e.g. New Followers" style={{ ...SEL, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Unit</label>
                <input value={aForm.unit} onChange={e => setAForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. followers, ₦, %" style={{ ...SEL, width: "100%" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Target Value</label>
                <input type="number" value={aForm.targetValue} onChange={e => setAForm(f => ({ ...f, targetValue: e.target.value }))} placeholder="e.g. 500" style={{ ...SEL, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tracking Type</label>
                <select value={aForm.metricType} onChange={e => setAForm(f => ({ ...f, metricType: e.target.value as any }))} style={{ ...SEL, width: "100%" }}>
                  <option value="cumulative">📈 Cumulative (adds up)</option>
                  <option value="snapshot">📸 Snapshot (latest value)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
              <strong>Cumulative</strong> - numbers add up (emails sent, clients onboarded, posts published) &nbsp;{" | "}&nbsp; <strong>Snapshot</strong> - latest reading wins (follower count, revenue figure, engagement rate)
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAssign(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={submitAssign} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 11, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Assigning..." : "Assign KPI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Log Progress modal -- */}
      {showLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setShowLog(null); }}>
          <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, padding: "28px 24px 40px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>📊 Log Progress</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              {showLog.metric_name} {" | "} Target: {showLog.target_value} {showLog.unit}
              <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>({showLog.metric_type === "cumulative" ? "adds to total" : "replaces last value"})</span>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              {showLog.metric_type === "cumulative" ? "How many did you achieve? (will be added to your total)" : "What is the current value?"}
            </label>
            <input type="number" value={lForm.value} onChange={e => setLForm(f => ({ ...f, value: e.target.value }))} placeholder={`Enter ${showLog.unit}...`} style={{ ...SEL, width: "100%", marginBottom: 14 }} autoFocus />

            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Note (optional)</label>
            <textarea value={lForm.note} onChange={e => setLForm(f => ({ ...f, note: e.target.value }))} placeholder="Add context about this achievement..." rows={3} style={{ ...SEL, width: "100%", resize: "none", marginBottom: 20 }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLog(null)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={submitLog} disabled={saving || !lForm.value} style={{ flex: 2, padding: "12px", borderRadius: 11, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving || !lForm.value ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Log Progress"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Verdict modal -- */}
      {showVerdict && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setShowVerdict(null); }}>
          <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, padding: "28px 24px 40px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>⚖️ Set Verdict</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>{showVerdict.metric_name} - {kpiCurrentValue(showVerdict, kpiLogs || [])} / {showVerdict.target_value} {showVerdict.unit} achieved</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {Object.entries(VERDICT_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => setVForm(f => ({ ...f, verdict: key }))} style={{
                  padding: "12px 16px", borderRadius: 11, textAlign: "left",
                  border: `2px solid ${vForm.verdict === key ? cfg.color : "#e2e8f0"}`,
                  background: vForm.verdict === key ? cfg.bg : "white",
                  color: vForm.verdict === key ? cfg.color : "#374151",
                  fontWeight: vForm.verdict === key ? 700 : 400, fontSize: 14, cursor: "pointer",
                }}>
                  {cfg.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Feedback / Comment (optional)</label>
            <textarea value={vForm.note} onChange={e => setVForm(f => ({ ...f, note: e.target.value }))} placeholder="Leave a note for the team member..." rows={3} style={{ ...SEL, width: "100%", resize: "none", marginBottom: 20 }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowVerdict(null)} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={submitVerdict} disabled={saving || !vForm.verdict} style={{ flex: 2, padding: "12px", borderRadius: 11, background: B, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving || !vForm.verdict ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Submit Verdict"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Log history modal -- */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setShowHistory(null); }}>
          <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto", padding: "28px 24px 40px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{showHistory.metric_name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Log history {" | "} {monthLabel()}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(kpiLogs || [])
                .filter((l: any) => l.assignment_id === showHistory.id)
                .sort((a: any, b: any) => b.created_at?.localeCompare(a.created_at))
                .map((l: any, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: B }}>{l.value} <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>{showHistory.unit}</span></span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{l.log_date || l.created_at?.split("T")[0]}</span>
                    </div>
                    {l.note && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{l.note}"</div>}
                  </div>
                ))
              }
            </div>
            <button onClick={() => setShowHistory(null)} style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 11, background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// This is the main component
export default function ProwessDashboard({
  currentUser,
  users = [],
  tasks = [],
  logs  = [],
  kpiAssignments = [],
  kpiLogs = [],
  weeklyWinners = [],
  monthlyWinners = [],
  sales = [],
  payroll = [],
  offlineIncome = [],
  offlineOutgoing = [],
  onCreateAssignment,
  onLogKPI,
  onSetVerdict,
  onDeleteAssignment,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onReassignTask,
  onAddLog,
  onDeleteLog,
  onResubmitLog,
  onUpdateProfile,
  onAssignLeader,
  onDisableMember,
  onEnableMember,
  onCreateMember,
  onSignOut,
  onApproveTask,
  onRejectTask,
  onApproveLog,
  onRejectLog,
  onCloseWeek,
  onCloseMonth,
  onLogSale,
  onConfirmSale,
  onRejectSale,
  onMarkCommissionPaid,
  onMarkCommissionUnpaid,
  onToggleCommission,
  onBulkMarkCommissionPaid,
  onMarkTaskAsArticle,
  onUpdateMemberPaySettings,
  onLogPayroll,
  onApprovePayroll,
  onWithholdPayroll,
  onAdjustPayroll,
  onMarkPayrollPaid,
  onMarkPayrollUnpaid,
  onLogOfflineIncome,
  onDeleteOfflineIncome,
  onLogOfflineOutgoing,
  onDeleteOfflineOutgoing,
}: {
  currentUser: any;
  users?: any[];
  tasks?: any[];
  logs?: any[];
  kpiAssignments?: any[];
  kpiLogs?: any[];
  weeklyWinners?: any[];
  monthlyWinners?: any[];
  sales?: any[];
  onCreateAssignment?: (form: any) => Promise<void>;
  onLogKPI?: (form: any) => Promise<void>;
  onSetVerdict?: (form: any) => Promise<void>;
  onDeleteAssignment?: (id: string) => Promise<void>;
  onCreateTask?: (form: any) => Promise<void>;
  onUpdateTaskStatus?: (id: string, status: string, submissionLinks?: any[] | null, resubmitNote?: string | null, assigneeId?: string | null) => Promise<void>;
  onDeleteTask?: (id: string, assigneeId?: string | null) => Promise<void>;
  onReassignTask?: (taskId: string, assigneeIds: string[]) => Promise<void>;
  onAddLog?: (form: any) => Promise<void>;
  onDeleteLog?: (id: string) => Promise<void>;
  onResubmitLog?: (id: string, links: any[]) => Promise<void>;
  onUpdateProfile?: (updates: { full_name: string; job_title: string }) => Promise<void>;
  onAssignLeader?: (memberId: string, leaderId: string | null) => Promise<void>;
  onDisableMember?: (memberId: string, reason: string) => Promise<void>;
  onEnableMember?: (memberId: string, reason: string) => Promise<void>;
  onCreateMember?: (form: any) => Promise<void>;
  onSignOut?: () => void;
  onApproveTask?: (id: string, assigneeId?: string | null) => Promise<void>;
  onRejectTask?: (id: string, note: string, assigneeId?: string | null) => Promise<void>;
  onApproveLog?: (id: string) => Promise<void>;
  onRejectLog?: (id: string, note: string) => Promise<void>;
  onCloseWeek?: (weekStart: string, weekEnd: string, scores: any[]) => Promise<void>;
  onCloseMonth?: (month: string, scores: any[]) => Promise<void>;
  onLogSale?: (form: any) => Promise<void>;
  onConfirmSale?: (id: string) => Promise<void>;
  onRejectSale?: (id: string, note: string) => Promise<void>;
  onMarkCommissionPaid?: (id: string) => Promise<void>;
  onMarkCommissionUnpaid?: (id: string) => Promise<void>;
  onToggleCommission?: (memberId: string, value: boolean) => Promise<void>;
  onBulkMarkCommissionPaid?: (memberIds: string[], month: string) => Promise<void>;
  onMarkTaskAsArticle?: (taskId: string, value: boolean) => Promise<void>;
  onUpdateMemberPaySettings?: (memberId: string, updates: any) => Promise<void>;
  onLogPayroll?: (form: any) => Promise<void>;
  onApprovePayroll?: (id: string) => Promise<void>;
  onWithholdPayroll?: (id: string) => Promise<void>;
  onAdjustPayroll?: (id: string, adjustment: number, note: string) => Promise<void>;
  onMarkPayrollPaid?: (id: string) => Promise<void>;
  onMarkPayrollUnpaid?: (id: string) => Promise<void>;
  onLogOfflineIncome?: (form: any) => Promise<void>;
  onDeleteOfflineIncome?: (id: string) => Promise<void>;
  onLogOfflineOutgoing?: (form: any) => Promise<void>;
  onDeleteOfflineOutgoing?: (id: string) => Promise<void>;
  payroll?: any[];
  offlineIncome?: any[];
  offlineOutgoing?: any[];
}) {
  const [page,        setPage]       = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [localTasks,   setLocalTasks]   = useState(tasks);
  const [localLogs,    setLocalLogs]    = useState(logs);
  const [localKpiA,    setLocalKpiA]    = useState(kpiAssignments);
  const [localKpiL,    setLocalKpiL]    = useState(kpiLogs);
  const [localWinners, setLocalWinners] = useState(weeklyWinners);
  const [localMonthlyWinners, setLocalMonthlyWinners] = useState(monthlyWinners);
  const [localSales,   setLocalSales]   = useState(sales);
  const [localPayroll, setLocalPayroll] = useState(payroll);
  const [localIncome,  setLocalIncome]  = useState(offlineIncome);
  const [localOutgoing, setLocalOutgoing] = useState(offlineOutgoing);
  const isMobile = useIsMobile();

  useEffect(() => setLocalTasks(tasks),          [tasks]);
  useEffect(() => setLocalLogs(logs),            [logs]);
  useEffect(() => setLocalKpiA(kpiAssignments),  [kpiAssignments]);
  useEffect(() => setLocalKpiL(kpiLogs),         [kpiLogs]);
  useEffect(() => setLocalWinners(weeklyWinners),[weeklyWinners]);
  useEffect(() => setLocalMonthlyWinners(monthlyWinners), [monthlyWinners]);
  useEffect(() => setLocalSales(sales),          [sales]);
  useEffect(() => setLocalPayroll(payroll),       [payroll]);
  useEffect(() => setLocalIncome(offlineIncome),  [offlineIncome]);
  useEffect(() => setLocalOutgoing(offlineOutgoing), [offlineOutgoing]);

  const user = normUser(currentUser);

  const approvalCount = (() => {
    if (!user) return 0;
    // Use expandTasksPerAssignee so the count matches what the approvals panel shows
    const expandedTasks = expandTasksPerAssignee(localTasks.map(normTask));
    const pendingLogs   = localLogs.map(normLog).filter((l: any) => l.approvalStatus === "needs-review");
    if (user.role === "admin") {
      const approvableIds = new Set(users.filter((u: any) => u.role !== "admin").map((u: any) => u.id));
      const pendingTasks = expandedTasks.filter((t: any) =>
        t.approvalStatus === "needs-review" && t._singleAssignee && approvableIds.has(t._singleAssignee)
      );
      return pendingTasks.length + pendingLogs.length;
    }
    if (user.role === "leader") {
      const myTeamIds = new Set(users.filter((u: any) => u.managed_by === user.id).map((u: any) => u.id));
      const pendingTasks = expandedTasks.filter((t: any) =>
        t.approvalStatus === "needs-review" && t._singleAssignee && myTeamIds.has(t._singleAssignee)
      );
      return pendingTasks.length + pendingLogs.filter((l: any) => myTeamIds.has(l.userId)).length;
    }
    return 0;
  })();

  const content = () => {
    switch (page) {
      case "dashboard":
        return isPrivileged(user)
          ? <><BirthdayBanner users={users} /><AdminDashboard tasks={localTasks} logs={localLogs} users={users} kpiAssignments={localKpiA} kpiLogs={localKpiL} weeklyWinners={localWinners} monthlyWinners={localMonthlyWinners} setPage={setPage} /></>
          : <><BirthdayBanner users={users} /><MemberDashboard user={user} tasks={localTasks} logs={localLogs} users={users} kpiAssignments={localKpiA} kpiLogs={localKpiL} weeklyWinners={localWinners} monthlyWinners={localMonthlyWinners} setPage={setPage} /></>;
      case "kpi":
        return <KPIPage
          user={user} users={users}
          kpiAssignments={localKpiA} kpiLogs={localKpiL}
          onCreateAssignment={async (form: any) => {
            await onCreateAssignment?.(form);
            const temp = { id: "tmp-" + Date.now(), ...form, verdict: null, created_at: new Date().toISOString() };
            setLocalKpiA((prev: any) => [...(prev || []), temp]);
          }}
          onLogKPI={async (form: any) => {
            await onLogKPI?.(form);
            const temp = { id: "tmp-" + Date.now(), ...form, log_date: fmt(today), created_at: new Date().toISOString() };
            setLocalKpiL((prev: any) => [...(prev || []), temp]);
          }}
          onSetVerdict={async (form: any) => {
            await onSetVerdict?.(form);
            setLocalKpiA((prev: any) => (prev || []).map((a: any) => a.id === form.id ? { ...a, verdict: form.verdict, verdict_note: form.verdict_note } : a));
          }}
          onDeleteAssignment={async (id: string) => {
            await onDeleteAssignment?.(id);
            setLocalKpiA((prev: any) => (prev || []).filter((a: any) => a.id !== id));
          }}
        />;
      case "commission":
        return <CommissionPage
          user={user} users={users} sales={localSales}
          onLogSale={async (form: any) => {
            await onLogSale?.(form);
            const temp = {
              id: "tmp-" + Date.now(), ...form,
              status: (user.role === "admin" && form.member_id !== user.id) ? "confirmed" : "pending",
              payout_status: "unpaid",
              commission_amount: (parseFloat(form.sale_amount) * 0.01).toFixed(2),
              created_at: new Date().toISOString(),
            };
            setLocalSales((prev: any) => [temp, ...prev]);
          }}
          onConfirmSale={async (id: string) => {
            await onConfirmSale?.(id);
            setLocalSales((prev: any) => prev.map((s: any) => s.id === id ? { ...s, status: "confirmed" } : s));
          }}
          onRejectSale={async (id: string, note: string) => {
            await onRejectSale?.(id, note);
            setLocalSales((prev: any) => prev.map((s: any) => s.id === id ? { ...s, status: "rejected", rejection_note: note } : s));
          }}
          onMarkPaid={async (id: string) => {
            await onMarkCommissionPaid?.(id);
            setLocalSales((prev: any) => prev.map((s: any) => s.id === id ? { ...s, payout_status: "paid" } : s));
          }}
          onMarkUnpaid={async (id: string) => {
            await onMarkCommissionUnpaid?.(id);
            setLocalSales((prev: any) => prev.map((s: any) => s.id === id ? { ...s, payout_status: "unpaid" } : s));
          }}
          onBulkMarkPaid={async (memberIds: string[], month: string) => {
            await onBulkMarkCommissionPaid?.(memberIds, month);
            setLocalSales((prev: any) => prev.map((s: any) =>
              memberIds.includes(s.member_id) && s.status === "confirmed" && s.payout_status === "unpaid" && s.sale_date.slice(0, 7) === month
                ? { ...s, payout_status: "paid" } : s
            ));
          }}
        />;
      case "payroll":
        return <PayrollPage
          user={user} users={users} tasks={localTasks} payroll={localPayroll}
          onLogPayroll={async (form: any) => {
            await onLogPayroll?.(form);
            const tmp = { id: "tmp-" + Date.now(), ...form, status: "pending", payout_status: "unpaid", created_at: new Date().toISOString() };
            setLocalPayroll((p: any) => [tmp, ...p]);
          }}
          onApprovePayroll={async (id: string) => {
            await onApprovePayroll?.(id);
            setLocalPayroll((p: any) => p.map((e: any) => e.id === id ? { ...e, status: "approved" } : e));
          }}
          onWithholdPayroll={async (id: string) => {
            await onWithholdPayroll?.(id);
            setLocalPayroll((p: any) => p.map((e: any) => e.id === id ? { ...e, status: "withheld" } : e));
          }}
          onAdjustPayroll={async (id: string, adj: number, note: string) => {
            await onAdjustPayroll?.(id, adj, note);
            setLocalPayroll((p: any) => p.map((e: any) => e.id === id ? { ...e, adjustment: adj, adjustment_note: note } : e));
          }}
          onMarkPayrollPaid={async (id: string) => {
            await onMarkPayrollPaid?.(id);
            setLocalPayroll((p: any) => p.map((e: any) => e.id === id ? { ...e, payout_status: "paid" } : e));
          }}
          onMarkPayrollUnpaid={async (id: string) => {
            await onMarkPayrollUnpaid?.(id);
            setLocalPayroll((p: any) => p.map((e: any) => e.id === id ? { ...e, payout_status: "unpaid" } : e));
          }}
        />;
      case "finance":
        return user.role === "admin" ? <FinancePage
          user={user} users={users} sales={localSales}
          payroll={localPayroll} offlineIncome={localIncome}
          offlineOutgoing={localOutgoing}
          onLogOfflineIncome={async (form: any) => {
            await onLogOfflineIncome?.(form);
            const tmp = { id: "tmp-" + Date.now(), ...form, created_at: new Date().toISOString() };
            setLocalIncome((p: any) => [tmp, ...p]);
          }}
          onDeleteOfflineIncome={async (id: string) => {
            await onDeleteOfflineIncome?.(id);
            setLocalIncome((p: any) => p.filter((e: any) => e.id !== id));
          }}
          onLogOfflineOutgoing={async (form: any) => {
            await onLogOfflineOutgoing?.(form);
            const tmp = { id: "tmp-" + Date.now(), ...form, created_at: new Date().toISOString() };
            setLocalOutgoing((p: any) => [tmp, ...p]);
          }}
          onDeleteOfflineOutgoing={async (id: string) => {
            await onDeleteOfflineOutgoing?.(id);
            setLocalOutgoing((p: any) => p.filter((e: any) => e.id !== id));
          }}
          /> : null;
          case "tasks":
            return <TasksPage user={user} tasks={localTasks} setTasks={setLocalTasks} users={users} onCreateTask={onCreateTask} onUpdateTaskStatus={onUpdateTaskStatus} onDeleteTask={onDeleteTask} onApproveTask={onApproveTask} onRejectTask={onRejectTask} onReassignTask={async (taskId: string, newIds: string[]) => { await onReassignTask?.(taskId, newIds); setLocalTasks((p: any[]) => p.map((t: any) => t.id === taskId ? { ...t, assigned_to: newIds[0] ?? null, assignees: newIds, task_assignments: newIds.map((uid: string) => ({ user_id: uid })) } : t)); }} />;
          case "activity":
        return <ActivityLogPage user={user} users={users} logs={localLogs} setLogs={setLocalLogs} onAddLog={onAddLog} onDeleteLog={onDeleteLog} onResubmitLog={onResubmitLog} />;
      case "leaderboard":
        return <LeaderboardPage tasks={localTasks} logs={localLogs} users={users} user={user} weeklyWinners={localWinners} monthlyWinners={localMonthlyWinners} onCloseWeek={async (ws: string, we: string, sc: any[]) => { await onCloseWeek?.(ws, we, sc); }} onCloseMonth={async (month: string, sc: any[]) => { await onCloseMonth?.(month, sc); }} />;
      case "reports":

        return <ReportsPage tasks={localTasks} logs={localLogs} users={users} user={user} />;
      case "team":
        return isPrivileged(user) ? <TeamPage users={users} user={user} tasks={localTasks} logs={localLogs} onCreateMember={onCreateMember} onAssignLeader={onAssignLeader} onDisableMember={onDisableMember} onEnableMember={onEnableMember} onToggleCommission={onToggleCommission} onUpdateMemberPaySettings={onUpdateMemberPaySettings} /> : null;
      case "settings":
        return <SettingsPage user={user} onUpdateProfile={onUpdateProfile} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", height: isMobile ? "100svh" : "100vh", background: "#f0f4f5", fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <GlobalStyles />

      {/* Mobile slide-out drawer */}
      {isMobile && (
        <MobileDrawer
          user={user} page={page} setPage={setPage}
          onLogout={onSignOut} open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          approvalCount={approvalCount}
          setApprovalsOpen={setApprovalsOpen}
        />
      )}

      {/* Desktop sidebar - hidden on mobile */}
      {!isMobile && (
        <Sidebar user={user} page={page} setPage={setPage} onLogout={onSignOut} open={sidebarOpen} setOpen={setSidebarOpen} approvalCount={approvalCount} setApprovalsOpen={setApprovalsOpen} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopBar user={user} page={page} isMobile={isMobile} onMenuOpen={() => setDrawerOpen(true)} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {content()}
        </div>
      </div>

      {/* Approvals modal - sits on top of any page */}
      {approvalsOpen && isPrivileged(user) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 0 }}>
          <div style={{
            width: "min(520px, 100vw)", height: "100vh", background: "#f8fafc",
            display: "flex", flexDirection: "column", overflowY: "auto",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
            animation: "slideInRight 0.22s ease",
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Modal header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>🔍 Approvals</div>
                {approvalCount > 0 && (
                  <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginTop: 2 }}>{approvalCount} item{approvalCount !== 1 ? "s" : ""} pending review</div>
                )}
              </div>
              <button onClick={() => setApprovalsOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: "#64748b", fontWeight: 700 }}>
                ✕
              </button>
            </div>
            <ApprovalPage
              user={user} tasks={localTasks} logs={localLogs} users={users}
              onMarkTaskAsArticle={async (taskId: string, value: boolean) => {
                await onMarkTaskAsArticle?.(taskId, value);
                setLocalTasks((p: any[]) => p.map((t: any) => t.id === taskId ? { ...t, is_article: value } : t));
              }}
              onApproveTask={async (id: string, assigneeId?: string | null) => {
                await onApproveTask?.(id, assigneeId);
                setLocalTasks((p: any[]) => p.map((t: any) => t.id === id ? {
                  ...t,
                  ...((!assigneeId || (t.task_assignments || []).length <= 1) ? { approval_status: "approved", approval_note: null } : {}),
                  task_assignments: (t.task_assignments || []).map((a: any) =>
                    a.user_id === assigneeId ? { ...a, approval_status: "approved", approval_note: null } : a
                  ),
                } : t));
              }}
              onRejectTask={async (id: string, note: string, assigneeId?: string | null) => {
                await onRejectTask?.(id, note, assigneeId);
                setLocalTasks((p: any[]) => p.map((t: any) => t.id === id ? {
                  ...t,
                  ...((!assigneeId || (t.task_assignments || []).length <= 1) ? { approval_status: "rejected", approval_note: note } : {}),
                  task_assignments: (t.task_assignments || []).map((a: any) =>
                    a.user_id === assigneeId ? { ...a, approval_status: "rejected", approval_note: note } : a
                  ),
                } : t));
              }}
              onApproveLog={async (id: string) => {
                await onApproveLog?.(id);
                setLocalLogs((p: any[]) => p.map((l: any) => l.id === id ? { ...l, approval_status: "approved" } : l));
              }}
              onRejectLog={async (id: string, note: string) => {
                await onRejectLog?.(id, note);
                setLocalLogs((p: any[]) => p.map((l: any) => l.id === id ? { ...l, approval_status: "rejected", approval_note: note } : l));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
