import type { Metadata } from "next";
import { BlogOverviewClient } from "@/components/blog-overview-client";
import { CivitasFooter } from "@/components/civitas-footer";
import { SiteTarikPublicNav } from "@/components/sitetarik-public-nav";
import { getServerBlogCmsContent } from "@/lib/blog-content-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SiteTarik | Blog",
  description:
    "Useful tips and simple guides to help your business improve online visibility, build trust, and get more enquiries.",
};

export default async function BlogPage() {
  const { content } = await getServerBlogCmsContent();

  return (
    <>
      <SiteTarikPublicNav activeKey="blog" />
      <BlogOverviewClient initialContent={content} />
      <CivitasFooter />
    </>
  );
}
