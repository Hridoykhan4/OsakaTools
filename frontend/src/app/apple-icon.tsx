import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f6", flexDirection: "column" }}>
      <div style={{ width: 64, height: 64, background: "#c8102e" }} />
    </div>,
    size
  );
}
