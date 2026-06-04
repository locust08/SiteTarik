import type { Metadata } from "next";
import { BlogCmsClient } from "@/components/blog-cms-client";

export const metadata: Metadata = {
  title: "Blog CMS | SiteTarik",
  description: "Simple SiteTarik blog CMS for creating, editing, publishing, and deleting blog content.",
};

export default function CmsPage() {
  return <BlogCmsClient />;
}
