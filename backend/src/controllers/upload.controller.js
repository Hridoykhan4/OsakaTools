import cloudinary from "../config/cloudinary.js";
import MediaAsset from "../models/MediaAsset.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { detectFile } from "../middleware/upload.js";
import { audit } from "../services/audit.js";
import { httpError, str } from "../utils/validate.js";

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result))).end(buffer);
  });
}

async function store(file, req) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw httpError(503, "Media storage is not configured on the server");
  const type = detectFile(file.buffer);
  if (!type) throw httpError(415, `${file.originalname}: only JPG, PNG, WebP, AVIF images and PDF documents are accepted`);
  const folder = `${process.env.CLOUDINARY_FOLDER || "OsakaTool"}/${type.kind === "image" ? "images" : "documents"}`;
  const result = await uploadBuffer(file.buffer, type.kind === "image"
    ? { folder, resource_type: "image", transformation: [{ width: 2000, height: 2000, crop: "limit", quality: "auto" }] }
    : { folder, resource_type: "raw", format: "pdf" });
  await MediaAsset.create({ url: result.secure_url, publicId: result.public_id, kind: type.kind, format: type.format,
    bytes: result.bytes || file.size, originalName: str(file.originalname, 200), uploadedBy: req.admin.username });
  return { url: result.secure_url, publicId: result.public_id, kind: type.kind, format: type.format, name: str(file.originalname, 200) };
}

export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, "No file uploaded");
  const file = await store(req.file, req);
  await audit(req, "upload", "media", file.publicId, `Uploaded ${file.kind} ${file.name}`);
  res.status(201).json(file);
});

export const uploadMany = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw httpError(400, "No files uploaded");
  const files = [];
  for (const f of req.files) files.push(await store(f, req));
  await audit(req, "upload", "media", "", `Uploaded ${files.length} files`);
  res.status(201).json({ files });
});

export const listMedia = asyncHandler(async (req, res) => {
  res.json({ media: await MediaAsset.find(req.query.kind ? { kind: String(req.query.kind) } : {}).sort({ createdAt: -1 }).limit(200).lean() });
});
