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
    .prowess-actform  { width: 100% !important; position: static !important; }
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

const normTask = (t: any) => t ? ({
  ...t,
  assignedTo:      t.assigned_to      ?? t.assignedTo      ?? null,
  completedAt:     t.completed_at     ?? t.completedAt     ?? null,
  links:           t.links            ?? [],
  submission_links: t.submission_links ?? [],
}) : null;

const normLog = (l: any) => l ? ({
  ...l,
  userId:    l.user_id    ?? l.userId    ?? "",
  taskTitle: l.task_title ?? l.taskTitle ?? "",
  timeSpent: l.time_spent ?? l.timeSpent ?? 0,
  date:      l.log_date   ?? l.date      ?? "",
  links:     l.links      ?? [],
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

function isStaff(u: any) { return u.role === "member" || u.role === "leader"; }
function isPrivileged(u: any) { return u.role === "admin" || u.role === "leader"; }

function computeScores(tasks: any[], logs: any[], users: any[]) {
  return users
    .filter(u => isStaff(u))
    .map(u => {
      const nu = normUser(u);
      let pts = 0;
      const ut = tasks.map(normTask).filter(t => t.assignedTo === u.id);
      ut.forEach(t => {
        if (t.status === "completed") {
          pts += 10;
          if (t.completedAt && t.deadline && t.completedAt <= t.deadline) pts += 5;
        } else if (t.deadline && t.deadline < fmt(today)) {
          pts -= 3;
        }
      });
      const ul = logs.map(normLog).filter(l => l.userId === u.id);
      pts += ul.length * 2;
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
  { id: "reports",     label: "Reports",      icon: "📊", privileged: true },
  { id: "team",        label: "Team",         icon: "👥", privileged: true },
  { id: "settings",    label: "Settings",     icon: "⚙️" },
];

// --- Mobile drawer (slides in from left) --------------------------------------
function MobileDrawer({ user, page, setPage, onLogout, open, onClose }: any) {
  const items = NAV.filter(n => !n.privileged || isPrivileged(user));
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
                {on && <div style={{ width: 6, height: 6, borderRadius: "50%", background: B }} />}
              </button>
            );
          })}
        </nav>

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
function Sidebar({ user, page, setPage, onLogout, open, setOpen }: any) {
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
        {NAV.filter(n => !n.privileged || isPrivileged(user)).map(n => {
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
              {open && <span>{n.label}</span>}
              {open && on && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: B, flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

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

function AdminDashboard({ tasks, logs, users, kpiAssignments, kpiLogs, setPage }: any) {
  const scores  = useMemo(() => computeScores(tasks, logs, users), [tasks, logs, users]);
  const total     = tasks.length;
  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const inProg    = tasks.filter((t: any) => t.status === "in-progress").length;
  const overdue   = tasks.filter((t: any) => t.deadline && t.deadline < fmt(today) && t.status !== "completed").length;

  const weekBar = [
    { day: "Mon", tasks: 3 }, { day: "Tue", tasks: 5 }, { day: "Wed", tasks: 4 },
    { day: "Thu", tasks: 7 }, { day: "Fri", tasks: 6 }, { day: "Sat", tasks: 2 }, { day: "Sun", tasks: 1 },
  ];
  const pie = [
    { name: "Completed",   value: completed,                       color: "#22c55e" },
    { name: "In Progress", value: inProg,                          color: "#3b82f6" },
    { name: "Pending",     value: total - completed - inProg,      color: "#cbd5e1" },
  ];
  const recent = [...logs].map(normLog).sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 5);

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

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Stat icon="📋" label="Total Tasks"  value={total}     sub="This month"   color="#6366f1" trend={12} />
        <Stat icon="✅" label="Completed"    value={completed} sub={`${total ? Math.round(completed / total * 100) : 0}% rate`} color="#22c55e" trend={8} />
        <Stat icon="🔄" label="In Progress"  value={inProg}    sub="Active now"   color="#3b82f6" />
        <Stat icon="⚠️" label="Overdue"      value={overdue}   sub="Need attention" color="#ef4444" trend={-5} />
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

function MemberDashboard({ user, tasks, logs, kpiAssignments, kpiLogs, setPage }: any) {
  const myT  = tasks.map(normTask).filter((t: any) => t.assignedTo === user.id);
  const myL  = logs.map(normLog).filter((l: any) => l.userId === user.id);
  const done = myT.filter((t: any) => t.status === "completed").length;
  const od   = myT.filter((t: any) => t.deadline && t.deadline < fmt(today) && t.status !== "completed").length;

  let pts = 0;
  myT.forEach((t: any) => {
    if (t.status === "completed") { pts += 10; if (t.completedAt && t.completedAt <= t.deadline) pts += 5; }
    else if (t.deadline && t.deadline < fmt(today)) pts -= 3;
  });
  pts = Math.max(0, pts + myL.length * 2);
  const prog = myT.length ? Math.round(done / myT.length * 100) : 0;

  // -- KPI snapshot ----------------------------------------------------------
  const thisMonth   = fmt(today).slice(0, 7);
  const myKpis      = (kpiAssignments || []).filter((a: any) => a.assigned_to === user.id && a.month === thisMonth);
  const kpiOnTrack  = myKpis.filter((a: any) => kpiPct(kpiCurrentValue(a, kpiLogs || []), a.target_value) >= 50).length;
  const kpiUnlogged = myKpis.filter((a: any) => !(kpiLogs || []).some((l: any) => l.assignment_id === a.id)).length;

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Stat icon="📋" label="Assigned Tasks" value={myT.length} color="#6366f1" />
        <Stat icon="✅" label="Completed"      value={done}        color="#22c55e" />
        <Stat icon="⚡" label="My Score"       value={`${pts}pt`}  sub="Productivity" color={B} />
        <Stat icon="⚠️" label="Overdue"        value={od}          color="#ef4444" />
      </div>

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
            {myT.filter((t: any) => t.status !== "completed")
              .sort((a: any, b: any) => (a.deadline || "").localeCompare(b.deadline || ""))
              .slice(0, 5)
              .map((task: any) => (
                <div key={task.id} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #f1f5f9", background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{task.title}</div>
                    <Pill type="priority" value={task.priority} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Pill type="status" value={task.status} />
                    <span style={{ fontSize: 11, color: task.deadline < fmt(today) ? "#ef4444" : "#94a3b8" }}>
                      📅 {task.deadline}
                    </span>
                  </div>
                </div>
              ))}
            {myT.filter((t: any) => t.status !== "completed").length === 0 && (
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
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{log.taskTitle}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{log.timeSpent}h</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.description}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {log.project && <>{log.project} {" | "}</>}
                  {fmtTime(log.created_at) || log.date}
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

function TaskDetailModal({ task, users, user, onClose, onUpdate, onDelete }: any) {
  const asgn = normUser(users.find((u: any) => u.id === task.assignedTo));
  const late = task.deadline < fmt(today) && task.status !== "completed";
  const [subLinks, setSubLinks] = useState<{ label: string; url: string }[]>([]);

  const STATUS_ORDER = ["pending", "in-progress", "completed"];
  const currentIdx = STATUS_ORDER.indexOf(task.status);

  const handleStatusUpdate = (s: string) => {
    const validLinks = subLinks.filter(l => l.url.trim());
    onUpdate(task.id, s, validLinks.length ? validLinks : null);
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
            ["Assigned To", asgn ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Av user={asgn} size={20} /><span style={{ fontSize: 13 }}>{asgn.name}</span></div> : <span style={{ fontSize: 13, color: "#94a3b8" }}>Unassigned</span>],
            ["Created",    <span style={{ fontSize: 13, color: "#374151" }}>{task.created_at ? task.created_at.slice(0, 10) : ""}</span>],
          ].map(([label, val]) => (
            <div key={label as string} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
              <div>{val}</div>
            </div>
          ))}
        </div>

        {/* Submission links - member can attach URLs before marking complete */}
        {task.status !== "completed" && (
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
          {!isPrivileged(user) && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Only admins and leaders can move a task backwards</div>}
        </div>

        {user.role === "admin" && (
          <button onClick={() => { onDelete(task.id); onClose(); }} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Delete Task
          </button>
        )}
      </Card>
    </div>
  );
}

function TasksPage({ user, tasks, setTasks, users, onCreateTask, onUpdateTaskStatus, onDeleteTask }: any) {
  const [modal,      setModal]      = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [fStat,      setFStat]      = useState("all");
  const [fPri,       setFPri]       = useState("all");
  const [form,       setForm]       = useState({ title: "", description: "", assignedTo: "", priority: "medium", project: "", deadline: "" });
  const [links,      setLinks]      = useState<{ label: string; url: string }[]>([]);

  const normTasks = tasks.map(normTask);
  const base = user.role === "admin"
    ? normTasks
    : user.role === "leader"
      ? normTasks.filter((t: any) => {
          const assignee = users.find((u: any) => u.id === t.assignedTo);
          return t.assignedTo === user.id || (assignee && assignee.managed_by === user.id);
        })
      : normTasks.filter((t: any) => t.assignedTo === user.id);
  const filtered  = base.filter((t: any) =>
    (fStat === "all" || t.status === fStat) && (fPri === "all" || t.priority === fPri)
  );

  const upd = (id: string, s: string, submissionLinks?: any[] | null) => {
    if (onUpdateTaskStatus) onUpdateTaskStatus(id, s, submissionLinks);
    else setTasks((p: any[]) => p.map(t => t.id === id ? { ...t, status: s, ...(submissionLinks ? { submission_links: submissionLinks } : {}) } : t));
  };
  const del = (id: string) => {
    if (onDeleteTask) onDeleteTask(id);
    else setTasks((p: any[]) => p.filter(t => t.id !== id));
  };
  const create = async () => {
    if (!form.title || !form.assignedTo) return;
    const validLinks = links.filter(l => l.url.trim());
    if (onCreateTask) await onCreateTask({ ...form, links: validLinks });
    else setTasks((p: any[]) => [...p, { id: "t" + Date.now(), ...form, links: validLinks, assigned_to: form.assignedTo, status: "pending", created_at: fmt(today) }]);
    setForm({ title: "", description: "", assignedTo: "", priority: "medium", project: "", deadline: "" });
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
        <select value={fStat} onChange={e => setFStat(e.target.value)} style={SEL}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={fPri} onChange={e => setFPri(e.target.value)} style={SEL}>
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
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
        {filtered.map((task: any) => {
          const asgn = normUser(users.find((u: any) => u.id === task.assignedTo));
          const late = task.deadline < fmt(today) && task.status !== "completed";
          return (
            <Card key={task.id}
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
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>📁 {task.project}</span>
                    <span style={{ fontSize: 12, color: late ? "#ef4444" : "#94a3b8" }}>📅 {task.deadline}</span>
                    {asgn && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Av user={asgn} size={18} />
                        <span style={{ fontSize: 12, color: "#64748b" }}>{asgn.name}</span>
                      </div>
                    )}
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

      {/* Task detail modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          user={user}
          onClose={() => setDetailTask(null)}
          onUpdate={upd}
          onDelete={del}
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

            {/* Assign + Priority side by side */}
            <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Assign To</label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                  <option value="">Select member</option>
                  {users.filter((u: any) => isStaff(u)).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name ?? u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
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

function LogDetailModal({ log, users, onClose, onDelete }: any) {
  const lu = normUser(users.find((u: any) => u.id === log.userId));
  const cs = log.completion_status;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ padding: 32, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{log.taskTitle}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", padding: 4 }}>✕</button>
        </div>

        {lu && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: B + "0d", borderRadius: 12, marginBottom: 20 }}>
            <Av user={lu} size={36} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{lu.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{lu.title || "Team Member"}</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 22, padding: "14px 16px", background: "#f8fafc", borderRadius: 12 }}>
          {log.description}
        </div>

        <div className="prowess-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: log.links?.length ? 16 : 24 }}>
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

        {log.links && log.links.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Attached Links</div>
            <LinkDisplay links={log.links} />
          </div>
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

function ActivityLogPage({ user, users, logs, setLogs, onAddLog, onDeleteLog }: any) {
  const [form, setForm] = useState({ taskTitle: "", description: "", project: "", timeSpent: "", completionStatus: "in-progress" });
  const [logLinks, setLogLinks] = useState<{ label: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [detailLog, setDetailLog] = useState<any>(null);
  const normLogs = logs.map(normLog);
  const visible = user.role === "admin"
    ? normLogs
    : user.role === "leader"
      ? normLogs.filter((l: any) => {
          const member = users.find((u: any) => u.id === l.userId);
          return l.userId === user.id || (member && member.managed_by === user.id);
        })
      : normLogs.filter((l: any) => l.userId === user.id);
  const sorted   = [...visible].sort((a: any, b: any) => b.date.localeCompare(a.date));

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
  };

  const deleteLog = (id: string) => {
    if (onDeleteLog) onDeleteLog(id);
    else setLogs((p: any[]) => p.filter((l: any) => l.id !== id));
  };

  const grp: Record<string, any[]> = {};
  sorted.forEach((l: any) => { (grp[l.date] = grp[l.date] || []).push(l); });

  const yesterday = fmt(new Date(today.getTime() - 86400000));

  return (
    <div className="prowess-page-pad prowess-actlog" style={{ padding: "24px 28px", display: "flex", gap: 22 }}>
      {(user.role === "member" || user.role === "leader") && (
        <div className="prowess-actform" style={{ width: 320, flexShrink: 0 }}>
          <Card style={{ padding: 24, position: "sticky", top: 82 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Log Today&apos;s Work</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Task Title</label>
              <input value={form.taskTitle} onChange={e => setForm(f => ({ ...f, taskTitle: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>What did you do?</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Project</label>
              <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Time Spent (hrs)</label>
              <input type="number" value={form.timeSpent} onChange={e => setForm(f => ({ ...f, timeSpent: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }} />
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

            <button onClick={add} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 10, background: saving ? "#94a3b8" : B, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
              {saving ? "Saving..." : "Log Activity"}
            </button>
          </Card>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {Object.keys(grp).length === 0 && (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
            <div style={{ color: "#94a3b8" }}>No activity logged yet</div>
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
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              🕐 {fmtTime(log.created_at)}
                            </div>
                          )}
                          {log.completion_status && (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                              background: log.completion_status === "completed" ? "#f0fdf4" : log.completion_status === "blocked" ? "#fef2f2" : "#eff6ff",
                              color: log.completion_status === "completed" ? "#22c55e" : log.completion_status === "blocked" ? "#ef4444" : "#3b82f6" }}>
                              {log.completion_status === "completed" ? "Completed" : log.completion_status === "blocked" ? "Blocked" : "In Progress"}
                            </span>
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
      </div>

      {detailLog && (
        <LogDetailModal
          log={detailLog}
          users={users}
          onClose={() => setDetailLog(null)}
          onDelete={isPrivileged(user) ? deleteLog : undefined}
        />
      )}
    </div>
  );
}

function LeaderboardPage({ tasks, logs, users }: any) {
  const sc = useMemo(() => computeScores(tasks, logs, users), [tasks, logs, users]);
  const [top, ...rest] = sc;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      {top && (
        <Card style={{ padding: 32, background: `linear-gradient(135deg,${B}12,#e8f4f5)`, borderColor: B + "30", marginBottom: 22, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 14 }}>
            Team Member of the Week
          </div>
          <Av user={users.find((u: any) => u.id === top.userId)} size={64} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 12 }}>{top.name}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{top.title}</div>
          <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 18 }}>
            {([["Points", top.score, B], ["Tasks", top.tasksCompleted, "#22c55e"], ["Logs", top.logsCount, "#6366f1"]] as const).map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: c as string }}>{v as number}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Full Rankings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sc.map((s: any, i: number) => {
            const u = users.find((u: any) => u.id === s.userId);
            const max = sc[0]?.score || 1;
            return (
              <div key={s.userId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: i === 0 ? "#fffbeb" : "#fafafa", border: i === 0 ? "1px solid #fde68a" : "1px solid #f1f5f9" }}>
                <div style={{ fontSize: i < 3 ? 22 : 16, fontWeight: 700, width: 32, textAlign: "center", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2f" : "#cbd5e1" }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <Av user={u} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 6, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(s.score / max) * 100}%`, background: i === 0 ? "#f59e0b" : B, borderRadius: 6 }} />
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
      </Card>
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
  const normT   = tasks.map(normTask);
  const normL   = logs.map(normLog);

  const byMember = members.map((u: any) => {
    const nu = normUser(u);
    return {
      name:      nu.name.split(" ")[0],
      completed: normT.filter((t: any) => t.assignedTo === u.id && t.status === "completed").length,
      total:     normT.filter((t: any) => t.assignedTo === u.id).length,
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
      const completedInWeek = tasks.filter((t: any) =>
        t.status === "completed" && t.completed_at &&
        t.completed_at.slice(0, 10) >= ws && t.completed_at.slice(0, 10) <= we
      ).length;
      const logsInWeek = normL.filter((l: any) => l.date >= ws && l.date <= we).length;
      weeks.push({ week: `W${6 - w}`, score: completedInWeek * 10 + logsInWeek * 2 });
    }
    return weeks;
  }, [tasks, normL]);

  const compl  = tasks.filter((t: any) => t.status === "completed").length;
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

function TeamPage({ users, user, onCreateMember, onAssignLeader }: any) {
  const [modal,  setModal]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [done,   setDone]   = useState(false);
  const [form,   setForm]   = useState({ fullName: "", email: "", password: "", jobTitle: "", role: "member" });

  async function add() {
    if (!form.fullName || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreateMember(form);
      setDone(true);
      setTimeout(() => { setDone(false); setModal(false); setForm({ fullName: "", email: "", password: "", jobTitle: "", role: "member" }); }, 1500);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  return (
    <div className="prowess-page-pad" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>{users.length} members total</div>
        {user?.role === "admin" && (
          <button onClick={() => { setModal(true); setError(""); setDone(false); }}
            style={{ padding: "10px 18px", borderRadius: 10, background: B, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Add Team Member
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
        {users.map((u: any) => {
          const nu = normUser(u);
          const leaders = users.filter((x: any) => x.role === "leader");
          const assignedLeader = u.managed_by ? normUser(users.find((x: any) => x.id === u.managed_by)) : null;
          return (
            <Card key={u.id} style={{ padding: 24, textAlign: "center" }}>
              <Av user={u} size={54} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 12 }}>{nu.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{nu.title || (u.role === "admin" ? "Administrator" : u.role === "leader" ? "Team Leader" : "Team Member")}</div>
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20,
                background: u.role === "admin" ? B + "18" : u.role === "leader" ? "#fef9c3" : "#f1f5f9",
                color: u.role === "admin" ? B : u.role === "leader" ? "#b45309" : "#64748b" }}>
                {u.role === "admin" ? "Admin" : u.role === "leader" ? "Leader" : "Member"}
              </span>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{u.email}</div>

              {/* Assign leader - admin only, only for non-admin users */}
              {user.role === "admin" && u.role !== "admin" && leaders.length > 0 && (
                <div style={{ marginTop: 14, textAlign: "left" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>
                    Team Leader
                  </label>
                  <select
                    value={u.managed_by || ""}
                    onChange={e => onAssignLeader?.(u.id, e.target.value || null)}
                    style={{ ...SEL, width: "100%", fontSize: 13 }}
                  >
                    <option value="">-- No leader assigned --</option>
                    {leaders.map((l: any) => (
                      <option key={l.id} value={l.id}>{normUser(l).name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show assigned leader for non-admin view */}
              {user.role !== "admin" && assignedLeader && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                  Leader: <strong>{assignedLeader.name}</strong>
                </div>
              )}
            </Card>
          );
        })}
      </div>

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

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...SEL, width: "100%" }}>
                    <option value="member">Team Member</option>
                    <option value="leader">Team Leader</option>
                    <option value="admin">Admin</option>
                  </select>
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
            : visibleUsers.map((u: any) => <MemberKPICard key={u.id} member={u} />)
          }
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
  onCreateAssignment,
  onLogKPI,
  onSetVerdict,
  onDeleteAssignment,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onAddLog,
  onDeleteLog,
  onUpdateProfile,
  onAssignLeader,
  onCreateMember,
  onSignOut,
}: {
  currentUser: any;
  users?: any[];
  tasks?: any[];
  logs?: any[];
  kpiAssignments?: any[];
  kpiLogs?: any[];
  onCreateAssignment?: (form: any) => Promise<void>;
  onLogKPI?: (form: any) => Promise<void>;
  onSetVerdict?: (form: any) => Promise<void>;
  onDeleteAssignment?: (id: string) => Promise<void>;
  onCreateTask?: (form: any) => Promise<void>;
  onUpdateTaskStatus?: (id: string, status: string, submissionLinks?: any[] | null) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
  onAddLog?: (form: any) => Promise<void>;
  onDeleteLog?: (id: string) => Promise<void>;
  onUpdateProfile?: (updates: { full_name: string; job_title: string }) => Promise<void>;
  onCreateMember?: (form: any) => Promise<void>;
  onSignOut?: () => void;
}) {
  const [page,        setPage]       = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [localTasks,  setLocalTasks]  = useState(tasks);
  const [localLogs,   setLocalLogs]   = useState(logs);
  const [localKpiA,   setLocalKpiA]   = useState(kpiAssignments);
  const [localKpiL,   setLocalKpiL]   = useState(kpiLogs);
  const isMobile = useIsMobile();

  useEffect(() => setLocalTasks(tasks),         [tasks]);
  useEffect(() => setLocalLogs(logs),           [logs]);
  useEffect(() => setLocalKpiA(kpiAssignments), [kpiAssignments]);
  useEffect(() => setLocalKpiL(kpiLogs),        [kpiLogs]);

  const user = normUser(currentUser);

  const content = () => {
    switch (page) {
      case "dashboard":
        return isPrivileged(user)
          ? <AdminDashboard tasks={localTasks} logs={localLogs} users={users} kpiAssignments={localKpiA} kpiLogs={localKpiL} setPage={setPage} />
          : <MemberDashboard user={user} tasks={localTasks} logs={localLogs} kpiAssignments={localKpiA} kpiLogs={localKpiL} setPage={setPage} />;
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
      case "tasks":
        return <TasksPage user={user} tasks={localTasks} setTasks={setLocalTasks} users={users} onCreateTask={onCreateTask} onUpdateTaskStatus={onUpdateTaskStatus} onDeleteTask={onDeleteTask} />;
      case "activity":
        return <ActivityLogPage user={user} users={users} logs={localLogs} setLogs={setLocalLogs} onAddLog={onAddLog} onDeleteLog={onDeleteLog} />;
      case "leaderboard":
        return <LeaderboardPage tasks={localTasks} logs={localLogs} users={users} />;
      case "reports":
        return <ReportsPage tasks={localTasks} logs={localLogs} users={users} user={user} />;
      case "team":
        return isPrivileged(user) ? <TeamPage users={users} user={user} onCreateMember={onCreateMember} onAssignLeader={onAssignLeader} /> : null;
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
        />
      )}

      {/* Desktop sidebar - hidden on mobile */}
      {!isMobile && (
        <Sidebar user={user} page={page} setPage={setPage} onLogout={onSignOut} open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopBar user={user} page={page} isMobile={isMobile} onMenuOpen={() => setDrawerOpen(true)} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {content()}
        </div>
      </div>
    </div>
  );
}
