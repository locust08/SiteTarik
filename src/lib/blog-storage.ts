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

export function readBlogCmsContent() {
  try {
    const raw = window.localStorage.getItem(blogCmsStorageKey);

    if (!raw) {
      return defaultBlogContent;
    }

    const parsed = JSON.parse(raw);
    return isBlogCmsContent(parsed) ? parsed : defaultBlogContent;
  } catch {
    return defaultBlogContent;
  }
}

export function writeBlogCmsContent(content: BlogCmsContent) {
  window.localStorage.setItem(blogCmsStorageKey, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent("sitetarik-blog-cms-updated"));
}

