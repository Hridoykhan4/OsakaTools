// Cloudinary delivery helpers. Transformations are inserted after /upload/ and
// chained with the loader's own resize (f_auto, q_auto, width).
export function cld(url: string | undefined, transform: string) {
  if (!url) return "";
  if (!url.startsWith("https://res.cloudinary.com/") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// Studio photos on white become true cut-outs: the white backdrop is made transparent and the
// margin trimmed, so products sit on any surface and composition is controlled by layout.
export const trimmed = (url?: string) => cld(url, "e_make_transparent:8/e_trim");
