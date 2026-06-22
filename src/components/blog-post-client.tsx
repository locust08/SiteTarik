"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import {
  blogCmsStorageKey,
  defaultBlogContent,
  formatBlogDate,
  isVisiblePublishedBlogPost,
  type BlogCmsContent,
} from "@/lib/blog-content";
import { fetchBlogCmsContent, readBlogCmsContent } from "@/lib/blog-storage";
import { AiEmphasizedParagraphs } from "@/components/blog-ai-emphasis";
import { getSiteTarikWhatsAppHref, SITE_TARIK_CHATBOT_WHATSAPP_URL } from "@/lib/whatsapp";

function RevealIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
      {children}
    </span>
  );
}

function Paragraphs({ text, maxHighlights = 3 }: { text: string; maxHighlights?: number }) {
  return (
    <AiEmphasizedParagraphs
      text={text}
      maxHighlights={maxHighlights}
      paragraphClassName="mt-4 text-base leading-8 text-[var(--muted)]"
    />
  );
}

export function BlogPostClient({
  slug,
  initialContent = defaultBlogContent,
}: {
  slug: string;
  initialContent?: BlogCmsContent;
}) {
  const [content, setContent] = useState<BlogCmsContent>(initialContent);

  useEffect(() => {
    const syncContent = () => setContent(readBlogCmsContent());
    const syncServerContent = async () => {
      try {
        const serverContent = await fetchBlogCmsContent();
        setContent(serverContent);
        window.localStorage.setItem(blogCmsStorageKey, JSON.stringify(serverContent));
      } catch {
        syncContent();
      }
    };

    void syncServerContent();
    window.addEventListener("storage", syncContent);
    window.addEventListener("sitetarik-blog-cms-updated", syncContent);

    return () => {
      window.removeEventListener("storage", syncContent);
      window.removeEventListener("sitetarik-blog-cms-updated", syncContent);
    };
  }, []);

  const post = content.posts.find((item) => item.slug === slug && isVisiblePublishedBlogPost(item));

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6 text-center text-[var(--foreground)]">
        <div className="max-w-[34rem]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
            Blog
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Post not found</h1>
          <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
        </div>
      </main>
    );
  }

  const featuredImageTitle = `${post.title} article image`;
  const ctaLinkTitle = post.ctaButtonText || "Contact SiteTarik";
  const ctaHref = post.ctaHref === SITE_TARIK_CHATBOT_WHATSAPP_URL
    ? getSiteTarikWhatsAppHref({ fallbackHref: SITE_TARIK_CHATBOT_WHATSAPP_URL })
    : post.ctaHref;
  const ctaEvent = ctaHref.includes("wa.me") || ctaHref.includes("whatsapp") || ctaHref.includes("/wa/")
    ? "site_tarik_whatsapp_click"
    : "site_tarik_blog_cta_click";

  return (
    <main className="min-h-screen bg-[var(--surface)] px-6 pb-10 pt-[118px] text-[var(--foreground)] sm:px-8 lg:px-10">
      <article className="mx-auto w-full max-w-[920px]">
        <TrackedLink
          href="/blog"
          title="Blog Overview"
          className="group mb-7 mt-3 inline-flex items-center gap-2.5 text-base font-semibold text-[var(--gold)] transition-colors duration-200 hover:text-[#d81c23] sm:mb-8 sm:mt-5"
          trackingEvent="site_tarik_navigation_click"
          trackingLabel="Blog Overview"
          trackingLocation="blog_post_back_link"
          trackingPayload={{
            blog_slug: post.slug,
            blog_title: post.title,
          }}
        >
          <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Blog Overview
        </TrackedLink>
        <img
          src={post.featuredImage}
          alt={featuredImageTitle}
          title={featuredImageTitle}
          className="h-[360px] w-full rounded-[8px] bg-[var(--surface-muted)] object-cover sm:h-[440px]"
        />
        <div className="mt-8">
          <p className="text-sm font-medium text-[var(--muted)]">
            {formatBlogDate(post.publishDate)} · {post.readTime}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[4.6rem]">
            {post.title}
          </h1>
          <div className="mt-6 border-b border-[var(--border)] pb-8">
            <Paragraphs text={post.simpleIntro} />
          </div>
        </div>

        <div className="py-4">
          {post.sections.map((section, index) => (
            <section key={section.id} className="border-b border-[var(--border)] py-8">
              <p className="text-sm font-semibold text-[var(--gold)]">Section {index + 1}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{section.heading}</h2>
              <Paragraphs text={section.body} maxHighlights={3} />
            </section>
          ))}
        </div>

        <section className="my-8 rounded-[8px] bg-[#111111] px-6 py-8 text-white sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">{post.ctaTitle}</h2>
          <p className="mt-3 max-w-[40rem] text-base leading-7 text-white/74">{post.ctaText}</p>
          <TrackedLink
            href={ctaHref}
            title={ctaLinkTitle}
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#d81c23]"
            trackingEvent={ctaEvent}
            trackingLabel={post.ctaButtonText}
            trackingLocation="blog_post_cta"
            trackingPayload={{
              blog_slug: post.slug,
              blog_title: post.title,
              cta_title: post.ctaTitle,
            }}
          >
            {post.ctaButtonText}
            <RevealIcon>
              <ArrowRight className="h-4 w-4" />
            </RevealIcon>
          </TrackedLink>
        </section>
      </article>
    </main>
  );
}
