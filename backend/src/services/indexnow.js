import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { INDEXNOW_KEY } from "../config/indexnow.js";
import { IndexingQueue, IndexingState } from "../models/SearchIndexing.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import BlogPost from "../models/BlogPost.js";
import { CANONICAL_ORIGIN, STATIC_PATHS, canonicalUrl, enabled, resultMessage, retryDelay, snapshotFilter } from "./indexnow-policy.js";

const KEY_URL = `${CANONICAL_ORIGIN}/${INDEXNOW_KEY}.txt`;
const STATE_ID = "indexnow";

async function ensureState() {
  try {
    await IndexingState.updateOne({ _id: STATE_ID }, { $setOnInsert: { leaseUntil: new Date(0), nextRunAt: new Date(0) } }, { upsert: true });
  } catch (error) { if (error.code !== 11000) throw error; }
}

// Persist notifications in the same transaction as content edits. Catalogue
// initialization may also call this independently with no content mutation.
export async function enqueuePaths(paths, session) {
  if (!enabled()) return;
  for (const url of new Set(paths.map(canonicalUrl))) {
    const update = { $set: { revision: randomUUID(), nextAttemptAt: new Date() }, $setOnInsert: { attempts: 0 } };
    try { await IndexingQueue.updateOne({ _id: url }, update, { upsert: true, session }); }
    catch (error) {
      if (error.code !== 11000) throw error;
      if (session) throw error; // MongoDB retries transient transaction conflicts.
      await IndexingQueue.updateOne({ _id: url }, update);
    }
  }
}

// Atomically commit content and its outbox entry. Workers cannot acknowledge a
// notification before the content change becomes visible. Requires a replica set
// (the project's MongoDB Atlas architecture supports transactions).
export async function commitContent(paths, write) {
  if (!enabled()) return write(undefined);
  return mongoose.connection.transaction(async (session) => {
    const result = await write(session);
    await enqueuePaths(paths, session);
    return result;
  });
}

export async function indexingStatus() {
  if (!enabled()) return { enabled: false, pending: null, keyUrl: KEY_URL,
    message: "Disabled. Production deployment and explicit IndexNow activation are required. No submissions are sent from local/test/preview environments." };
  const [pending, state] = await Promise.all([IndexingQueue.countDocuments(), IndexingState.findById(STATE_ID).lean()]);
  return { enabled: true, pending, keyUrl: KEY_URL, lastAttemptAt: state?.lastAttemptAt,
    lastReceivedAt: state?.lastReceivedAt, lastStatus: state?.lastStatus, nextRunAt: state?.nextRunAt,
    catalogueQueuedAt: state?.catalogueQueuedAt, message: state?.message || "Ready; no submissions attempted yet." };
}

export async function queueCatalogue() {
  if (!enabled()) throw Object.assign(new Error("IndexNow is disabled in this environment"), { status: 409 });
  await ensureState();
  // A separate lease prevents repeated initial-catalogue requests on multiple replicas.
  const state = await IndexingState.findOneAndUpdate({ _id: STATE_ID,
    $or: [{ catalogueQueuedAt: { $exists: false } }, { catalogueQueuedAt: { $lt: new Date(Date.now() - 86400000) } }],
  }, { $set: { catalogueQueuedAt: new Date() } }, { new: true });
  if (!state) throw Object.assign(new Error("The initial catalogue can be queued at most once per day. Use Retry pending URLs for failures."), { status: 429 });
  try {
    await enqueuePaths(STATIC_PATHS);
    for (const [model, type, filter] of [[Product, "products", { status: "published" }], [Category, "categories", {}], [BlogPost, "resources", { published: true }]]) {
      for await (const item of model.find(filter).select("slug").lean().cursor()) {
        await enqueuePaths([`/${type}/${item.slug}`]);
      }
    }
  } catch (error) {
    await IndexingState.updateOne({ _id: STATE_ID, catalogueQueuedAt: state.catalogueQueuedAt }, { $unset: { catalogueQueuedAt: 1 } });
    throw error;
  }
}

// Model/fetch injection allows meaningful race and failure tests with no database
// credentials, production writes or real search-engine requests.
export async function submitPending({ queue = IndexingQueue, states = IndexingState, fetcher = fetch, active = enabled() } = {}) {
  if (!active) return { skipped: true, message: "IndexNow disabled" };
  if (states === IndexingState) await ensureState();
  const now = new Date();
  const owner = randomUUID();
  const lock = await states.findOneAndUpdate({ _id: STATE_ID, leaseUntil: { $lte: now }, nextRunAt: { $lte: now } },
    { $set: { owner, leaseUntil: new Date(+now + 300000), nextRunAt: new Date(+now + 60000) } }, { new: true });
  if (!lock) return { skipped: true, message: "A submission is running or the retry cooldown has not elapsed." };
  let batch = [];
  let status = 0;
  let message = "No pending URLs are due for submission.";
  let delay = 60000;
  try {
    // Intentionally below the protocol limit of 10,000; bounded worker execution.
    batch = await queue.find({ nextAttemptAt: { $lte: now } }).sort({ nextAttemptAt: 1 }).limit(1000).lean();
    if (!batch.length) return { skipped: true, message };
    const urls = batch.map((item) => canonicalUrl(item._id));
    await states.updateOne({ _id: STATE_ID, owner }, { $set: { lastAttemptAt: now } });
    const keyResponse = await fetcher(KEY_URL, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!keyResponse.ok || !(keyResponse.headers.get("content-type") || "").toLowerCase().startsWith("text/plain") ||
      (await keyResponse.text()).trim() !== INDEXNOW_KEY) {
      status = 403;
      throw new Error("The live UTF-8 ownership key file is missing or incorrect. Deploy it before submitting; pending URLs are retained.");
    }
    const response = await fetcher("https://api.indexnow.org/indexnow", { method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json; charset=utf-8" }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ host: new URL(CANONICAL_ORIGIN).host, key: INDEXNOW_KEY, keyLocation: KEY_URL, urlList: urls }),
    });
    status = response.status;
    message = resultMessage(status);
    delay = retryDelay(status, Math.max(...batch.map((item) => item.attempts)), response.headers.get("retry-after"));
    if ([200, 202].includes(status)) {
      // An edit made while the HTTP request was in flight has a different revision
      // and must survive this acknowledgement.
      await queue.bulkWrite(batch.map((item) => ({ deleteOne: { filter: snapshotFilter(item) } })));
      await states.updateOne({ _id: STATE_ID, owner }, { $set: { lastReceivedAt: new Date() } });
      delay = 60000;
    } else {
      await deferBatch();
    }
    return { status, count: batch.length, message };
  } catch (error) {
    // Do not expose network exception text, configuration or credentials.
    message = status === 403 ? resultMessage(403) : "Submission failed. Pending URLs are retained for retry.";
    delay = retryDelay(status, Math.max(0, ...batch.map((item) => item.attempts)));
    if (batch.length) await deferBatch();
    return { status, count: batch.length, message };
  } finally {
    await states.updateOne({ _id: STATE_ID, owner }, { $set: { leaseUntil: new Date(0), nextRunAt: new Date(Date.now() + delay),
      ...(batch.length ? { lastStatus: status, message } : {}) }, $unset: { owner: 1 } });
  }

  async function deferBatch() {
    await queue.bulkWrite(batch.map((item) => ({ updateOne: { filter: snapshotFilter(item),
      update: { $inc: { attempts: 1 }, $set: { nextAttemptAt: new Date(Date.now() + delay) } } } })));
  }
}

export async function startIndexingWorker() {
  if (!enabled()) return;
  await Promise.all([IndexingQueue.init(), IndexingState.init()]);
  const timer = setInterval(() => { submitPending().catch(() => console.error("[indexnow] Worker failed; durable queue retained")); }, 60000);
  timer.unref();
}
