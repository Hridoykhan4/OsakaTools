import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbfaf7", flexDirection: "column" }}>
      <div style={{ width: 88, height: 88, borderRadius: 999, background: "#bc002d" }} /><div style={{ width: 120, height: 4, marginTop: 14, background: "#17181a" }} />
    </div>,
    size
  );
}
