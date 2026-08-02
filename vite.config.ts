import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type Plugin } from "vite";

// Favicon links are static markup in client/index.html, outside the
// per-route head-tag templating prerender.mjs does — rewritten here so an
// admin-uploaded favicon-svg/favicon-png slot actually takes effect.
function faviconFromMediaMap(): Plugin {
  return {
    name: "favicon-from-media-map",
    transformIndexHtml(html) {
      const mapPath = path.resolve(import.meta.dirname, "client", "src", "generated", "media-map.json");
      let map: Record<string, { base?: string }> = {};
      try {
        map = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
      } catch {
        return html;
      }
      return html
        .replace('href="/favicon.svg"', `href="${map["favicon-svg"]?.base ?? "/favicon.svg"}"`)
        .replace('href="/favicon.png"', `href="${map["favicon-png"]?.base ?? "/favicon.png"}"`);
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    { enforce: "pre" as const, ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    faviconFromMediaMap(),
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
