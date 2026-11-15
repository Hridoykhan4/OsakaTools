import "server-only";
import type { Article, Category, CompanyDocument, Facets, Pagination, Product, SiteSettings } from "./types";

const BASE = process.env.API_INTERNAL_URL || "http://localhost:5000/api";
const TTL = 30_000;

// Small in-process cache for public GETs. Pages render dynamically (no build-time
// coupling to the API), while repeated requests stay fast.
const cache = new Map<string, { at: number; value: unknown }>();

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function get<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try { message = (await res.json())?.message || message; } catch { /* ignore */ }
    throw new ApiError(message, res.status);
  }
  const value = (await res.json()) as T;
  cache.set(path, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return value;
}

const qs = (params: Record<string, string | number | boolean | string[] | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === false) continue;
    if (Array.isArray(v)) v.forEach((x) => s.append(k, x)); else s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
};

export interface ProductQuery { page?: number; limit?: number; category?: string; brand?: string; manufacturer?: string; q?: string;
  featured?: boolean; spec?: string[]; sort?: string; facets?: boolean }

export const api = {
  categories: () => get<{ categories: Category[] }>("/categories"),
  category: (slug: string) => get<{ category: Category; children: Category[] }>(`/categories/${encodeURIComponent(slug)}`),
  products: (q: ProductQuery = {}) => get<{ products: Product[]; pagination: Pagination; facets?: Facets }>(`/products${qs({ ...q })}`),
  product: (slug: string) => get<{ product: Product; related: Product[] }>(`/products/${encodeURIComponent(slug)}`),
  articles: (q: { page?: number; limit?: number; category?: string } = {}) => get<{ posts: Article[]; pagination: Pagination }>(`/articles${qs(q)}`),
  article: (slug: string) => get<{ post: Article; related: Article[] }>(`/articles/${encodeURIComponent(slug)}`),
  documents: () => get<{ documents: CompanyDocument[] }>("/documents/public"),
  settings: () => get<{ settings: SiteSettings }>("/settings"),
};

// Pages degrade gracefully if the API is briefly unavailable instead of failing entirely.
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise; } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw err;
    console.error("[api]", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export const EMPTY_SETTINGS: SiteSettings = {
  announcement: { text: "", href: "", active: false },
  hero: { kicker: "", title: "", subtitle: "", kanji: "" },
  contact: { email: "", phone: "", whatsapp: "", address: "", hours: "" },
  social: { linkedin: "", facebook: "", instagram: "", youtube: "", x: "" },
  home: { featuredCategories: [], statement: "" },
};
export const loadSettings = () => safe(api.settings(), { settings: EMPTY_SETTINGS }).then((r) => r.settings);
