export const CANONICAL_ORIGIN = "https://osakatool.com";
export const STATIC_PATHS = ["/", "/about", "/products", "/categories", "/industries", "/technology", "/quality", "/distribution", "/rfq", "/resources", "/contact"];

export function enabled(env = process.env) {
  return env.NODE_ENV === "production" && env.DEPLOYMENT_ENV === "production" &&
    env.INDEXNOW_ENABLED === "true" && env.PUBLIC_SITE_URL === CANONICAL_ORIGIN;
}

export function canonicalUrl(path) {
  const url = new URL(path, CANONICAL_ORIGIN);
  if (url.origin !== CANONICAL_ORIGIN || url.username || url.password || url.search || url.hash ||
    !(STATIC_PATHS.includes(url.pathname) || /^\/(products|categories|resources)\/[a-z0-9][a-z0-9-]*$/.test(url.pathname))) {
    throw new Error("Only canonical public OSAKA TOOL pages may be submitted");
  }
  return url.href;
}

export function resultMessage(status) {
  if (status === 200) return "URLs received by IndexNow. Receipt does not mean indexing.";
  if (status === 202) return "URLs received; IndexNow ownership validation is pending. Receipt does not mean indexing.";
  if (status === 403) return "Ownership validation failed (403). Check the public key file and its exact contents; URLs remain queued.";
  if (status === 429) return "Rate limited (429). URLs remain queued; retry waits for Retry-After or the backoff period.";
  return `IndexNow request failed (${status}); URLs remain queued for retry.`;
}

export function retryDelay(status, attempts, retryAfter, now = Date.now()) {
  const requested = retryAfter && (/^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - now);
  const backoff = Math.min(86400000, 60000 * 2 ** Math.min(attempts, 10));
  return Math.max(60000, requested || 0, backoff, [403, 429].includes(status) ? 3600000 : 0);
}

export const snapshotFilter = (item) => ({ _id: item._id, revision: item.revision });
