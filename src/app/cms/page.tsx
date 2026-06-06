import type { Metadata } from "next";
import { BlogCmsClient } from "@/components/blog-cms-client";

export const metadata: Metadata = {
  title: "SiteTarik | Blog CMS",
  description: "Simple SiteTarik blog CMS for creating, editing, publishing, and deleting blog content.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CmsPage() {
  return <BlogCmsClient />;
}
