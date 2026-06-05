import type { Metadata } from "next";
import { BlogPostClient } from "@/components/blog-post-client";
import { CivitasFooter } from "@/components/civitas-footer";
import { SiteTarikPublicNav } from "@/components/sitetarik-public-nav";

export const metadata: Metadata = {
  title: "Blog Post | SiteTarik",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <SiteTarikPublicNav activeKey="blog" />
      <BlogPostClient slug={slug} />
      <CivitasFooter />
    </>
  );
}
