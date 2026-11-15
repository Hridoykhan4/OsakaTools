import mongoose from "mongoose";

// Databases this application must never write to (Osaka Toyo production data).
const FORBIDDEN_DBS = new Set(["osaka_toyo", "osakatoyo"]);

export function resolveDbName(env = process.env) {
  const dbName = env.MONGODB_DB || "osaka_tool";
  if (FORBIDDEN_DBS.has(dbName.toLowerCase())) {
    throw new Error(`Refusing to use database "${dbName}": OSAKA TOOL is isolated from Osaka Toyo data`);
  }
  return dbName;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const dbName = resolveDbName();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });
  console.log(`[db] connected to database "${dbName}"`);
  mongoose.connection.on("error", (err) => console.error("[db] connection error:", err.message));
}
