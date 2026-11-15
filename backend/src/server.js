import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startIndexingWorker } from "./services/indexnow.js";
import { bootstrapOwner } from "./controllers/auth.controller.js";
import { ensureTaxonomy } from "./seed/taxonomy.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await ensureTaxonomy(); // idempotent: only inserts missing categories/articles
    await bootstrapOwner();
    await startIndexingWorker();
    const server = app.listen(PORT, () => console.log(`[server] OSAKA TOOL API listening on :${PORT}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
}

start();
