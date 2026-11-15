import bcrypt from "bcryptjs";
import AdminUser, { ROLES } from "../models/AdminUser.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signSession, setSessionCookie, clearSessionCookie, PERMISSIONS, can } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { str, httpError } from "../utils/validate.js";

// A constant hash so unknown usernames take as long as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync("osaka-tool-timing-equaliser", 12);

// Creates the first owner from ADMIN_USERNAME / ADMIN_PASSWORD when no users exist.
export async function bootstrapOwner() {
  if (await AdminUser.estimatedDocumentCount()) return;
  const username = str(process.env.ADMIN_USERNAME, 60).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!username || password.length < 10) {
    console.warn("[auth] No admin users exist and ADMIN_USERNAME/ADMIN_PASSWORD (10+ chars) are not set");
    return;
  }
  await AdminUser.create({ username, name: "Owner", role: "owner", passwordHash: await bcrypt.hash(password, 12) });
  console.log(`[auth] bootstrapped owner account "${username}"`);
}

const permissionsFor = (role) => Object.keys(PERMISSIONS).filter((p) => can(role, p));

export const login = asyncHandler(async (req, res) => {
  const username = str(req.body.username, 60).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

  const user = await AdminUser.findOne({ username }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok || !user.active) {
    await audit({ ip: req.ip, admin: { username } }, "login.failed", "session", "", `Failed login for ${username}`);
    return res.status(401).json({ message: "Invalid username or password" });
  }

  user.lastLoginAt = new Date();
  await user.save();
  setSessionCookie(res, signSession(user));
  req.admin = { username: user.username, role: user.role };
  await audit(req, "login", "session", user._id, `${user.username} signed in`);
  res.json({ admin: { id: user._id, username: user.username, name: user.name, role: user.role, permissions: permissionsFor(user.role) } });
});

export const logout = asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ admin: { ...req.admin, permissions: permissionsFor(req.admin.role) } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword = "", newPassword = "" } = req.body;
  if (typeof newPassword !== "string" || newPassword.length < 10) throw httpError(400, "New password must be at least 10 characters");
  const user = await AdminUser.findById(req.admin.id).select("+passwordHash");
  if (!user || !(await bcrypt.compare(String(currentPassword), user.passwordHash))) throw httpError(400, "Current password is incorrect");
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  setSessionCookie(res, signSession(user));
  await audit(req, "password.change", "user", user._id, `${user.username} changed their password`);
  res.json({ message: "Password updated" });
});

// ---- user management (owner only) ----
export const listUsers = asyncHandler(async (req, res) => {
  res.json({ users: await AdminUser.find().sort({ createdAt: 1 }).lean(), roles: ROLES });
});

export const createUser = asyncHandler(async (req, res) => {
  const username = str(req.body.username, 60).toLowerCase();
  const role = ROLES.includes(req.body.role) ? req.body.role : "viewer";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!/^[a-z0-9._-]{3,60}$/.test(username)) throw httpError(400, "Username must be 3-60 characters: letters, numbers, . _ -");
  if (password.length < 10) throw httpError(400, "Password must be at least 10 characters");
  const user = await AdminUser.create({
    username, role, name: str(req.body.name, 120), email: str(req.body.email, 200),
    passwordHash: await bcrypt.hash(password, 12),
  });
  await audit(req, "create", "user", user._id, `Created ${role} ${username}`);
  res.status(201).json({ user: { ...user.toObject(), passwordHash: undefined } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id).select("+passwordHash");
  if (!user) throw httpError(404, "User not found");
  if (String(user._id) === req.admin.id && (req.body.role && req.body.role !== user.role || req.body.active === false)) {
    throw httpError(400, "You cannot demote or deactivate your own account");
  }
  if (req.body.role && ROLES.includes(req.body.role)) user.role = req.body.role;
  if (typeof req.body.active === "boolean") user.active = req.body.active;
  if (req.body.name !== undefined) user.name = str(req.body.name, 120);
  if (req.body.email !== undefined) user.email = str(req.body.email, 200);
  if (req.body.password) {
    if (String(req.body.password).length < 10) throw httpError(400, "Password must be at least 10 characters");
    user.passwordHash = await bcrypt.hash(String(req.body.password), 12);
  }
  user.tokenVersion += 1; // any change to access revokes existing sessions
  await user.save();
  await audit(req, "update", "user", user._id, `Updated ${user.username} (${user.role}, ${user.active ? "active" : "inactive"})`);
  res.json({ user: { ...user.toObject(), passwordHash: undefined } });
});
