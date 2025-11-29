import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Required for SharedArrayBuffer support (Linera WASM)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
  // Exclude packages from server-side bundling - they're browser-only
  serverExternalPackages: [
    "@linera/client",
    "pino",
    "thread-stream",
    "pino-pretty",
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
  ],
  // Empty turbopack config to acknowledge we're using turbopack
  turbopack: {},
};

export default nextConfig;
