"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { InquiryItem } from "@/lib/types";

type Kind = "contact" | "rfq" | "sourcing" | "distribution";

export default function InquiryForm({ type = "contact", items, defaultMessage = "", onSent, submitLabel = "Send inquiry", compact = false }: {
  type?: Kind; items?: InquiryItem[]; defaultMessage?: string; onSent?: () => void; submitLabel?: string; compact?: boolean;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, type: body.type || type, items, sourcePage: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "We could not send your inquiry. Please try again.");
      setState("sent");
      onSent?.();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (state === "sent") {
    return (
      <div className="card flex flex-col items-start gap-4 p-8" role="status">
        <CheckCircle2 className="h-8 w-8 text-ok" />
        <p className="text-2xl font-semibold">Inquiry received.</p>
        <p className="text-mute">An OSAKA TOOL specialist will reply by email, usually within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
      {/* Honeypot field, hidden from people and assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div><label className="label" htmlFor="f-name">Full name *</label><input id="f-name" name="name" required maxLength={120} autoComplete="name" className="field" /></div>
      <div><label className="label" htmlFor="f-email">Work email *</label><input id="f-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" /></div>
      <div><label className="label" htmlFor="f-company">Company</label><input id="f-company" name="company" maxLength={160} autoComplete="organization" className="field" /></div>
      <div><label className="label" htmlFor="f-country">Country</label><input id="f-country" name="country" maxLength={80} autoComplete="country-name" className="field" /></div>
      {!compact && <div><label className="label" htmlFor="f-phone">Phone</label><input id="f-phone" name="phone" maxLength={40} autoComplete="tel" className="field" /></div>}
      {!compact && type === "contact" && (
        <div>
          <label className="label" htmlFor="f-type">Topic</label>
          <select id="f-type" name="type" defaultValue="contact" className="field">
            <option value="contact">General inquiry</option>
            <option value="sourcing">Product sourcing</option>
            <option value="distribution">Distribution partnership</option>
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label" htmlFor="f-message">{type === "rfq" ? "Requirements, delivery country and target date" : "Message *"}</label>
        <textarea id="f-message" name="message" rows={compact ? 4 : 6} required={type !== "rfq"} maxLength={5000} defaultValue={defaultMessage} className="field resize-y" />
      </div>
      {state === "error" && <p className="text-sm text-beni sm:col-span-2" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-faint">We use your details only to respond to this inquiry.</p>
        <button type="submit" disabled={state === "sending"} className="btn btn-primary">
          {state === "sending" ? "Sending…" : submitLabel}<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
