"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Session } from "@/lib/types";

// ---- session ----
export const SessionContext = createContext<Session | null>(null);
export function useSession() {
  const s = useContext(SessionContext);
  return { session: s, can: (p: string) => Boolean(s?.permissions.includes(p)) };
}

// ---- data loading ----
// Loads data whenever `deps` change. Previous data stays visible while a reload
// runs, so saving or filtering never flashes an empty skeleton.
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [version, setVersion] = useState(0);
  const token = `${JSON.stringify(deps)}#${version}`;
  const [state, setState] = useState<{ token: string; data?: T; error: string }>({ token: "", error: "" });
  useEffect(() => {
    let alive = true;
    loader().then(
      (data) => { if (alive) setState({ token, data, error: "" }); },
      (e) => { if (alive) setState((s) => ({ token, data: s.data, error: e instanceof Error ? e.message : "Failed to load" })); },
    );
    return () => { alive = false; };
    // The loader closes over `deps`, which `token` already tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((update: T | ((prev: T | undefined) => T | undefined)) =>
    setState((s) => ({ ...s, data: typeof update === "function" ? (update as (p: T | undefined) => T | undefined)(s.data) : update })), []);
  const settled = state.token === token;
  return { data: state.data, error: settled ? state.error : "", loading: !settled && state.data === undefined, reload, setData };
}

// ---- toasts ----
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastContext = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[90] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-xl px-4 py-3 text-sm text-white shadow-lg ${t.tone === "ok" ? "bg-ink" : "bg-beni"}`}>{t.text}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

// Run an async action with toast feedback.
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(true);
    try { const r = await fn(); if (success) toast(success); return r; }
    catch (e) { toast(e instanceof Error ? e.message : "Action failed", "error"); return undefined; }
    finally { setBusy(false); }
  }, [toast]);
  return { run, busy };
}

// ---- layout primitives ----
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && <div className="flex items-center justify-between border-b border-line-2 px-5 py-3.5"><h2 className="text-sm font-semibold">{title}</h2>{actions}</div>}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  published: "bg-ok/10 text-ok", verified: "bg-ok/10 text-ok", won: "bg-ok/10 text-ok", completed: "bg-ok/10 text-ok", registered: "bg-ok/10 text-ok", active: "bg-ok/10 text-ok",
  review: "bg-warn/10 text-warn", pending: "bg-warn/10 text-warn", "in-progress": "bg-ai-soft text-ai", quoted: "bg-ai-soft text-ai", new: "bg-beni-soft text-beni", running: "bg-ai-soft text-ai",
  draft: "bg-paper-2 text-mute", archived: "bg-paper-2 text-faint", closed: "bg-paper-2 text-mute", lost: "bg-paper-2 text-mute", rejected: "bg-beni-soft text-beni",
  failed: "bg-beni-soft text-beni", expired: "bg-beni-soft text-beni", spam: "bg-paper-2 text-faint", inactive: "bg-paper-2 text-faint",
};
export function Badge({ value, children }: { value: string; children?: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.68rem] uppercase tracking-wide ${TONES[value] || "bg-paper-2 text-mute"}`}>{children || value}</span>;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-paper-2" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StateView({ loading, error, empty, children }: { loading: boolean; error: string; empty?: boolean; children: React.ReactNode }) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-paper-2" />)}</div>;
  if (error) return <p className="rounded-xl bg-beni-soft p-4 text-sm text-beni">{error}</p>;
  if (empty) return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-mute">Nothing here yet.</p>;
  return <>{children}</>;
}

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
export const btn = "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50";
export const btnPrimary = `${btn} bg-ink text-paper hover:bg-beni`;
export const btnGhost = `${btn} border border-line bg-white hover:border-ink`;
export const btnDanger = `${btn} border border-beni/30 text-beni hover:bg-beni hover:text-white`;
