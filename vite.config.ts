import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

// Favicon <link>s used to be rewritten here via transformIndexHtml, but that
// only runs on `vite build` — a live republish (server/republish.ts) never
// re-runs vite build, only scripts/prerender.mjs, so a plugin-only fix would
// go stale the moment someone replaces favicon-svg/favicon-png through the
// panel without a full redeploy. prerender.mjs now does this substitution
// instead, every time it runs, against the freshest media-map.json — so
// dist/index.html here stays the literal, unresolved template.

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    { enforce: "pre" as const, ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@server": path.resolve(import.meta.dirname, "server"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: !isSsrBuild,
    rollupOptions: {
      output: {
        manualChunks: isSsrBuild
          ? undefined
          : {
              "react-vendor": ["react", "react-dom"],
              motion: ["framer-motion"],
              icons: ["lucide-react"],
            },
      },
    },
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
