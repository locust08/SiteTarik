import type { Metadata } from "next";
import { BlogPostClient } from "@/components/blog-post-client";

export const metadata: Metadata = {
  title: "Blog Post | SiteTarik",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BlogPostClient slug={slug} />;
}

