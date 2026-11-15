"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import InquiryForm from "./InquiryForm";
import { useRfq } from "@/lib/client-store";

export default function RfqBuilder({ need }: { need: string }) {
  const { items, update, remove, clear } = useRfq();
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section className="lg:col-span-5" aria-labelledby="rfq-items">
        <div className="flex items-baseline justify-between">
          <h2 id="rfq-items" className="text-xl font-semibold">Products <span className="font-mono text-sm text-faint">({items.length})</span></h2>
          {items.length > 0 && <button onClick={clear} className="text-sm text-mute hover:text-beni">Clear list</button>}
        </div>
        {items.length === 0 ? (
          <div className="card mt-4 p-6 text-sm text-mute">
            Your list is empty. Add products from the <Link href="/products" className="text-beni underline-offset-4 hover:underline">catalogue</Link>, or describe your requirement in the form. Unlisted models are welcome.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="card flex items-center gap-4 p-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-paper">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain p-1.5" />}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${i.slug}`} className="line-clamp-2 text-sm font-medium hover:text-beni">{i.name}</Link>
                  <p className="font-mono text-xs text-faint">{i.sku}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <button onClick={() => update(i.id, i.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line" aria-label={`Decrease ${i.name}`}><Minus className="h-3 w-3" /></button>
                    <input value={i.quantity} onChange={(e) => update(i.id, parseInt(e.target.value, 10) || 1)} inputMode="numeric" aria-label={`Quantity of ${i.name}`} className="w-14 text-center font-mono text-sm outline-none" />
                    <button onClick={() => update(i.id, i.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-line" aria-label={`Increase ${i.name}`}><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <button onClick={() => remove(i.id)} className="rounded-full p-2 text-faint hover:text-beni" aria-label={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-6 sm:p-10 lg:col-span-7" aria-label="Your details">
        <h2 className="text-xl font-semibold">Your details</h2>
        <p className="mt-1 text-sm text-mute">Include the delivery country, any required standards or certificates, and your target date.</p>
        <div className="mt-6">
          <InquiryForm type="rfq" submitLabel="Submit quote request" onSent={clear}
            defaultMessage={need ? `Requirement: ${need}\n` : ""}
            items={items.map((i) => ({ product: i.id, name: i.name, sku: i.sku, quantity: i.quantity }))} />
        </div>
      </section>
    </div>
  );
}
