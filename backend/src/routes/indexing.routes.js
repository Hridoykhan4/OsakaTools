import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { indexingStatus, queueCatalogue, submitPending } from "../services/indexnow.js";

const router = Router();
router.get("/", requirePermission("dashboard:read"), asyncHandler(async (req, res) => res.json(await indexingStatus())));
router.use(requirePermission("indexing:write"));
router.use((req, res, next) => {
  // The API is on a sibling origin in production; require the exact authorized
  // frontend Origin rather than trusting CORS alone to prevent CSRF.
  const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim());
  if (!req.get("Origin") || !allowed.includes(req.get("Origin"))) return res.status(403).json({ message: "A same-site admin request from an authorized frontend origin is required" });
  next();
});
router.use(rateLimit({ windowMs: 60000, limit: 2, standardHeaders: "draft-7", legacyHeaders: false,
  keyGenerator: () => "indexnow-admin", message: { message: "Please wait before submitting again" } }));
router.post("/catalogue", asyncHandler(async (req, res) => { await queueCatalogue(); res.json(await indexingStatus()); }));
router.post("/retry", asyncHandler(async (req, res) => {
  const result = await submitPending();
  res.json({ ...(await indexingStatus()), result });
}));
export default router;
