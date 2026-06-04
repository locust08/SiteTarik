import type { Metadata } from "next";
import { BlogOverviewClient } from "@/components/blog-overview-client";
import { CivitasFooter } from "@/components/civitas-footer";
import { SiteTarikPublicNav } from "@/components/sitetarik-public-nav";

export const metadata: Metadata = {
  title: "Blog | SiteTarik",
  description:
    "Useful tips and simple guides to help your business improve online visibility, build trust, and get more enquiries.",
};

export default function BlogPage() {
  return (
    <>
      <SiteTarikPublicNav activeKey="blog" />
      <BlogOverviewClient />
      <CivitasFooter />
    </>
  );
}
