// Images are served straight from Cloudinary's CDN with automatic format (AVIF/WebP)
// and quality, resized to the width the browser asks for. Other hosts pass through.
export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/upload/")) {
    return src.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return src;
}
