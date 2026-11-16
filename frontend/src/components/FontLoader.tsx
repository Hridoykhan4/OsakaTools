"use client";

import { useEffect } from "react";

// Only the few Japanese characters the site uses (each shown with its translation).
const HREF = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500&display=swap&text=${encodeURIComponent("精度記録誠実計測防護工具大阪品質技術")}`;

// Japanese glyphs load after first paint, so they never block rendering.
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
