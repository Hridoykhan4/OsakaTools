"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Logo } from "@/components/brand";
import PrecisionDial from "@/components/PrecisionDial";
import { admin } from "@/lib/adminApi";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      await admin.post("/auth/login", { username: form.get("username"), password: form.get("password") });
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <Logo />
      <h1 className="mt-12 text-3xl font-semibold tracking-tight">Operations sign-in</h1>
      <p className="mt-2 text-sm text-mute">Catalogue, RFQ and documentation management.</p>
      <div className="mt-8 space-y-4">
        <label className="block"><span className="label">Username</span><input name="username" autoComplete="username" required className="field" autoFocus /></label>
        <label className="block"><span className="label">Password</span><input name="password" type="password" autoComplete="current-password" required className="field" /></label>
        {error && <p className="rounded-xl bg-beni-soft px-4 py-3 text-sm text-beni" role="alert">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full"><Lock className="h-4 w-4" />{busy ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4" /></button>
      </div>
      <p className="mt-8 text-xs text-faint">Sessions expire after 12 hours. All sign-ins are recorded in the audit log.</p>
    </form>
  );
}

export default function Login() {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <div className="flex items-center justify-center p-6"><Suspense><LoginForm /></Suspense></div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-ink lg:flex">
        <div className="grid-paper absolute inset-0 opacity-20" />
        <PrecisionDial className="relative w-[70%] opacity-90" />
      </div>
    </div>
  );
}
