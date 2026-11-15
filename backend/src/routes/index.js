import { Router } from "express";
import rateLimit from "express-rate-limit";
import { attachAdmin, requireAuth, requirePermission as perm } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as auth from "../controllers/auth.controller.js";
import * as products from "../controllers/product.controller.js";
import * as categories from "../controllers/category.controller.js";
import * as meta from "../controllers/catalog-meta.controller.js";
import * as inquiries from "../controllers/inquiry.controller.js";
import * as blog from "../controllers/blog.controller.js";
import * as uploads from "../controllers/upload.controller.js";
import * as ops from "../controllers/ops.controller.js";

const limiter = (windowMinutes, limit, message) => rateLimit({
  windowMs: windowMinutes * 60000, limit, standardHeaders: "draft-7", legacyHeaders: false, message: { message },
});

const router = Router();

// ---- auth & users ----
router.post("/auth/login", limiter(15, 10, "Too many login attempts. Try again in 15 minutes."), auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);
router.post("/auth/password", requireAuth, limiter(15, 10, "Too many attempts"), auth.changePassword);
router.get("/users", perm("users:manage"), auth.listUsers);
router.post("/users", perm("users:manage"), auth.createUser);
router.put("/users/:id", perm("users:manage"), auth.updateUser);

// ---- catalog (public reads; drafts visible to signed-in staff) ----
router.get("/products", attachAdmin, products.listProducts);
router.get("/products/compare", products.compareProducts);
router.get("/products/id/:id", perm("dashboard:read"), products.getProductById);
router.get("/products/id/:id/history", perm("dashboard:read"), products.productHistory);
router.post("/products/bulk", perm("catalog:write"), products.bulkProducts);
router.get("/products/:slug", attachAdmin, products.getProduct);
router.post("/products", perm("catalog:write"), products.createProduct);
router.put("/products/:id", perm("catalog:write"), products.updateProduct);
router.delete("/products/:id", perm("catalog:delete"), products.deleteProduct);

router.get("/categories", attachAdmin, categories.listCategories);
router.get("/categories/:slug", attachAdmin, categories.getCategory);
router.post("/categories", perm("catalog:write"), categories.createCategory);
router.put("/categories/:id", perm("catalog:write"), categories.updateCategory);
router.delete("/categories/:id", perm("catalog:delete"), categories.deleteCategory);

router.get("/brands", attachAdmin, meta.listBrands);
router.post("/brands", perm("catalog:write"), meta.createBrand);
router.put("/brands/:id", perm("catalog:write"), meta.updateBrand);
router.delete("/brands/:id", perm("catalog:delete"), meta.deleteBrand);

// ---- documents & evidence ----
router.get("/documents/public", meta.listPublicDocuments);
router.get("/documents", perm("dashboard:read"), meta.listDocuments);
router.post("/documents", perm("documents:write"), meta.createDocument);
router.put("/documents/:id", perm("documents:write"), meta.updateDocument);
router.delete("/documents/:id", perm("documents:verify"), meta.deleteDocument);

// ---- inquiries / RFQ / organizations ----
router.post("/inquiries", limiter(15, 8, "Too many submissions. Please try again later."), inquiries.submitInquiry);
router.get("/inquiries", perm("dashboard:read"), inquiries.listInquiries);
router.put("/inquiries/:id", perm("inquiries:write"), inquiries.updateInquiry);
router.delete("/inquiries/:id", perm("inquiries:delete"), inquiries.deleteInquiry);
router.get("/organizations", perm("dashboard:read"), inquiries.listOrganizations);
router.post("/organizations", perm("inquiries:write"), inquiries.upsertOrganization);
router.put("/organizations/:id", perm("inquiries:write"), inquiries.upsertOrganization);

// ---- articles ----
router.get("/articles", attachAdmin, blog.listPosts);
router.get("/articles/:slug", attachAdmin, blog.getPost);
router.post("/articles", perm("content:write"), blog.createPost);
router.put("/articles/:id", perm("content:write"), blog.updatePost);
router.delete("/articles/:id", perm("catalog:delete"), blog.deletePost);

// ---- media ----
router.post("/upload/single", perm("media:write"), upload.single("file"), uploads.uploadSingle);
router.post("/upload/multiple", perm("media:write"), upload.array("files", 10), uploads.uploadMany);
router.get("/media", perm("dashboard:read"), uploads.listMedia);

// ---- operations ----
router.get("/stats", perm("dashboard:read"), ops.stats);
router.get("/audit", perm("audit:read"), ops.listAudit);
router.get("/imports", perm("dashboard:read"), ops.listImports);
router.get("/imports/:id", perm("dashboard:read"), ops.getImport);
router.post("/imports", perm("imports:preview"), limiter(5, 5, "Please wait before starting another import"), ops.startImport);

export default router;
