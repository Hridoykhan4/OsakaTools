import slugify from "slugify";
import mongoose from "mongoose";

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export const toSlug = (value) => slugify(String(value || ""), { lower: true, strict: true, trim: true }).slice(0, 120);

export const isId = (value) => mongoose.isValidObjectId(value);

export function str(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function strList(value, max = 50, len = 300) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => str(v, len)).filter(Boolean).slice(0, max);
}

export function pageParams(query, defLimit = 24, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pagination = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) || 1 });

// Only allow http(s) URLs for anything rendered as a link or image.
export function safeUrl(value) {
  const text = str(value, 1000);
  if (!text) return "";
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const httpError = (status, message) => Object.assign(new Error(message), { status });
