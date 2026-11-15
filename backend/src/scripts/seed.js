import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ensureTaxonomy } from "../seed/taxonomy.js";

await connectDB();
const result = await ensureTaxonomy();
console.log("[seed] done", result);
await mongoose.disconnect();
