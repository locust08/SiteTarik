import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "@/components/blog-post-client";
import { CivitasFooter } from "@/components/civitas-footer";
import { SiteTarikPublicNav } from "@/components/sitetarik-public-nav";
import { getServerBlogCmsContent } from "@/lib/blog-content-server";
import { isVisiblePublishedBlogPost } from "@/lib/blog-content";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: "SiteTarik | Blog Post",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { content } = await getServerBlogCmsContent();
  const post = content.posts.find((item) => item.slug === slug && isVisiblePublishedBlogPost(item));

  if (!post) {
    return fallbackMetadata;
  }

  return {
    title: `SiteTarik | ${post.title}`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { content } = await getServerBlogCmsContent();
  const post = content.posts.find((item) => item.slug === slug && isVisiblePublishedBlogPost(item));

  if (!post) {
    notFound();
  }

  return (
    <>
      <SiteTarikPublicNav activeKey="blog" />
      <BlogPostClient slug={slug} initialContent={content} />
      <CivitasFooter />
    </>
  );
}
