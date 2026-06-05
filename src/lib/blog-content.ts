export type BlogOverviewContent = {
  title: string;
  intro: string;
};

export type BlogSection = {
  id: string;
  heading: string;
  body: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  publishDate: string;
  readTime: string;
  excerpt: string;
  thumbnailImage: string;
  featuredImage: string;
  simpleIntro: string;
  sections: BlogSection[];
  ctaTitle: string;
  ctaText: string;
  ctaButtonText: string;
  ctaHref: string;
};

export type BlogCmsContent = {
  overview: BlogOverviewContent;
  posts: BlogPost[];
};

export const blogCmsStorageKey = "sitetarik_blog_cms_content_v1";

export const defaultBlogContent: BlogCmsContent = {
  overview: {
    title: "Website Growth Insights for SMEs",
    intro:
      "Practical guides from SiteTarik to help SMEs improve website clarity, Google visibility, trust, and enquiries with a more strategic online presence.",
  },
  posts: [
    {
      id: "default-kuala-lumpur-enquiries",
      slug: "small-businesses-kuala-lumpur-get-more-enquiries-online",
      status: "published",
      title: "How Small Businesses in Kuala Lumpur Can Get More Enquiries Online",
      publishDate: "2026-06-04",
      readTime: "3 min read",
      excerpt: "Simple ways to help your business look trusted and get more customer enquiries.",
      thumbnailImage: "/Image/SME%20Image.webp",
      featuredImage: "/Image/SME%20Image.webp",
      simpleIntro:
        "Getting more enquiries online does not always need a big budget. For many Malaysian SMEs, the first step is making sure customers can understand your business, trust your service, and contact you easily.\n\nThis guide shares simple ways to improve your website or online presence so more potential customers can reach out.",
      sections: [
        {
          id: "clear-service",
          heading: "Make Your Service Clear",
          body:
            "Customers should quickly understand what your business offers.\n\nKeep your main message simple. Mention your main service, who it is for, and where you serve. Avoid long explanations that make customers unsure.\n\nExample:\n\nWe provide air-conditioner servicing for homes and offices in Kuala Lumpur.\n\nThis is easier to understand than a long company introduction.",
        },
        {
          id: "show-trust",
          heading: "Show Trust Clearly",
          body:
            "Before customers contact a business, they usually want to feel confident.\n\nYou can build trust by showing customer reviews, past work photos, service areas, business contact details, and clear pricing or package information.\n\nFor SMEs, simple proof is often enough. The goal is to help customers feel safe before they send a message or request a quote.",
        },
        {
          id: "easy-contact",
          heading: "Make Contact Easy",
          body:
            "Your website should make it easy for customers to take the next step.\n\nUse clear buttons such as WhatsApp Us, Get a Quote, Book a Call, or Request Consultation.\n\nPlace the button near the top of the page and again near the bottom. This helps customers contact you when they are ready.",
        },
        {
          id: "local-keywords",
          heading: "Use Local Keywords Naturally",
          body:
            "If your business serves a specific area, mention the location naturally in your content.\n\nExamples include air-conditioner service in Kuala Lumpur, plumber in Shah Alam, cafe catering in Petaling Jaya, or accounting service for Malaysian SMEs.\n\nDo not repeat the keyword too many times. Use it naturally so the content still sounds helpful and easy to read.",
        },
        {
          id: "keep-updated",
          heading: "Keep Your Website Updated",
          body:
            "An updated website helps customers know your business is active.\n\nYou can update service details, contact information, product or service photos, promotions, blog posts, and customer FAQs.\n\nEven small updates can make the website feel more reliable.",
        },
      ],
      ctaTitle: "Ready to Get More Enquiries?",
      ctaText: "Make it easier for customers to understand your business and contact you.",
      ctaButtonText: "WhatsApp Us",
      ctaHref: "https://wa.me/60123456789",
    },
  ],
};

export function formatBlogDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
