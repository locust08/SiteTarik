import type { ReactNode } from "react";

type EmphasisRange = {
  start: number;
  end: number;
};

const sitetarikSellingPointPhrases = [
  "more customer enquiries",
  "more enquiries online",
  "get more enquiries",
  "customer enquiries",
  "potential customers",
  "website clarity",
  "google visibility",
  "online presence",
  "trusted website",
  "trust your service",
  "clear website",
  "website audit",
  "visual problem report",
  "pagespeed audit",
  "google ranking",
  "tracking setup",
  "existing website",
  "upgrade their existing website",
  "without rebuilding from zero",
  "clearer, cleaner",
  "easier for google to understand",
  "turn visitors into enquiries",
  "basic seo setup",
  "content clarity",
  "gtm and ga4 setup",
  "tracking visits",
  "future marketing results",
  "stronger search visibility",
  "seo enhancement",
  "12 seo-friendly blog pages",
  "customer questions",
  "more relevant searches",
  "visibility, trust, and enquiries",
  "cleaner customer journey",
  "business-impact problems",
  "service areas",
  "past work",
  "customer reviews",
  "request a quote",
  "get a quote",
  "book a call",
  "whatsapp us",
  "contact you easily",
  "contact details",
  "small businesses",
  "malaysian smes",
  "kuala lumpur",
  "selangor",
  "petaling jaya",
  "shah alam",
  "puchong",
  "malaysia",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCandidate(value: string) {
  return value
    .replace(/[.,;:!?()[\]{}"“”'’]+$/g, "")
    .replace(/^[.,;:!?()[\]{}"“”'’]+/g, "")
    .replace(/^(?:your|our|the|a|an)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addCandidate(candidates: Set<string>, value: string) {
  const candidate = normalizeCandidate(value);

  if (candidate.length < 8 || candidate.length > 58) {
    return;
  }

  candidates.add(candidate);
}

function findSiteTarikSellingPointRanges(text: string, maxHighlights = 2) {
  const candidates = new Set<string>();

  for (const phrase of sitetarikSellingPointPhrases) {
    const matcher = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
    if (matcher.test(text)) {
      addCandidate(candidates, phrase);
    }
  }

  const enquiryMatcher =
    /\b(?:add|adds|help|helps|helping|include|includes|make|making|improve|improving|support|upgrade)\s+([^.,;:\n]{0,54}?(?:basic SEO setup|cleaner customer journey|content clarity|enquiries|future marketing results|google visibility|online presence|search visibility|tracking visits|trust|website clarity))\b/gi;
  for (const match of text.matchAll(enquiryMatcher)) {
    addCandidate(candidates, match[1]);
  }

  const serviceAreaMatcher =
    /\b(?:in|for|around)\s+(Malaysian SMEs|small businesses|Kuala Lumpur|Selangor|Petaling Jaya|Shah Alam|Puchong|Malaysia)\b/gi;
  for (const match of text.matchAll(serviceAreaMatcher)) {
    addCandidate(candidates, match[1]);
  }

  const sortedCandidates = [...candidates].sort((first, second) => second.length - first.length);
  const ranges: EmphasisRange[] = [];

  for (const candidate of sortedCandidates) {
    const matcher = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(candidate)})(?=$|[^\\p{L}\\p{N}])`, "giu");

    for (const match of text.matchAll(matcher)) {
      const start = (match.index ?? 0) + match[1].length;
      const end = start + match[2].length;
      const overlaps = ranges.some((range) => start < range.end && end > range.start);

      if (!overlaps) {
        ranges.push({ start, end });
      }

      if (ranges.length >= maxHighlights) {
        break;
      }
    }

    if (ranges.length >= maxHighlights) {
      break;
    }
  }

  return ranges.sort((first, second) => first.start - second.start);
}

export function AiEmphasizedText({
  text,
  maxHighlights = 1,
  className = "font-bold text-[var(--gold)]",
}: {
  text: string;
  maxHighlights?: number;
  className?: string;
}) {
  const ranges = findSiteTarikSellingPointRanges(text, maxHighlights);

  if (ranges.length === 0) {
    return <>{text}</>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }

    parts.push(
      <strong key={`${range.start}-${range.end}-${index}`} className={className}>
        {text.slice(range.start, range.end)}
      </strong>,
    );
    cursor = range.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

export function AiEmphasizedParagraphs({
  text,
  maxHighlights = 3,
  paragraphClassName,
  emphasisClassName,
  emptyState,
}: {
  text: string;
  maxHighlights?: number;
  paragraphClassName: string;
  emphasisClassName?: string;
  emptyState?: ReactNode;
}) {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  if (paragraphs.length === 0) {
    return emptyState ?? null;
  }

  const paragraphHighlightCounts = paragraphs.map((_, index) =>
    index < maxHighlights ? 1 : 0,
  );

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        return (
          <p key={`${paragraph}-${index}`} className={paragraphClassName}>
            <AiEmphasizedText
              text={paragraph}
              maxHighlights={paragraphHighlightCounts[index]}
              className={emphasisClassName}
            />
          </p>
        );
      })}
    </>
  );
}
