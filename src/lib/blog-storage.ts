"use client";

import {
  blogCmsStorageKey,
  defaultBlogContent,
  type BlogCmsContent,
} from "@/lib/blog-content";

function isBlogCmsContent(value: unknown): value is BlogCmsContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<BlogCmsContent>;
  return Boolean(content.overview && Array.isArray(content.posts));
}

function shouldUseDefaultOverview(content: BlogCmsContent) {
  const title = content.overview.title.trim().toLowerCase();
  const intro = content.overview.intro.trim().toLowerCase();

  return (
    !title ||
    !intro ||
    title === "blog" ||
    title.startsWith("what is sitetarik") ||
    intro.startsWith("sitetarik helps smes refresh their existing")
  );
}

function normaliseBlogCmsContent(content: BlogCmsContent): BlogCmsContent {
  if (!shouldUseDefaultOverview(content)) {
    return content;
  }

  return {
    ...content,
    overview: defaultBlogContent.overview,
  };
}

export function readBlogCmsContent() {
  try {
    const raw = window.localStorage.getItem(blogCmsStorageKey);

    if (!raw) {
      return defaultBlogContent;
    }

    const parsed = JSON.parse(raw);
    return isBlogCmsContent(parsed) ? normaliseBlogCmsContent(parsed) : defaultBlogContent;
  } catch {
    return defaultBlogContent;
  }
}

export function writeBlogCmsContent(content: BlogCmsContent) {
  window.localStorage.setItem(blogCmsStorageKey, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent("sitetarik-blog-cms-updated"));
}
