import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f97316, #dc2626)",
          fontSize: 18,
        }}
      >
        <span style={{ color: "white", fontWeight: 800 }}>TB</span>
      </div>
    ),
    { ...size }
  );
}
