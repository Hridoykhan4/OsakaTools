import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import AdminUser from "../src/models/AdminUser.js";
import { can } from "../src/middleware/auth.js";
import { resolveDbName } from "../src/config/db.js";

mongoose.set("bufferCommands", false);
process.env.ADMIN_SESSION_SECRET = "isolated-test-secret-not-used-in-production-0123456789";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";

const users = {
  a1: { _id: "a1", username: "ops", role: "admin", active: true, tokenVersion: 0 },
  v1: { _id: "v1", username: "reader", role: "viewer", active: true, tokenVersion: 0 },
  x1: { _id: "x1", username: "gone", role: "owner", active: false, tokenVersion: 0 },
};
AdminUser.findById = (id) => ({ lean: async () => users[id] || null });
const bearer = (sub, v = 0) => ({ Authorization: `Bearer ${jwt.sign({ sub, role: users[sub]?.role, v }, process.env.ADMIN_SESSION_SECRET)}` });

async function withServer(fn) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((r) => server.close(r)); }
}

test("database isolation refuses Osaka Toyo databases and defaults to osaka_tool", () => {
  assert.equal(resolveDbName({}), "osaka_tool");
  assert.equal(resolveDbName({ MONGODB_DB: "osaka_tool" }), "osaka_tool");
  for (const name of ["osaka_toyo", "OSAKA_TOYO", "osakatoyo"]) assert.throws(() => resolveDbName({ MONGODB_DB: name }), /isolated/);
});

test("role permissions are ordered and least-privilege", () => {
  assert.equal(can("viewer", "dashboard:read"), true);
  assert.equal(can("viewer", "catalog:write"), false);
  assert.equal(can("sales", "inquiries:write"), true);
  assert.equal(can("editor", "catalog:publish"), false);
  assert.equal(can("admin", "catalog:publish"), true);
  assert.equal(can("admin", "users:manage"), false);
  assert.equal(can("owner", "users:manage"), true);
  assert.equal(can("unknown", "dashboard:read"), false);
});

test("admin APIs require a valid, active, unrevoked session and the right role", async () => {
  await withServer(async (base) => {
    let res = await fetch(`${base}/api/indexing`);
    assert.equal(res.status, 401);
    assert.match(res.headers.get("cache-control"), /private, no-store/);
    assert.match(res.headers.get("x-robots-tag"), /noindex/);

    res = await fetch(`${base}/api/indexing`, { headers: bearer("a1") });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).enabled, false);

    res = await fetch(`${base}/api/indexing`, { headers: bearer("a1", 1) }); // revoked token version
    assert.equal(res.status, 401);
    res = await fetch(`${base}/api/indexing`, { headers: bearer("x1") }); // deactivated user
    assert.equal(res.status, 401);

    res = await fetch(`${base}/api/indexing/retry`, { method: "POST", headers: bearer("v1") });
    assert.equal(res.status, 403, "viewer cannot trigger indexing");
    res = await fetch(`${base}/api/users`, { headers: bearer("a1") });
    assert.equal(res.status, 403, "admin cannot manage users");
    res = await fetch(`${base}/api/products/bulk`, { method: "POST", headers: { ...bearer("v1"), "Content-Type": "application/json" }, body: "{}" });
    assert.equal(res.status, 403, "viewer cannot bulk edit");

    for (const origin of [undefined, "https://evil.example"]) {
      res = await fetch(`${base}/api/indexing/retry`, { method: "POST", headers: { ...bearer("a1"), ...(origin ? { Origin: origin } : {}) } });
      assert.equal(res.status, 403);
    }
    res = await fetch(`${base}/api/indexing/retry`, { method: "POST", headers: { ...bearer("a1"), Origin: "http://localhost:3000" } });
    assert.equal(res.status, 200);
  });
});

test("cookie-authenticated writes from a foreign origin are rejected (CSRF)", async () => {
  await withServer(async (base) => {
    const token = jwt.sign({ sub: "a1", role: "admin", v: 0 }, process.env.ADMIN_SESSION_SECRET);
    const res = await fetch(`${base}/api/products/bulk`, { method: "POST",
      headers: { Cookie: `osaka_tool_session=${token}`, Origin: "https://evil.example", "Content-Type": "application/json" }, body: "{}" });
    assert.equal(res.status, 403);
  });
});

test("public inquiry endpoint validates input before touching the database", async () => {
  await withServer(async (base) => {
    const post = (body) => fetch(`${base}/api/inquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal((await post({ name: "A", email: "not-an-email", message: "Hi" })).status, 400);
    assert.equal((await post({ email: "a@b.co", message: "Hi" })).status, 400);
    assert.equal((await post({ type: "rfq", name: "A", email: "a@b.co" })).status, 400);
    // Honeypot submissions are accepted silently and never stored.
    assert.equal((await post({ name: "Bot", email: "b@b.co", message: "spam", website: "http://spam" })).status, 201);
  });
});

test("health endpoint reports service identity", async () => {
  process.env.NODE_ENV = "test";
  await withServer(async (base) => {
    const body = await (await fetch(`${base}/api/health`)).json();
    assert.equal(body.service, "osaka-tool-api");
  });
});
