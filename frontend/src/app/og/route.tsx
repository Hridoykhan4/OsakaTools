import { ImageResponse } from "next/og";

// Dynamic Open Graph image: /og?title=...
export function GET(request: Request) {
  const title = (new URL(request.url).searchParams.get("title") || "Precision instruments for professionals worldwide").slice(0, 110);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#fbfaf7", color: "#17181a", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "#bc002d" }} />
        <div style={{ fontSize: 34, letterSpacing: 10, fontWeight: 700 }}>OSAKA TOOL</div>
      </div>
      <div style={{ display: "flex", fontSize: title.length > 60 ? 58 : 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#61676e", borderTop: "2px solid #dedad0", paddingTop: 24 }}>
        <span>Test & measurement · Laboratory · Industrial · Medical</span>
        <span style={{ color: "#bc002d" }}>osakatool.com</span>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, immutable" } }
  );
}
