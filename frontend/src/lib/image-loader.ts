// Images are served straight from Cloudinary's CDN with automatic format (AVIF/WebP)
// and quality, resized to the width the browser asks for. The resize is chained AFTER
// any art-direction transforms already in the URL (crops, cut-outs), so pixel crops
// apply to the original image. Other hosts pass through unchanged.
export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const marker = "/upload/";
  const at = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || at < 0) return src;
  const head = src.slice(0, at + marker.length);
  const rest = src.slice(at + marker.length);
  const resize = `f_auto,q_auto,c_limit,w_${width}/`;
  const version = rest.search(/(^|\/)v\d+\//);
  if (version < 0) return `${head}${resize}${rest}`;
  const cut = version === 0 ? 0 : version + 1;
  return `${head}${rest.slice(0, cut)}${resize}${rest.slice(cut)}`;
}
