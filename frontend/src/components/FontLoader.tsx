"use client";

import { useEffect } from "react";

const HREF = "https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@600;800&display=swap";

// Japanese glyphs for kanji marks load after first paint, so they never block rendering.
// Google serves them in unicode-range slices: only the characters on the page download.
export default function FontLoader() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
  return null;
}
