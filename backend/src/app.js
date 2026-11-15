import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import apiRoutes from "./routes/index.js";
import indexingRoutes from "./routes/indexing.routes.js";
import { requireTrustedOrigin } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Requests arrive through the platform proxy and the Next.js /api rewrite.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 2));
app.disable("x-powered-by");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  res.set({
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});
if (process.env.NODE_ENV !== "test") app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(db === "connected" || process.env.NODE_ENV === "test" ? 200 : 503).json({
    status: db === "connected" ? "ok" : "degraded",
    service: "osaka-tool-api",
    database: db,
    dbName: mongoose.connection.name || null,
    time: new Date().toISOString(),
  });
});

app.use("/api", requireTrustedOrigin);
app.use("/api/indexing", indexingRoutes);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
