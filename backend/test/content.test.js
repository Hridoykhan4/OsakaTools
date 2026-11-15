import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product, { publicationBlockers } from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import BlogPost from "../src/models/BlogPost.js";
import { IndexingQueue } from "../src/models/SearchIndexing.js";
import { updateProduct } from "../src/controllers/product.controller.js";
import { updateCategory } from "../src/controllers/category.controller.js";
import { updatePost } from "../src/controllers/blog.controller.js";
import { commitContent } from "../src/services/indexnow.js";

mongoose.set("bufferCommands", false); // audit writes fail fast without a database
const ID = "64b7f0c2a1b2c3d4e5f60718";

function invoke(controller, body) {
  return new Promise((resolve, reject) => {
    controller({ params: { id: ID }, body, admin: { username: "t", role: "admin" } }, { json: resolve }, reject);
  });
}

for (const [label, model, controller, body] of [
  ["product", Product, updateProduct, { name: "Renamed instrument" }],
  ["category", Category, updateCategory, { name: "Renamed category" }],
  ["article", BlogPost, updatePost, { title: "Renamed article" }],
]) test(`${label} rename preserves URL, publication state and existing descriptions`, async () => {
  const previous = model.findById;
  let saved = false;
  const doc = { name: "Original", title: "Original", slug: "established-url", published: false, status: "draft",
    description: "Administrator description", shortDescription: "Administrator summary", content: "Administrator article",
    images: [], manufacturer: "", toObject() { return { ...this }; }, save: async () => { saved = true; } };
  model.findById = async () => doc;
  try {
    await invoke(controller, body);
    assert.equal(doc.slug, "established-url");
    assert.equal(doc.published, false);
    assert.equal(doc.description, "Administrator description");
    assert.equal(doc.content, "Administrator article");
    assert.equal(saved, true);
  } finally { model.findById = previous; }
});

test("publication requires complete, documented records", () => {
  const complete = { images: [{ url: "https://x/y.jpg" }], manufacturer: "Maker", shortDescription: "Summary", privateLabel: { status: "none" } };
  assert.deepEqual(publicationBlockers(complete), []);
  assert.equal(publicationBlockers({ ...complete, images: [] }).length, 1);
  assert.match(publicationBlockers({ ...complete, privateLabel: { status: "pending" } })[0], /Private-label/);
  const medical = { ...complete, regulatory: { isMedical: true, markets: [{ region: "EU", status: "registered", evidence: null }] } };
  assert.match(publicationBlockers(medical)[0], /Medical device/);
  medical.regulatory.markets[0].evidence = ID;
  assert.deepEqual(publicationBlockers(medical), []);
});

test("product status drives the public published flag", async () => {
  const p = new Product({ name: "X", slug: "x", category: ID, status: "published" });
  await p.validate();
  assert.equal(p.published, true);
  p.status = "review";
  await p.validate();
  assert.equal(p.published, false);
});

test("content and outbox use the same production database transaction", async () => {
  const names = ["NODE_ENV", "DEPLOYMENT_ENV", "INDEXNOW_ENABLED", "PUBLIC_SITE_URL"];
  const before = names.map((name) => process.env[name]);
  const transaction = mongoose.connection.transaction;
  const update = IndexingQueue.updateOne;
  const session = { testSession: true };
  let transactionCalls = 0, queueWrites = 0;
  Object.assign(process.env, { NODE_ENV: "production", DEPLOYMENT_ENV: "production", INDEXNOW_ENABLED: "true", PUBLIC_SITE_URL: "https://osakatool.com" });
  mongoose.connection.transaction = async (fn) => { transactionCalls++; return fn(session); };
  IndexingQueue.updateOne = async (filter, operation, options) => {
    assert.equal(options.session, session); assert.equal(options.upsert, true); queueWrites++;
  };
  try {
    const result = await commitContent(["/products/meter"], async (received) => { assert.equal(received, session); return "committed"; });
    assert.equal(result, "committed"); assert.equal(transactionCalls, 1); assert.equal(queueWrites, 1);
    IndexingQueue.updateOne = async () => { throw new Error("simulated durable queue failure"); };
    await assert.rejects(commitContent(["/products/meter"], async () => "uncommitted"), /durable queue failure/);
  } finally {
    mongoose.connection.transaction = transaction; IndexingQueue.updateOne = update;
    names.forEach((name, i) => { if (before[i] === undefined) delete process.env[name]; else process.env[name] = before[i]; });
  }
});
