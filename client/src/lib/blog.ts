import type { ComponentType } from "react";

export interface BlogPostMeta {
  title: string;
  slug: string;
  date: string;
  description: string;
  category: string;
  readingTimeMinutes: number;
}

interface BlogModule {
  frontmatter: BlogPostMeta;
  default: ComponentType;
}

// Path is relative to this file (client/src/lib/blog.ts) so it resolves to
// <repo-root>/content/blog regardless of Vite's `root` (set to client/).
const modules = import.meta.glob<BlogModule>("../../../content/blog/*.mdx", {
  eager: true,
});

interface Post {
  meta: BlogPostMeta;
  Component: ComponentType;
}

const posts: Post[] = Object.values(modules)
  .map((mod) => ({ meta: mod.frontmatter, Component: mod.default }))
  .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());

export function getAllPosts(): BlogPostMeta[] {
  return posts.map((p) => p.meta);
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.meta.slug === slug);
}
