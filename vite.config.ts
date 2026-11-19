import { defineConfig } from "vite";

// Relative base so the build works under any GitHub Pages path.
// Output goes to docs/, which GitHub Pages can serve directly (Settings → Pages → main /docs).
export default defineConfig({
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
  test: { environment: "node" },
} as never);
