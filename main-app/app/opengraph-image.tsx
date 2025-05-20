import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "ALERT - Automated Website Change Detection";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 64,
          background: "black",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: "bold", marginBottom: 40 }}>ALERT</div>
        <div style={{ fontSize: 48, fontWeight: "normal" }}>Automated Website Change Detection</div>
        <div style={{ fontSize: 36, marginTop: 40, opacity: 0.8 }}>
          Secure monitoring through Tor
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}
