import type { Metadata } from "next";
import { BlogBriefPage } from "@/components/blog-brief-page";

export const metadata: Metadata = {
  title: "Complete Your Blog Brief | SiteTarik",
  description:
    "Finish your SEO Enhancement blog brief after payment so we can build the 12-page add-on faster.",
};

export default function BlogBriefRoute() {
  return <BlogBriefPage />;
}
