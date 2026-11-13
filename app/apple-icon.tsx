import { ImageResponse } from "next/og";

// Ícone usado quando alguém adiciona o site à tela inicial do celular (iOS/Android).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0d0d12" }}>
        <svg viewBox="0 0 32 32" width="180" height="180">
          <g fill="none" stroke="#c6ff3d" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 8H20a5 5 0 0 1 0 10H14" />
            <path d="M14 8V23" />
          </g>
          <g fill="#0d0d12" stroke="#c6ff3d" strokeWidth={2}>
            <circle cx="7" cy="8" r="2.4" />
            <circle cx="14" cy="24.6" r="2.4" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
