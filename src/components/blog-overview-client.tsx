"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { blogCmsStorageKey, defaultBlogContent, formatBlogDate, type BlogCmsContent } from "@/lib/blog-content";
import { fetchBlogCmsContent, readBlogCmsContent } from "@/lib/blog-storage";

function RevealIcon({ children }: { children: ReactNode }) {
  return (
    <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
      {children}
    </span>
  );
}

export function BlogOverviewClient({ initialContent = defaultBlogContent }: { initialContent?: BlogCmsContent }) {
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

  const posts = content.posts
    .filter((post) => post.status === "published")
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));

  return (
    <main className="min-h-screen bg-[var(--surface)] px-6 pb-10 pt-[118px] text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="border-b border-[var(--border)] pb-8">
          <div className="max-w-[680px]">
            <h1 className="font-[family-name:var(--font-heading)] text-[3.4rem] font-semibold leading-none tracking-[-0.04em] sm:text-[5rem]">
              {content.overview.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--muted)] sm:text-lg">
              {content.overview.intro}
            </p>
          </div>
        </header>

        {posts.length > 0 ? (
          <section className="grid gap-6 py-10 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-[8px] border border-[var(--border)] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow,transform] duration-500 ease-out hover:-translate-y-0.5 hover:border-[rgba(238,32,40,0.2)] hover:shadow-[0_16px_34px_rgba(0,0,0,0.08)]"
              >
                <Link href={`/blog/${post.slug}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4">
                  <img
                    src={post.thumbnailImage}
                    alt=""
                    className="h-64 w-full bg-[var(--surface-muted)] object-cover"
                  />
                  <div className="p-6">
                    <time className="text-sm font-medium text-[var(--muted)]">
                      {formatBlogDate(post.publishDate)}
                    </time>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em]">
                      {post.title}
                    </h2>
                    <p className="mt-4 text-base leading-7 text-[var(--muted)]">{post.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(238,32,40,0.16)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--gold)] transition-[background-color,border-color,box-shadow,color] duration-200 group-hover:border-[rgba(238,32,40,0.22)] group-hover:bg-[var(--gold-soft)] group-hover:shadow-[0_10px_22px_rgba(238,32,40,0.08)]">
                      Read More
                      <RevealIcon>
                        <ArrowRight className="h-4 w-4" />
                      </RevealIcon>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        ) : (
          <section className="py-16">
            <p className="text-base leading-7 text-[var(--muted)]">
              No published blog posts yet. Open the CMS and publish one when it is ready.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
