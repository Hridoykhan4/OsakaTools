import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";

export const COOKIE_NAME = "osaka_tool_session";
const SESSION_HOURS = 12;

// Permission -> minimum role. Roles are ordered: owner > admin > editor > sales > viewer.
const RANK = { viewer: 1, sales: 2, editor: 3, admin: 4, owner: 5 };
export const PERMISSIONS = {
  "dashboard:read": "viewer",
  "catalog:write": "editor",
  "catalog:publish": "admin",
  "catalog:delete": "admin",
  "imports:preview": "editor",
  "imports:commit": "admin",
  "documents:write": "editor",
  "documents:verify": "admin",
  "inquiries:write": "sales",
  "inquiries:delete": "admin",
  "content:write": "editor",
  "media:write": "editor",
  "indexing:write": "admin",
  "audit:read": "admin",
  "users:manage": "owner",
};

export function can(role, permission) {
  const needed = PERMISSIONS[permission];
  return Boolean(needed && RANK[role] && RANK[role] >= RANK[needed]);
}

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw Object.assign(new Error("Server session secret is not configured"), { status: 500 });
  return value;
}

export function signSession(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, v: user.tokenVersion || 0 }, secret(), {
    expiresIn: `${SESSION_HOURS}h`,
  });
}

// The browser reaches the API through the website's own /api proxy, so the
// session cookie is first-party and can stay SameSite=Lax.
export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_HOURS * 3600 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/", secure: process.env.NODE_ENV === "production", sameSite: "lax" });
}

function readToken(req) {
  return req.cookies?.[COOKIE_NAME] ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
}

async function resolveUser(token) {
  const payload = jwt.verify(token, secret());
  const user = await AdminUser.findById(payload.sub).lean();
  if (!user || !user.active || (user.tokenVersion || 0) !== payload.v) throw new Error("Session revoked");
  return { id: String(user._id), username: user.username, name: user.name, role: user.role };
}

export async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.admin = await resolveUser(token);
    next();
  } catch (err) {
    if (err.status === 500) return next(err);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

export const requirePermission = (permission) => [
  requireAuth,
  (req, res, next) => (can(req.admin.role, permission)
    ? next()
    : res.status(403).json({ message: `Your role (${req.admin.role}) cannot perform this action` })),
];

// Soft authentication for public endpoints that reveal drafts to signed-in staff.
export async function attachAdmin(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.admin = await resolveUser(token); } catch { /* treat as anonymous */ }
  }
  next();
}

// CSRF defence for cookie-authenticated writes: require an allow-listed Origin.
export function requireTrustedOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (!req.cookies?.[COOKIE_NAME]) return next(); // bearer-token clients are not exposed to CSRF
  const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim());
  if (!allowed.includes(req.get("Origin"))) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }
  next();
}
