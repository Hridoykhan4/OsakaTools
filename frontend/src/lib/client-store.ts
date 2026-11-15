"use client";
// RFQ list and comparison selection, persisted per browser. Storage access is
// guarded because it can throw in private windows or with site data blocked.
import { useSyncExternalStore } from "react";

export interface RfqLine { id: string; slug: string; name: string; sku: string; image?: string; quantity: number }
export interface CompareItem { slug: string; name: string }

function createStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try { const raw = localStorage.getItem(key); if (raw) state = JSON.parse(raw) as T; } catch { /* storage unavailable */ }
  };
  return {
    get: () => { load(); return state; },
    set(next: T) {
      state = next;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => { if (e.key === key) { loaded = false; load(); listener(); } };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
    },
    initial,
  };
}

const rfq = createStore<RfqLine[]>("osaka-tool:rfq", []);
const compare = createStore<CompareItem[]>("osaka-tool:compare", []);

export function useRfq() {
  const items = useSyncExternalStore(rfq.subscribe, rfq.get, () => rfq.initial);
  return {
    items,
    has: (id: string) => items.some((i) => i.id === id),
    add: (line: Omit<RfqLine, "quantity">, quantity = 1) =>
      rfq.set(items.some((i) => i.id === line.id) ? items : [...items, { ...line, quantity }]),
    update: (id: string, quantity: number) => rfq.set(items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i))),
    remove: (id: string) => rfq.set(items.filter((i) => i.id !== id)),
    clear: () => rfq.set([]),
  };
}

export const COMPARE_LIMIT = 4;
export function useCompare() {
  const items = useSyncExternalStore(compare.subscribe, compare.get, () => compare.initial);
  return {
    items,
    has: (slug: string) => items.some((i) => i.slug === slug),
    toggle: (item: CompareItem) =>
      compare.set(items.some((i) => i.slug === item.slug) ? items.filter((i) => i.slug !== item.slug) : [...items, item].slice(-COMPARE_LIMIT)),
    clear: () => compare.set([]),
  };
}
