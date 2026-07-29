declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const frontmatter: {
    title: string;
    slug: string;
    date: string;
    description: string;
    category: string;
    readingTimeMinutes: number;
  };
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
