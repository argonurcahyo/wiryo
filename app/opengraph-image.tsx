import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wiryo – Family Tree";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "rgba(255,255,255,0.15)",
            fontSize: 64,
            marginBottom: 32,
          }}
        >
          🌳
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 20,
          }}
        >
          Wiryo
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 500,
            color: "#a7f3d0",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Aplikasi Pohon Keluarga Multi-Generasi
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
            marginTop: 48,
          }}
        >
          {["Manajemen Anggota", "Visualisasi Silsilah", "Export PNG & PDF"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#d1fae5",
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
