"use client";

// All admin calls go through the website's own /api proxy with the session cookie.
export class AdminError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/admin/login")) {
      location.href = `/admin/login?next=${encodeURIComponent(location.pathname)}`;
    }
    throw new AdminError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const admin = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export async function uploadFiles(files: FileList | File[]) {
  const form = new FormData();
  [...files].forEach((f) => form.append("files", f));
  return admin.post<{ files: { url: string; publicId: string; kind: "image" | "document"; format: string; name: string }[] }>("/upload/multiple", form);
}

export const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") s.set(k, String(v)); });
  const out = s.toString();
  return out ? `?${out}` : "";
};
