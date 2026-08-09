import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@aks/core", "@dennislee928/nothingx-react-components"],
  // three.js / R3F packages ship ESM that Next needs to transpile in standalone builds
  serverExternalPackages: ["three", "mermaid"],
};

export default nextConfig;
