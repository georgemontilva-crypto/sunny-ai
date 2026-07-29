import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command, isSsrBuild }) => ({
  plugins: [
    { enforce: "pre" as const, ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    // Dev-only: adds data-loc attributes for element inspection. Must not
    // ship in the prerendered HTML (leaks source paths, adds noise).
    command === "serve" && jsxLocPlugin(),
    // Skip PWA/service-worker generation for the throwaway SSR bundle used
    // only to prerender HTML — it has no HTML output of its own.
    !isSsrBuild &&
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifest: false, // Use existing client/public/manifest.json
        includeAssets: ["favicon.png", "robots.txt", "icon-192x192.png", "icon-512x512.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          navigateFallback: "/index.html",
        },
        devOptions: {
          enabled: false, // Disable in dev to avoid conflicts
        },
      }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: !isSsrBuild,
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
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
