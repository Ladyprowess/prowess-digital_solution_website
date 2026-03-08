"use client";
import { useState, useEffect, useCallback } from "react";

const B = "#507c80", DARK = "#3a5c60", MID = "#6a9ea3", LITE = "#e8f4f5";
const LGRAY = "#f2f5f5", MGRAY = "#c8d8da", W = "#fff";

type ClientStatus = "active" | "forever" | "revoked" | "expired";
type AccessType = "1year" | "forever";
type Action = "revoke" | "restore" | "extend" | "forever" | "set1year";

interface Client {
  id: string; code: string; name: string; phone: string | null;
  email: string | null; business: string | null; notes: string | null;
  type: AccessType; status: "active" | "revoked";
  created_at: number; expires_at: number | null;
}

const fmtDate = (ts: number | null) =>
  ts ? new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

function getStatus(c: Client): ClientStatus {
  if (c.status === "revoked") return "revoked";
  if (c.type === "forever") return "forever";
  if (c.expires_at && Date.now() > c.expires_at) return "expired";
  return "active";
}

const SBadge: Record<ClientStatus, { bg: string; color: string; label: string }> = {
  active:  { bg: "#e8f5e9", color: "#2e7d32", label: "Active" },
  forever: { bg: "#e3f2fd", color: "#1565c0", label: "Forever" },
  revoked: { bg: "#fdecea", color: "#c0392b", label: "Revoked" },
  expired: { bg: "#fff3e0", color: "#e65100", label: "Expired" },
};

function Badge({ status }: { status: ClientStatus }) {
  const s = SBadge[status];
  return <span style={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ background: copied ? "#e8f5e9" : "transparent", border: `1px solid ${copied ? "#a5d6a7" : MGRAY}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: copied ? "#2e7d32" : MID, cursor: "pointer" }}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CreateModal({ token, onSave, onClose }: { token: string; onSave: (c: Client) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", business: "", notes: "", type: "1year" as AccessType });
  const [saving, setSaving] = useState(false);
  const f = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(x => ({ ...x, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSave(await res.json()); onClose(); }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: W, borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 480, maxHeight: "95vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: DARK }}>Register New Client</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#aaa" }}>x</button>
        </div>
        {(["Full Name *", "Phone Number", "Email", "Business Name"] as const).map((l, i) => {
          const keys = ["name", "phone", "email", "business"] as const;
          const types = ["text", "tel", "email", "text"];
          const k = keys[i];
          return (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block", marginBottom: 4 }}>{l}</label>
              <input type={types[i]} value={form[k]} onChange={e => f(k, e.target.value)}
                placeholder={l.replace(" *", "")}
                style={{ padding: "9px 12px", border: `1.5px solid ${MGRAY}`, borderRadius: 8, fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" }} />
            </div>
          );
        })}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block", marginBottom: 6 }}>Access Duration</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["1year", "forever"] as AccessType[]).map(v => (
              <div key={v} onClick={() => f("type", v)} style={{ padding: "11px 13px", border: `2px solid ${form.type === v ? B : MGRAY}`, borderRadius: 10, cursor: "pointer", background: form.type === v ? LITE : W }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.type === v ? DARK : "#999" }}>{v === "1year" ? "1 Year" : "Forever"}</div>
                <div style={{ fontSize: 11, color: form.type === v ? MID : "#bbb", marginTop: 2 }}>{v === "1year" ? "Expires in 1 year" : "Never expires"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block", marginBottom: 4 }}>Notes</label>
          <textarea value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Optional internal notes" rows={2}
            style={{ padding: "9px 12px", border: `1.5px solid ${MGRAY}`, borderRadius: 8, fontSize: 16, width: "100%", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={onClose} style={{ padding: 11, background: LGRAY, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: DARK }}>Cancel</button>
          <button onClick={save} disabled={!form.name.trim() || saving}
            style={{ padding: 11, background: form.name.trim() ? B : "#ccc", color: W, border: "none", borderRadius: 9, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            {saving ? "Saving..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client, token, onUpdate, onDelete }: { client: Client; token: string; onUpdate: (c: Client) => void; onDelete: (code: string) => void }) {
  const status = getStatus(client);
  const [exp, setExp] = useState(false);
  const [conf, setConf] = useState(false);

  async function act(action: Action) {
    const res = await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ code: client.code, action }),
    });
    if (res.ok) onUpdate(await res.json());
  }

  async function remove() {
    const res = await fetch("/api/admin/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ code: client.code }),
    });
    if (res.ok) onDelete(client.code);
  }

  return (
    <>
      <tr style={{ background: status === "revoked" ? "#fff5f5" : status === "expired" ? "#fffbf0" : W, borderBottom: `1px solid ${LGRAY}` }}>
        <td style={{ padding: "10px 12px", fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 700, color: DARK, whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{client.code}<CopyBtn text={client.code} /></div>
        </td>
        <td style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{client.name}</div>
          {client.business && <div style={{ fontSize: 11, color: MID }}>{client.business}</div>}
        </td>
        <td style={{ padding: "10px 12px", fontSize: 12, color: "#666" }}>
          {client.phone && <div>{client.phone}</div>}
          {client.email && <div style={{ color: MID }}>{client.email}</div>}
        </td>
        <td style={{ padding: "10px 12px" }}><Badge status={status} /></td>
        <td style={{ padding: "10px 12px", fontSize: 12, color: "#888" }}>{client.type === "forever" ? "Forever" : fmtDate(client.expires_at)}</td>
        <td style={{ padding: "10px 12px", fontSize: 11, color: "#999" }}>{fmtDate(client.created_at)}</td>
        <td style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => act(status === "revoked" ? "restore" : "revoke")}
              style={{ padding: "5px 10px", background: status === "revoked" ? "#e8f5e9" : "#fdecea", color: status === "revoked" ? "#2e7d32" : "#c0392b", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {status === "revoked" ? "Restore" : "Revoke"}
            </button>
            <button onClick={() => setExp(e => !e)}
              style={{ padding: "5px 10px", background: LITE, color: DARK, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {exp ? "Less" : "More"}
            </button>
          </div>
        </td>
      </tr>
      {exp && (
        <tr style={{ background: LGRAY }}>
          <td colSpan={7} style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Change:</span>
              {client.type !== "forever" && <button onClick={() => act("forever")} style={{ padding: "6px 14px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upgrade to Forever</button>}
              {client.type === "forever" && <button onClick={() => act("set1year")} style={{ padding: "6px 14px", background: "#fff3e0", color: "#e65100", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Set to 1 Year</button>}
              <button onClick={() => act("extend")} style={{ padding: "6px 14px", background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Extend 1 Year</button>
              {!conf
                ? <button onClick={() => setConf(true)} style={{ marginLeft: "auto", padding: "6px 14px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                : <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#c0392b", fontWeight: 700 }}>Delete this client?</span>
                    <button onClick={remove} style={{ padding: "6px 12px", background: "#c0392b", color: W, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Yes</button>
                    <button onClick={() => setConf(false)} style={{ padding: "6px 12px", background: LGRAY, border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>No</button>
                  </div>}
            </div>
            {client.notes && <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}><b>Notes:</b> {client.notes}</div>}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ToolsAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const [authErr, setAuthErr] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ClientStatus>("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/clients", { headers: { "x-admin-token": t } });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("pds-admin-token");
    if (saved) { setToken(saved); load(saved); }
  }, [load]);

  async function login() {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    if (res.ok) {
      const { token: t } = await res.json();
      setToken(t); sessionStorage.setItem("pds-admin-token", t); load(t);
    } else { setAuthErr(true); setPass(""); }
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,${DARK},#1a3335)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: W, borderRadius: 16, padding: "40px 44px", width: 360, boxShadow: "0 24px 60px rgba(0,0,0,.25)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, background: B, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>🔐</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: MID, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>Prowess Digital Solutions</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>Admin Panel</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block", marginBottom: 6 }}>Admin Password</label>
            <input type="password" value={pass} onChange={e => { setPass(e.target.value); setAuthErr(false); }}
              onKeyDown={e => e.key === "Enter" && login()} placeholder="Enter admin password"
              style={{ padding: "9px 12px", border: `1.5px solid ${authErr ? "#e74c3c" : MGRAY}`, borderRadius: 8, fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" }} />
            {authErr && <div style={{ color: "#c0392b", fontSize: 12, marginTop: 5, fontWeight: 600 }}>Incorrect password.</div>}
          </div>
          <button onClick={login} style={{ width: "100%", padding: 11, background: B, color: W, border: "none", borderRadius: 9, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            Access Admin Panel
          </button>
        </div>
      </div>
    );
  }

  const filtered = clients
    .filter(c => {
      const s = getStatus(c);
      if (filter !== "all" && s !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.business?.toLowerCase().includes(q) || c.phone?.includes(q);
    })
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));

  const counts = {
    all: clients.length,
    active: clients.filter(c => getStatus(c) === "active").length,
    forever: clients.filter(c => getStatus(c) === "forever").length,
    revoked: clients.filter(c => getStatus(c) === "revoked").length,
    expired: clients.filter(c => getStatus(c) === "expired").length,
  };

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", minHeight: "100vh", background: LGRAY }}>
      <div style={{ background: DARK, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase" }}>Prowess Digital Solutions</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: W, marginTop: 2 }}>Client Access Management</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModal(true)} style={{ padding: "9px 18px", background: B, color: W, border: "none", borderRadius: 9, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>New Client</button>
          <button onClick={() => { sessionStorage.removeItem("pds-admin-token"); setToken(null); }}
            style={{ padding: "9px 14px", background: "rgba(255,255,255,.15)", color: W, border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
      <div style={{ background: LITE, borderBottom: `2px solid ${B}`, padding: "12px 24px", fontSize: 13, color: DARK }}>
        Changes save instantly to Supabase. No export needed. Codes work on all devices within seconds.
      </div>
      <div style={{ background: W, borderBottom: `1px solid ${MGRAY}`, padding: "10px 24px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "active", "forever", "revoked", "expired"] as const).map(k => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: "6px 14px", borderRadius: 20, background: filter === k ? B : "transparent", color: filter === k ? W : MID, border: `1.5px solid ${filter === k ? B : MGRAY}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {k.charAt(0).toUpperCase() + k.slice(1)} ({counts[k]})
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, phone..."
          style={{ marginLeft: "auto", padding: "7px 14px", border: `1.5px solid ${MGRAY}`, borderRadius: 20, fontSize: 16, outline: "none", width: 240 }} />
      </div>
      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: MID }}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div style={{ background: W, borderRadius: 12, padding: "48px 24px", textAlign: "center", border: `1px solid ${MGRAY}` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 8 }}>No clients yet</div>
            <button onClick={() => setModal(true)} style={{ padding: "10px 24px", background: B, color: W, border: "none", borderRadius: 9, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Register First Client</button>
          </div>
        ) : (
          <div style={{ background: W, borderRadius: 12, border: `1px solid ${MGRAY}`, overflow: "hidden" }}>
            <div style={{ background: DARK, padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: W, fontWeight: 700, fontSize: 13 }}>{filtered.length} client{filtered.length !== 1 ? "s" : ""} shown</span>
              <span style={{ color: "rgba(255,255,255,.4)", fontSize: 11 }}>Changes sync instantly</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>{["Access Code","Client Name","Contact","Status","Expires","Registered","Actions"].map(h => (
                    <th key={h} style={{ background: B, color: W, padding: "9px 12px", fontWeight: 700, fontSize: 11, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <ClientRow key={c.code} client={c} token={token!}
                      onUpdate={u => setClients(prev => prev.map(x => x.code === u.code ? u : x))}
                      onDelete={code => setClients(prev => prev.filter(x => x.code !== code))} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {modal && <CreateModal token={token!} onSave={c => setClients(prev => [c, ...prev])} onClose={() => setModal(false)} />}
    </div>
  );
}
