import multer from "multer";

// Files are held in memory, checked by content signature (not just the
// client-supplied MIME type), then streamed to Cloudinary.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 10 },
});

const SIGNATURES = [
  { kind: "image", format: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { kind: "image", format: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { kind: "image", format: "webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { kind: "image", format: "avif", test: (b) => b.subarray(4, 12).toString() === "ftypavif" },
  { kind: "document", format: "pdf", test: (b) => b.subarray(0, 5).toString() === "%PDF-" },
];

export function detectFile(buffer) {
  return SIGNATURES.find((s) => buffer.length > 12 && s.test(buffer)) || null;
}
