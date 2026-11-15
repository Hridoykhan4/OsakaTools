// Usage: node src/scripts/import.js [preview|commit] [--no-publish]
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ensureTaxonomy } from "../seed/taxonomy.js";
import { runImport } from "../services/importService.js";

const mode = process.argv[2] === "commit" ? "commit" : "preview";
await connectDB();
await ensureTaxonomy();
const job = await runImport({ mode, autoPublish: !process.argv.includes("--no-publish"), actor: "cli" });
console.log(JSON.stringify({ status: job.status, stats: job.stats, errors: job.errorLog }, null, 2));
for (const item of job.items.filter((i) => i.action !== "skip")) console.log(`  ${item.action.padEnd(16)} ${item.category || ""}  ${item.name}`);
await mongoose.disconnect();
process.exit(job.status === "completed" ? 0 : 1);
