import { defineConfig } from "vite";

// Source page lives in web/; the production build goes to docs/, which GitHub Pages serves
// (Settings → Pages → main /docs). Relative base so it works under any path or custom domain.
export default defineConfig({
  root: "web",
  base: "./",
  build: { outDir: "../docs", emptyOutDir: true },
  test: { root: ".", environment: "node" },
} as never);
