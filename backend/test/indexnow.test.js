import test from "node:test";
import assert from "node:assert/strict";
import { enabled, canonicalUrl, retryDelay, resultMessage } from "../src/services/indexnow-policy.js";
import { submitPending, commitContent } from "../src/services/indexnow.js";
import { INDEXNOW_KEY } from "../src/config/indexnow.js";

const production = { NODE_ENV: "production", DEPLOYMENT_ENV: "production", INDEXNOW_ENABLED: "true", PUBLIC_SITE_URL: "https://osakatool.com" };
test("explicit production gate rejects local, test, preview and foreign origins", () => {
  assert.equal(enabled(production), true);
  for (const patch of [{ NODE_ENV: "development" }, { NODE_ENV: "test" }, { DEPLOYMENT_ENV: "preview" }, { INDEXNOW_ENABLED: "false" }, { PUBLIC_SITE_URL: "http://localhost:3000" }]) {
    assert.equal(enabled({ ...production, ...patch }), false);
  }
});
test("submissions accept only this site's public canonical paths", () => {
  assert.equal(canonicalUrl("/products/meter"), "https://osakatool.com/products/meter");
  for (const path of ["https://evil.example/products/meter", "//evil.example/", "/admin", "/api/products", "/products?q=valve", "/products/meter#x", "http://osakatool.com/products/meter"]) assert.throws(() => canonicalUrl(path));
});
test("backoff respects Retry-After and treats 403 and 429 explicitly", () => {
  assert.equal(retryDelay(429, 0, "7200"), 7200000);
  assert.equal(retryDelay(503, 0, new Date(7200000).toUTCString(), 0), 7200000);
  assert.equal(retryDelay(403, 0, null), 3600000);
  assert.match(resultMessage(403), /Ownership validation/);
  assert.match(resultMessage(429), /Rate limited/);
  assert.match(resultMessage(202), /validation is pending/);
});

function fixture(code = 200, options = {}) {
  let owner;
  const entries = [{ _id: "https://osakatool.com/products/meter", revision: "original", attempts: 0 }];
  const writes = [], requests = [];
  const states = {
    async findOneAndUpdate(filter, update) {
      if (options.locked || owner) return null;
      owner = update.$set.owner;
      return { owner };
    },
    async updateOne(filter, update) { writes.push({ filter, update }); },
  };
  const queue = {
    find() { return { sort() { return this; }, limit() { return this; }, lean: async () => entries.map((entry) => ({ ...entry })) }; },
    async bulkWrite(ops) {
      for (const op of ops) {
        const value = op.deleteOne || op.updateOne;
        const index = entries.findIndex((entry) => entry._id === value.filter._id && entry.revision === value.filter.revision);
        if (index < 0) continue;
        if (op.deleteOne) entries.splice(index, 1);
        else { Object.assign(entries[index], value.update.$set); entries[index].attempts++; }
      }
    },
  };
  const fetcher = async (url, init) => {
    requests.push({ url, init });
    if (requests.length === 1) return new Response(options.badKey ? "wrong" : INDEXNOW_KEY, { status: options.keyStatus || 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (options.concurrentEdit) entries[0].revision = "edited-during-request";
    if (options.networkError) throw new Error("private network text");
    return new Response(null, { status: code, headers: code === 429 ? { "retry-after": "7200" } : {} });
  };
  return { queue, states, fetcher, active: true, entries, writes, requests };
}

for (const code of [200, 202]) test(`HTTP ${code} acknowledges only the submitted snapshot`, async () => {
  const f = fixture(code); const result = await submitPending(f);
  assert.equal(result.status, code); assert.equal(f.entries.length, 0);
  assert.equal(f.requests[0].init.redirect, "error");
  const payload = JSON.parse(f.requests[1].init.body);
  assert.equal(payload.host, "osakatool.com"); assert.equal(payload.urlList.length, 1);
  assert.match(result.message, /does not mean indexing/);
});
test("concurrent content edits survive a successful in-flight acknowledgement", async () => {
  const f = fixture(200, { concurrentEdit: true }); await submitPending(f);
  assert.equal(f.entries.length, 1); assert.equal(f.entries[0].revision, "edited-during-request");
});
for (const code of [403, 429, 500]) test(`HTTP ${code} preserves entries and persists backoff`, async () => {
  const f = fixture(code); await submitPending(f);
  assert.equal(f.entries.length, 1); assert.equal(f.entries[0].attempts, 1);
  assert.ok(f.entries[0].nextAttemptAt > new Date());
});
test("network failures preserve entries and hide exception details", async () => {
  const f = fixture(200, { networkError: true }); const r = await submitPending(f);
  assert.equal(f.entries.length, 1); assert.doesNotMatch(r.message, /private network/);
});
test("live ownership verification failure prevents submission and retains queue", async () => {
  const f = fixture(200, { badKey: true }); const r = await submitPending(f);
  assert.equal(f.requests.length, 1); assert.equal(f.entries.length, 1); assert.equal(r.status, 403);
});
test("durable lock prevents overlapping submissions", async () => {
  const f = fixture(); const result = await Promise.all([submitPending(f), submitPending(f)]);
  assert.equal(result.filter((r) => r.skipped).length, 1); assert.equal(f.requests.length, 2);
});
test("disabled environment does not touch storage or transmit URLs", async () => {
  assert.equal((await submitPending({ active: false })).skipped, true);
  const value = await commitContent(["/products/meter"], async (session) => { assert.equal(session, undefined); return "saved"; });
  assert.equal(value, "saved");
});
test("idle worker does not erase the last receipt status", async () => {
  const f = fixture(); f.entries.length = 0;
  await submitPending(f);
  assert.equal(f.requests.length, 0);
  assert.equal(f.writes.at(-1).update.$set.lastStatus, undefined);
  assert.equal(f.writes.at(-1).update.$set.message, undefined);
});
