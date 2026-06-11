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

export async function fetchBlogCmsContent() {
  const response = await fetch("/api/cms/content", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load CMS content.");
  }

  const content = (await response.json()) as unknown;

  return isBlogCmsContent(content) ? normaliseBlogCmsContent(content) : defaultBlogContent;
}

export async function verifyBlogCmsPassword(password: string) {
  const response = await fetch("/api/cms/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error || "Password incorrect. Please try again.");
  }
}

export async function saveBlogCmsContent(content: BlogCmsContent) {
  const response = await fetch("/api/cms/content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error || "Could not save CMS content.");
  }
}

export async function uploadBlogCmsImage(file: File) {
  const formData = new FormData();
  formData.set("image", file);

  const response = await fetch("/api/cms/upload-image", {
    method: "POST",
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as {
    imageUrl?: string;
    error?: string;
  } | null;

  if (!response.ok || !result?.imageUrl) {
    throw new Error(result?.error || "Could not upload this image.");
  }

  return result.imageUrl;
}
