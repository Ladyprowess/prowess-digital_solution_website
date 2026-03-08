"use client";
import { useState, useEffect, ReactNode } from "react";

interface ClientInfo {
  name: string;
  business: string | null;
  type: string;
  expires_at: number | null;
}

interface Props {
  toolKey: string;
  toolName: string;
  children: (code: string) => ReactNode;
}

const REASON_MSG: Record<string, string> = {
  invalid: "That code is not recognised. Please check and try again.",
  revoked: "This access code has been revoked. Please contact Prowess Digital Solutions.",
  expired: "This access code has expired. Please contact Prowess Digital Solutions to renew.",
};

export default function AccessGate({ toolKey, toolName, children }: Props) {
  const [code, setCode]               = useState("");
  const [grantedCode, setGrantedCode] = useState<string | null>(null);
  const [status, setStatus]           = useState<"idle"|"checking"|"granted"|"denied">("idle");
  const [reason, setReason]           = useState("");
  const [client, setClient]           = useState<ClientInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`pds-access-${toolKey}`);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { code: string; client: ClientInfo };
      verify(saved.code, true, saved.client);
    } catch {
      localStorage.removeItem(`pds-access-${toolKey}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolKey]);

  async function verify(input: string, silent = false, fallback: ClientInfo | null = null) {
    if (!silent) setStatus("checking");
    try {
      const res  = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input }),
      });
      const data = await res.json();
      if (data.valid) {
        const cleanCode = input.trim().toUpperCase();
        setClient(data.client);
        setGrantedCode(cleanCode);
        setStatus("granted");
        localStorage.setItem(`pds-access-${toolKey}`, JSON.stringify({ code: cleanCode, client: data.client }));
      } else {
        if (silent && fallback) {
          setClient(fallback);
          setGrantedCode(input.trim().toUpperCase());
          setStatus("granted");
        } else {
          setReason(data.reason ?? "invalid");
          setStatus("denied");
          localStorage.removeItem(`pds-access-${toolKey}`);
        }
      }
    } catch {
      if (silent && fallback) { setClient(fallback); setGrantedCode(input.trim().toUpperCase()); setStatus("granted"); }
      else { setReason("invalid"); setStatus("denied"); }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    verify(code.trim());
  }

  function handleLogout() {
    localStorage.removeItem(`pds-access-${toolKey}`);
    setStatus("idle");
    setCode("");
    setClient(null);
    setGrantedCode(null);
  }

  if (status === "granted" && grantedCode) {
    const expiry = client?.type === "forever"
      ? "Lifetime access"
      : client?.expires_at
        ? `Valid until ${new Date(client.expires_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}`
        : "";

    return (
      <div>
        <div className="mb-6 flex items-center justify-between rounded-xl bg-[#e8f4f5] px-4 py-3">
          <p className="text-sm font-medium text-[#3a5c60]">
            {client?.name ? `${client.name}${client.business ? ` · ${client.business}` : ""} · ` : ""}
            {expiry}
          </p>
          <button onClick={handleLogout} className="ml-4 text-xs font-semibold text-[#507c80] hover:underline">
            Sign out
          </button>
        </div>
        {children(grantedCode)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-10">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f4f5] text-2xl">🔐</div>
      <h3 className="mb-2 text-xl font-bold text-slate-900">{toolName}</h3>
      <p className="mb-6 text-sm text-slate-500">
        This tool requires an access code. Enter your PDS code below.{" "}
        <span className="font-medium text-[#507c80]">No code? Contact Prowess Digital Solutions.</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setStatus("idle"); }}
          placeholder="PDS-XXXX-XXXX" disabled={status === "checking"}
          autoComplete="off" spellCheck={false} style={{ fontSize: "16px" }}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/20"
        />
        {status === "denied" && (
          <p className="text-sm font-medium text-red-600">{REASON_MSG[reason] ?? REASON_MSG.invalid}</p>
        )}
        <button type="submit" disabled={status === "checking" || !code.trim()}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#507c80" }}>
          {status === "checking" ? "Checking..." : "Access Tool"}
        </button>
      </form>
    </div>
  );
}
