"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FilePlus2,
  ImagePlus,
  ListChecks,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
} from "react";
import {
  defaultBlogContent,
  formatBlogDate,
  normalizeSlug,
  type BlogPost,
  type BlogSection,
} from "@/lib/blog-content";
import {
  fetchBlogCmsContent,
  readBlogCmsContent,
  saveBlogCmsContent,
  uploadBlogCmsImage,
  verifyBlogCmsPassword,
  writeBlogCmsContent,
} from "@/lib/blog-storage";
import { AiEmphasizedParagraphs } from "@/components/blog-ai-emphasis";

const emptySection = (): BlogSection => ({
  id: crypto.randomUUID(),
  heading: "",
  body: "",
});

const customCtaButtonOption = "Other CTA";
const customCtaTitleOption = "Custom CTA Title";

const ctaOptions = [
  "WhatsApp us",
  "Get a quote",
  "Book a call",
  "Request consultation",
  "View package",
  "Claim offer",
  "Learn more",
  "Contact us",
  customCtaButtonOption,
];

const ctaTitleOptions = [
  "Ready to Get More Enquiries?",
  "Ready to Get a Quote?",
  "Ready to Book a Call?",
  "Ready to Request a Consultation?",
  "Ready to View Our Package?",
  "Ready to Claim This Offer?",
  "Ready to Learn More?",
  "Ready to Contact Us?",
  customCtaTitleOption,
];

const characterLimits = {
  pageTitle: 60,
  overviewIntro: 180,
  blogTitle: 90,
  slug: 100,
  excerpt: 100,
  imageUrl: 500,
  simpleIntro: 650,
  sectionHeading: 80,
  sectionBody: 1400,
  ctaTitle: 90,
  ctaButtonText: 40,
  ctaText: 180,
  ctaLink: 500,
};

function estimateReadTime(post: BlogPost) {
  const text = [
    post.title,
    post.excerpt,
    post.simpleIntro,
    ...post.sections.flatMap((section) => [section.heading, section.body]),
    post.ctaTitle,
    post.ctaText,
  ].join(" ");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));

  return `${minutes} min read`;
}

const createPost = (): BlogPost => ({
  id: crypto.randomUUID(),
  slug: "",
  status: "draft",
  title: "",
  publishDate: "",
  readTime: "1 min read",
  excerpt: "",
  thumbnailImage: "",
  featuredImage: "",
  simpleIntro: "",
  sections: [emptySection()],
  ctaTitle: "",
  ctaText: "",
  ctaButtonText: "",
  ctaHref: "",
});

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
        {required ? <span className="ml-1 text-[var(--gold)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function CharacterCount({ value, limit }: { value: string; limit: number }) {
  return (
    <span className="mt-1.5 block text-right text-[0.72rem] font-medium text-[var(--muted)]/72">
      {value.length}/{limit}
    </span>
  );
}

function FieldMetaRow({
  helper,
  value,
  limit,
}: {
  helper?: string;
  value: string;
  limit: number;
}) {
  return (
    <div className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-5 text-[var(--muted)]">
      {helper ? <p>{helper}</p> : <span />}
      <span className="shrink-0 text-right text-[0.72rem] font-medium text-[var(--muted)]/72">
        {value.length}/{limit}
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          {eyebrow}
        </p>
        <h2 className="mt-2.5 font-[family-name:var(--font-heading)] text-[1.75rem] leading-[1.02] tracking-[-0.04em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-[42rem] text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  maxLength,
  required = false,
  placeholder,
  minRows = 1,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={`${inputClass} resize-none overflow-hidden`}
      rows={minRows}
      required={required}
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

function RevealIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
      {children}
    </span>
  );
}

function formatCalendarLabel(dateValue: string) {
  if (!dateValue) {
    return "Select publish date";
  }

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

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CalendarDateControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [value]);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const monthLabel = new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }

          setIsOpen((current) => !current);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between rounded-[1rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,0.96))] px-4 py-3.5 text-left text-[15px] text-[var(--foreground)] shadow-[0_6px_18px_rgba(0,0,0,0.04)] transition duration-200 hover:border-[rgba(238,32,40,0.2)] hover:shadow-[0_12px_24px_rgba(238,32,40,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)] ${
          isOpen ? "border-[var(--gold)] shadow-[0_0_0_4px_rgba(238,32,40,0.08),0_12px_24px_rgba(0,0,0,0.06)]" : "border-[var(--border)]"
        }`}
      >
        <span className={value ? "text-[var(--foreground)]" : "text-[var(--muted)]/72"}>
          {formatCalendarLabel(value)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--gold)] transition duration-200 ${
            isOpen ? "rotate-180 text-[var(--gold)]" : "text-[var(--gold)]/80 group-hover:text-[var(--gold)]"
          }`}
        />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Choose publish date"
          className="absolute left-0 top-full z-30 mt-2 w-full max-w-[19rem] rounded-[1rem] border border-[rgba(0,0,0,0.08)] bg-white p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">{monthLabel}</p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span
                key={day}
                className="py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]/70"
              >
                {day}
              </span>
            ))}
            {calendarDays.map((date) => {
              const isoDate = toIsoDate(date);
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = isoDate === value;
              const isToday = isoDate === toIsoDate(new Date());

              return (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => {
                    onChange(isoDate);
                    setIsOpen(false);
                  }}
                  className={`flex aspect-square min-h-8 items-center justify-center rounded-[0.62rem] text-[0.82rem] font-semibold transition ${
                    isSelected
                      ? "bg-[var(--gold)] text-white shadow-[0_10px_22px_rgba(238,32,40,0.24)]"
                      : isToday
                        ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                        : isCurrentMonth
                          ? "text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                          : "text-[var(--muted)]/35 hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CmsSelectControl({
  value,
  onChange,
  options,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option === value) ?? value;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between rounded-[1rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,0.96))] px-4 py-3.5 text-left text-[15px] text-[var(--foreground)] shadow-[0_6px_18px_rgba(0,0,0,0.04)] transition duration-200 hover:border-[rgba(238,32,40,0.2)] hover:shadow-[0_12px_24px_rgba(238,32,40,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)] ${
          isOpen ? "border-[var(--gold)] shadow-[0_0_0_4px_rgba(238,32,40,0.08),0_12px_24px_rgba(0,0,0,0.06)]" : "border-[var(--border)]"
        }`}
      >
        <span className={`truncate ${selectedOption ? "text-[var(--foreground)]" : "text-[var(--muted)]/72"}`}>
          {selectedOption || placeholder || "Select option"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--gold)] transition duration-200 ${
            isOpen ? "rotate-180 text-[var(--gold)]" : "text-[var(--gold)]/80 group-hover:text-[var(--gold)]"
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[1rem] border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <div role="listbox" aria-label={label} className="max-h-64 overflow-auto p-2">
            {options.map((option) => {
              const isSelected = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center justify-between rounded-[0.85rem] px-4 py-3 text-left text-[15px] transition ${
                    isSelected
                      ? "bg-[var(--gold-soft)] text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{option}</span>
                  {isSelected ? <span className="h-2 w-2 rounded-full bg-[var(--gold)]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  "min-h-[52px] w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3.5 text-[15px] leading-6 text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]";
const localImagePathPattern = /^[a-zA-Z]:[\\/].+\.(?:avif|gif|jpe?g|png|webp)$/i;

function PreviewParagraphs({ text, maxHighlights = 3 }: { text: string; maxHighlights?: number }) {
  return (
    <AiEmphasizedParagraphs
      text={text}
      maxHighlights={maxHighlights}
      paragraphClassName="mt-3 text-sm leading-6 text-[var(--muted)]"
      emptyState={
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]/72">
          Start typing to preview this content.
        </p>
      }
    />
  );
}

function BlogLivePreview({
  post,
  isVisible,
  onClose,
}: {
  post: BlogPost | undefined;
  isVisible: boolean;
  onClose: () => void;
}) {
  const title = post?.title.trim() || "Untitled blog post";
  const readTime = post?.readTime || "1 min read";
  const publishDate = post?.publishDate ? formatBlogDate(post.publishDate) : "Draft date";
  const sections = post?.sections.length ? post.sections : [emptySection()];

  return (
    <aside
      aria-hidden={!isVisible}
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[430px] transform-gpu flex-col border-l border-[var(--border)] bg-white shadow-[0_0_42px_rgba(0,0,0,0.14)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform lg:sticky lg:top-6 lg:z-auto lg:max-h-[calc(100vh-3rem)] lg:w-[430px] lg:rounded-[2rem] lg:border lg:shadow-[0_10px_28px_rgba(0,0,0,0.05)] ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            Live Preview
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            AI auto-highlight is shown here
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-[background-color,border-color,color] duration-200 hover:border-[rgba(238,32,40,0.2)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold)]"
          aria-label="Hide preview"
          title="Hide preview"
        >
          <PanelRightClose className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <article className="mx-auto max-w-[360px]">
          {post?.featuredImage ? (
            <img
              src={post.featuredImage}
              alt=""
              className="h-[210px] w-full rounded-[8px] bg-[var(--surface-muted)] object-cover"
            />
          ) : (
            <div className="flex h-[210px] w-full items-center justify-center rounded-[8px] border border-dashed border-[rgba(238,32,40,0.22)] bg-[var(--gold-soft)]/35 px-6 text-center">
              <p className="text-sm font-semibold text-[var(--muted)]">Image preview appears here</p>
            </div>
          )}

          <p className="mt-6 text-xs font-medium text-[var(--muted)]">
            {publishDate} · {readTime}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--foreground)]">
            {title}
          </h1>
          <div className="mt-5 border-b border-[var(--border)] pb-6">
            <PreviewParagraphs text={post?.simpleIntro ?? ""} />
          </div>

          <div className="py-2">
            {sections.map((section, index) => (
              <section key={section.id} className="border-b border-[var(--border)] py-6">
                <p className="text-xs font-semibold text-[var(--gold)]">Section {index + 1}</p>
                <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                  {section.heading.trim() || "Section heading"}
                </h2>
                <PreviewParagraphs text={section.body} maxHighlights={3} />
              </section>
            ))}
          </div>

          <section className="my-6 rounded-[8px] bg-[#111111] px-5 py-6 text-white">
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em]">
              {post?.ctaTitle.trim() || "CTA title"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/74">
              {post?.ctaText.trim() || "CTA message appears here as you type."}
            </p>
            <span className="mt-5 inline-flex items-center rounded-full bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white">
              {post?.ctaButtonText.trim() || "CTA button"}
            </span>
          </section>
        </article>
      </div>
    </aside>
  );
}

export function BlogCmsClient() {
  const initialContent =
    typeof window === "undefined" ? defaultBlogContent : readBlogCmsContent();
  const [content, setContent] = useState<BlogCmsContent>(initialContent);
  const [selectedPostId, setSelectedPostId] = useState(initialContent.posts[0]?.id ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [failedImagePreview, setFailedImagePreview] = useState<string | null>(null);
  const [imageImportStatus, setImageImportStatus] = useState<string | null>(null);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const [serverSaveStatus, setServerSaveStatus] = useState<string | null>(null);
  const [undoDepth, setUndoDepth] = useState(0);
  const undoStackRef = useRef<BlogCmsContent[]>([]);
  const hasLoadedServerContentRef = useRef(false);

  const selectedPost = useMemo(
    () => content.posts.find((post) => post.id === selectedPostId) ?? content.posts[0],
    [content.posts, selectedPostId],
  );
  const isCustomCtaTitle =
    !!selectedPost &&
    (selectedPost.ctaTitle === customCtaTitleOption ||
      (selectedPost.ctaTitle.trim() !== "" && !ctaTitleOptions.includes(selectedPost.ctaTitle)));
  const isCustomCtaButtonText =
    !!selectedPost &&
    (selectedPost.ctaButtonText === customCtaButtonOption ||
      (selectedPost.ctaButtonText.trim() !== "" && !ctaOptions.includes(selectedPost.ctaButtonText)));
  const customCtaTitleValue = selectedPost?.ctaTitle === customCtaTitleOption ? "" : selectedPost?.ctaTitle ?? "";
  const customCtaButtonTextValue =
    selectedPost?.ctaButtonText === customCtaButtonOption ? "" : selectedPost?.ctaButtonText ?? "";

  const updateContent = useCallback((nextContent: BlogCmsContent, options?: { remember?: boolean }) => {
    setContent((currentContent) => {
      if (options?.remember) {
        undoStackRef.current = [currentContent, ...undoStackRef.current].slice(0, 20);
        setUndoDepth(undoStackRef.current.length);
      }

      return nextContent;
    });
    writeBlogCmsContent(nextContent);
    setSavedAt(new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isCurrent = true;

    async function loadServerContent() {
      setServerSaveStatus("Loading cloud content...");

      try {
        const serverContent = await fetchBlogCmsContent();
        const localContent = readBlogCmsContent();
        const serverIsDefault = JSON.stringify(serverContent) === JSON.stringify(defaultBlogContent);
        const localIsDefault = JSON.stringify(localContent) === JSON.stringify(defaultBlogContent);
        const nextContent = serverIsDefault && !localIsDefault ? localContent : serverContent;

        if (!isCurrent) {
          return;
        }

        setContent(nextContent);
        writeBlogCmsContent(nextContent);
        setSelectedPostId(nextContent.posts[0]?.id ?? "");
        hasLoadedServerContentRef.current = true;
        setServerSaveStatus("Cloud content loaded.");
      } catch {
        if (!isCurrent) {
          return;
        }

        hasLoadedServerContentRef.current = true;
        setServerSaveStatus("Cloud unavailable. Saving locally for now.");
      }
    }

    void loadServerContent();

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !hasLoadedServerContentRef.current) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      setServerSaveStatus("Saving to cloud...");
      saveBlogCmsContent(content)
        .then(() => setServerSaveStatus("Saved to cloud."))
        .catch((error) =>
          setServerSaveStatus(error instanceof Error ? error.message : "Could not save to cloud."),
        );
    }, 900);

    return () => window.clearTimeout(saveTimer);
  }, [content, isAuthenticated]);

  const restorePreviousContent = useCallback(() => {
    const [previousContent, ...remainingContent] = undoStackRef.current;

    if (!previousContent) {
      return;
    }

    undoStackRef.current = remainingContent;
    setUndoDepth(remainingContent.length);
    updateContent(previousContent);
    setSelectedPostId((currentPostId) =>
      previousContent.posts.some((post) => post.id === currentPostId)
        ? currentPostId
        : previousContent.posts[0]?.id ?? "",
    );
  }, [updateContent]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    function handleUndoShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        const target = event.target as HTMLElement | null;
        const isTextEditing =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          Boolean(target?.isContentEditable);

        if (isTextEditing) {
          return;
        }

        event.preventDefault();
        restorePreviousContent();
      }
    }

    window.addEventListener("keydown", handleUndoShortcut);

    return () => {
      window.removeEventListener("keydown", handleUndoShortcut);
    };
  }, [isAuthenticated, restorePreviousContent]);

  const updatePost = (postId: string, patch: Partial<BlogPost>) => {
    updateContent({
      ...content,
      posts: content.posts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const nextPost = { ...post, ...patch };
        const sections = nextPost.sections.length > 0 ? nextPost.sections : [emptySection()];
        const postWithRequiredSection = { ...nextPost, sections };

        return { ...postWithRequiredSection, readTime: estimateReadTime(postWithRequiredSection) };
      }),
    }, { remember: true });
  };

  const handlePostTitleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedPost) {
      return;
    }

    const title = event.target.value;
    updatePost(selectedPost.id, {
      title,
      slug: normalizeSlug(title) || selectedPost.slug,
    });
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedPost) {
      return;
    }

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingImage(true);
    setImageImportStatus("Uploading image to cloud...");

    try {
      const imageValue = await uploadBlogCmsImage(file);
      setFailedImagePreview(null);
      setImageImportStatus("Image uploaded and ready to preview.");
      updatePost(selectedPost.id, {
        thumbnailImage: imageValue,
        featuredImage: imageValue,
      });
    } catch (error) {
      setImageImportStatus(error instanceof Error ? error.message : "Could not upload this image.");
    } finally {
      setIsImportingImage(false);
    }
  };

  const handleImageUrlChange = (value: string) => {
    if (!selectedPost) {
      return;
    }

    setFailedImagePreview(null);
    setImageImportStatus(null);
    updatePost(selectedPost.id, {
      thumbnailImage: value,
      featuredImage: value,
    });
  };

  const importLocalImagePath = async (filePath: string) => {
    if (!selectedPost || isImportingImage) {
      return;
    }

    setIsImportingImage(true);
    setImageImportStatus("Importing local image...");

    try {
      const response = await fetch("/api/cms/import-local-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });
      const result = (await response.json().catch(() => null)) as {
        imageUrl?: string;
        error?: string;
      } | null;

      if (!response.ok || !result?.imageUrl) {
        throw new Error(result?.error || "Could not import this image.");
      }

      setFailedImagePreview(null);
      setImageImportStatus("Image imported and ready to preview.");
      updatePost(selectedPost.id, {
        thumbnailImage: result.imageUrl,
        featuredImage: result.imageUrl,
      });
    } catch (error) {
      setImageImportStatus(error instanceof Error ? error.message : "Could not import this image.");
    } finally {
      setIsImportingImage(false);
    }
  };

  const handleImageInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text").trim().replace(/^"|"$/g, "");

    if (!localImagePathPattern.test(pastedText)) {
      return;
    }

    event.preventDefault();
    handleImageUrlChange(pastedText);
    void importLocalImagePath(pastedText);
  };

  const addPost = () => {
    const post = createPost();
    updateContent({ ...content, posts: [post, ...content.posts] }, { remember: true });
    setSelectedPostId(post.id);
  };

  const deletePost = (postId: string) => {
    const nextPosts = content.posts.filter((post) => post.id !== postId);
    updateContent({ ...content, posts: nextPosts }, { remember: true });
    setSelectedPostId(nextPosts[0]?.id ?? "");
  };

  const resetSelectedPost = () => {
    if (!selectedPost) {
      return;
    }

    const blankPost = {
      ...createPost(),
      id: selectedPost.id,
    };

    updateContent({
      ...content,
      posts: content.posts.map((post) => (post.id === selectedPost.id ? blankPost : post)),
    }, { remember: true });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoginPending(true);
    setAuthError(null);

    try {
      await verifyBlogCmsPassword(password);
      setIsAuthenticated(true);
      setPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Password incorrect. Please try again.");
    } finally {
      setIsLoginPending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="dashboard-enter flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[var(--surface-strong)] px-5 pb-16 pt-[118px] text-[var(--foreground)]">
        <section className="w-full max-w-[440px] rounded-[2rem] border border-[var(--border)] bg-white p-7 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
            Protected CMS
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-none tracking-[-0.04em]">
            SiteTarik Blog CMS
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Enter the CMS password to manage blog overview and post content.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <Field label="Password">
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  title={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {authError ? (
              <p className="rounded-[8px] border border-[rgba(238,32,40,0.18)] bg-[var(--gold-soft)] px-3 py-2 text-sm text-[var(--foreground)]">
                {authError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isLoginPending}
              className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)] disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:shadow-none"
            >
              {isLoginPending ? "Checking..." : "Unlock CMS"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-enter min-h-screen bg-[var(--surface)] pb-10 pt-8 text-[var(--foreground)]">
        <div className={`mx-auto flex flex-col gap-5 px-5 pb-3 transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-7 lg:px-6 ${isPreviewOpen ? "max-w-[1680px]" : "max-w-[1230px]"}`}>
        <div className={`grid gap-4 lg:items-end ${
          isPreviewOpen
            ? "lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(360px,430px)]"
            : "lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,0px)]"
        }`}>
          <div className="lg:col-[1/3] lg:row-start-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              Payload Lite
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-[2.6rem] font-semibold leading-none tracking-[-0.05em] sm:text-[3.3rem]">
              SiteTarik Blog CMS
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 lg:col-[2/3] lg:row-start-1 lg:justify-self-end lg:pr-4 xl:pr-6">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-full border border-[rgba(238,32,40,0.16)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-[rgba(238,32,40,0.22)] hover:bg-[var(--gold-soft)] hover:shadow-[0_12px_26px_rgba(0,0,0,0.06)]"
            >
              View Blog
              <RevealIcon>
                <Eye className="h-4 w-4" />
              </RevealIcon>
            </Link>
            <button
              type="button"
              onClick={() => setIsPreviewOpen((current) => !current)}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,box-shadow,color] duration-200 ${
                isPreviewOpen
                  ? "border-[rgba(238,32,40,0.18)] bg-[var(--gold-soft)] text-[var(--gold)] shadow-[0_10px_22px_rgba(238,32,40,0.08)]"
                  : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[rgba(238,32,40,0.18)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] hover:shadow-[0_10px_22px_rgba(0,0,0,0.05)]"
              }`}
              aria-pressed={isPreviewOpen}
              aria-label={isPreviewOpen ? "Hide live preview" : "Show live preview"}
              title={isPreviewOpen ? "Hide live preview" : "Show live preview"}
            >
              Preview
              <RevealIcon>
                {isPreviewOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </RevealIcon>
            </button>
            <button
              type="button"
              onClick={restorePreviousContent}
              disabled={undoDepth === 0}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-[rgba(238,32,40,0.18)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] hover:shadow-[0_10px_22px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-white disabled:text-[var(--muted)]/35 disabled:hover:shadow-none"
              aria-label="Undo last CMS change"
              title="Undo last CMS change"
            >
              Undo
              <RevealIcon>
                <Undo2 className="h-4 w-4" />
              </RevealIcon>
            </button>
            <button
              type="button"
              onClick={resetSelectedPost}
              disabled={!selectedPost}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-[rgba(238,32,40,0.18)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] hover:shadow-[0_10px_22px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-white disabled:text-[var(--muted)]/35 disabled:hover:shadow-none"
            >
              Reset Post
              <RevealIcon>
                <RotateCcw className="h-4 w-4" />
              </RevealIcon>
            </button>
          </div>
        </div>
        </div>

        <div className={`mx-auto grid gap-6 px-5 py-7 transition-[max-width,grid-template-columns] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-7 lg:px-6 ${
          isPreviewOpen
            ? "max-w-[1680px] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(360px,430px)]"
            : "max-w-[1230px] lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,0px)]"
        }`}>
        <aside className="min-w-0 overflow-hidden h-fit rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.05)] lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Collection
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[1.65rem] leading-[1.02] tracking-[-0.04em]">
                Posts
              </h2>
            </div>
            <button
              type="button"
              onClick={addPost}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)]"
              aria-label="Add post"
              title="Add post"
            >
              New
              <RevealIcon>
                <FilePlus2 className="h-4 w-4" />
              </RevealIcon>
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {content.posts.length > 0 ? (
              content.posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPostId(post.id)}
                  className={`block w-full min-w-0 overflow-hidden rounded-[1.1rem] border px-4 py-4 text-left transition-[transform,background-color,border-color,box-shadow,color] duration-200 ${
                    post.id === selectedPost?.id
                      ? "border-[rgba(238,32,40,0.18)] bg-[var(--gold-soft)] shadow-[0_10px_22px_rgba(238,32,40,0.08)]"
                      : "border-[var(--border)] bg-[var(--surface-strong)] hover:border-[rgba(238,32,40,0.16)] hover:bg-white hover:shadow-[0_10px_22px_rgba(0,0,0,0.05)]"
                  }`}
                >
                  <span className="block min-w-0 max-w-full text-sm font-semibold leading-6 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [overflow:hidden]">
                    {post.title || "Untitled blog post"}
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white/70 px-2.5 py-1 text-[11px] font-semibold leading-none text-[var(--muted)] shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
                      <CalendarDays className="h-3.5 w-3.5 text-[var(--gold)]/75" />
                      {post.publishDate ? formatBlogDate(post.publishDate) : "No publish date set"}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] ${
                        post.status === "published"
                          ? "border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] text-[#16803a]"
                          : "border-[rgba(238,32,40,0.14)] bg-white text-[var(--muted)]"
                      }`}
                    >
                      {post.status}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[rgba(238,32,40,0.22)] bg-[var(--gold-soft)]/40 px-4 py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--gold)] shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
                  <ListChecks className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">No posts yet</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Create the first blog post to start filling the overview.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="grid gap-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:p-7">
            <SectionHeader
              eyebrow="Blog Overview"
              title="Overview page content"
              description="Control the title and introduction shown before the published blog cards."
              action={
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                <Save className="h-4 w-4" />
                {serverSaveStatus || (savedAt ? `Saved ${savedAt}` : "Auto-save on edit")}
              </span>
              }
            />
            <div className="mt-6 grid gap-5">
              <Field label="Page Title" required>
                <AutoGrowTextarea
                  required
                  maxLength={characterLimits.pageTitle}
                  value={content.overview.title}
                  placeholder="e.g. Blog"
                  minRows={1}
                  onChange={(event) =>
                    updateContent({
                      ...content,
                      overview: { ...content.overview, title: event.target.value },
                    }, { remember: true })
                  }
                />
                <CharacterCount value={content.overview.title} limit={characterLimits.pageTitle} />
              </Field>
              <Field label="Short Intro Text" required>
                <AutoGrowTextarea
                  required
                  maxLength={characterLimits.overviewIntro}
                  value={content.overview.intro}
                  placeholder="Short intro for the blog page"
                  onChange={(event) =>
                    updateContent({
                      ...content,
                      overview: { ...content.overview, intro: event.target.value },
                    }, { remember: true })
                  }
                />
                <CharacterCount value={content.overview.intro} limit={characterLimits.overviewIntro} />
              </Field>
            </div>
          </div>

          {selectedPost ? (
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:p-7">
              <SectionHeader
                eyebrow="Blog Content"
                title="Edit blog post"
                description="Create, edit, publish, or delete the content used by the blog overview and detail page."
                action={
                <button
                  type="button"
                  onClick={() => deletePost(selectedPost.id)}
                  className="group inline-flex items-center gap-2 rounded-full border border-[rgba(238,32,40,0.22)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--gold)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:bg-[var(--gold-soft)] hover:shadow-[0_10px_22px_rgba(238,32,40,0.08)]"
                >
                  Delete
                  <RevealIcon>
                    <Trash2 className="h-4 w-4" />
                  </RevealIcon>
                </button>
                }
              />

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Blog Title" required>
                  <AutoGrowTextarea
                    required
                    maxLength={characterLimits.blogTitle}
                    value={selectedPost.title}
                    placeholder="e.g. SME enquiry tips"
                    onChange={handlePostTitleChange}
                  />
                  <CharacterCount value={selectedPost.title} limit={characterLimits.blogTitle} />
                </Field>
                <Field label="Slug">
                  <input
                    className={`${inputClass} bg-[var(--surface-muted)] text-[var(--muted)]`}
                    maxLength={characterLimits.slug}
                    value={selectedPost.slug}
                    readOnly
                  />
                  <FieldMetaRow
                    helper="Auto-generated from the blog title."
                    value={selectedPost.slug}
                    limit={characterLimits.slug}
                  />
                </Field>
                <Field label="Publish Date" required>
                  <CalendarDateControl
                    value={selectedPost.publishDate}
                    onChange={(value) => updatePost(selectedPost.id, { publishDate: value })}
                  />
                </Field>
                <Field label="Status" required>
                  <CmsSelectControl
                    value={selectedPost.status === "published" ? "Published" : "Draft"}
                    options={["Draft", "Published"]}
                    label="Status"
                    onChange={(value) =>
                      updatePost(selectedPost.id, {
                        status: value === "Published" ? "published" : "draft",
                      })
                    }
                  />
                </Field>
                <Field label="Read Time">
                  <input
                    className={`${inputClass} bg-[var(--surface-muted)] text-[var(--muted)]`}
                    value={selectedPost.readTime}
                    readOnly
                  />
                  <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                    Predicted from the title, intro, sections, excerpt, and CTA text.
                  </p>
                </Field>
                <Field label="Short Excerpt" required>
                  <AutoGrowTextarea
                    required
                    maxLength={characterLimits.excerpt}
                    value={selectedPost.excerpt}
                    placeholder="Short summary for the blog card"
                    onChange={(event) => updatePost(selectedPost.id, { excerpt: event.target.value })}
                  />
                  <CharacterCount value={selectedPost.excerpt} limit={characterLimits.excerpt} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Blog Image URL or Attachment" required>
                    <div className="grid items-start gap-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:grid-cols-[220px_1fr]">
                      <div className="aspect-[4/3] overflow-hidden rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface-muted)] shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
                        {selectedPost.featuredImage && failedImagePreview !== selectedPost.featuredImage ? (
                          <img
                            src={selectedPost.featuredImage}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => setFailedImagePreview(selectedPost.featuredImage)}
                          />
                        ) : (
                          <div className="flex aspect-[4/3] h-full w-full flex-col items-center justify-center bg-[var(--surface-muted)] px-5 py-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                              <UserRound className="h-7 w-7" />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                              Attach a blog image
                            </p>
                            <p className="mt-1 max-w-[13rem] text-xs leading-5 text-[var(--muted)]">
                              Recommended: clean SME, storefront, service, or branded visual.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="grid content-start gap-3">
                        <input
                          className={`${inputClass} truncate`}
                          required
                          maxLength={characterLimits.imageUrl}
                          value={selectedPost.featuredImage}
                          onChange={(event) => handleImageUrlChange(event.target.value)}
                          onPaste={handleImageInputPaste}
                          placeholder="e.g. /Image/blog.webp"
                        />
                        <CharacterCount value={selectedPost.featuredImage} limit={characterLimits.imageUrl} />
                        <label className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(238,32,40,0.16)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-[rgba(238,32,40,0.22)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold)] hover:shadow-[0_10px_22px_rgba(0,0,0,0.05)]">
                          Attach image
                          <RevealIcon>
                            <ImagePlus className="h-4 w-4" />
                          </RevealIcon>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageFileChange}
                          />
                        </label>
                        <p className="text-xs leading-5 text-[var(--muted)]">
                          {imageImportStatus || (isImportingImage ? "Importing local image..." : "Recommended: 1200 x 900px, 4:3 ratio.")}
                        </p>
                      </div>
                    </div>
                  </Field>
                </div>
              </div>

              <div className="mt-5">
                <Field label="Simple Intro" required>
                  <AutoGrowTextarea
                    required
                    maxLength={characterLimits.simpleIntro}
                    value={selectedPost.simpleIntro}
                    placeholder="Short opening intro"
                    onChange={(event) => updatePost(selectedPost.id, { simpleIntro: event.target.value })}
                    minRows={3}
                  />
                  <CharacterCount value={selectedPost.simpleIntro} limit={characterLimits.simpleIntro} />
                </Field>
              </div>

              <div className="mt-7 border-t border-[var(--border)] pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                      Post Body
                    </p>
                    <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[1.55rem] leading-[1.02] tracking-[-0.04em]">
                      Sections
                    </h3>
                    <p className="mt-2 max-w-[34rem] text-sm leading-6 text-[var(--muted)]">
                      Keep at least one section so every post has useful main content.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePost(selectedPost.id, { sections: [...selectedPost.sections, emptySection()] })}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)]"
                  >
                    Add Section
                    <RevealIcon>
                      <FilePlus2 className="h-4 w-4" />
                    </RevealIcon>
                  </button>
                </div>
                <div className="mt-5 grid gap-4">
                  {selectedPost.sections.map((section) => (
                    <div key={section.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
                      <div className="grid gap-4">
                        <Field label="Section Heading">
                          <AutoGrowTextarea
                            required
                            maxLength={characterLimits.sectionHeading}
                            value={section.heading}
                            placeholder="e.g. Make Your Service Clear"
                            onChange={(event) =>
                              updatePost(selectedPost.id, {
                                sections: selectedPost.sections.map((item) =>
                                  item.id === section.id ? { ...item, heading: event.target.value } : item,
                                ),
                              })
                            }
                          />
                          <CharacterCount value={section.heading} limit={characterLimits.sectionHeading} />
                        </Field>
                        <Field label="Section Body">
                          <AutoGrowTextarea
                            required
                            maxLength={characterLimits.sectionBody}
                            value={section.body}
                            placeholder="Explain this section clearly"
                            onChange={(event) =>
                              updatePost(selectedPost.id, {
                                sections: selectedPost.sections.map((item) =>
                                  item.id === section.id ? { ...item, body: event.target.value } : item,
                                ),
                              })
                            }
                            minRows={4}
                          />
                          <CharacterCount value={section.body} limit={characterLimits.sectionBody} />
                        </Field>
                        <button
                          type="button"
                          onClick={() =>
                            updatePost(selectedPost.id, {
                              sections: selectedPost.sections.filter((item) => item.id !== section.id),
                            })
                          }
                          disabled={selectedPost.sections.length <= 1}
                          className="justify-self-start rounded-full border border-[rgba(238,32,40,0.16)] bg-white px-4 py-2 text-sm font-semibold text-[var(--gold)] transition-[background-color,border-color,box-shadow,color] duration-200 hover:bg-[var(--gold-soft)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-transparent disabled:text-[var(--muted)]/45 disabled:hover:shadow-none"
                        >
                          {selectedPost.sections.length <= 1 ? "At least one section required" : "Remove section"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 grid gap-5 border-t border-[var(--border)] pt-6 md:grid-cols-2">
                <Field label="CTA Title" required>
                  <div className="grid gap-3">
                    <CmsSelectControl
                      value={selectedPost.ctaTitle}
                      options={ctaTitleOptions}
                      label="CTA Title"
                      placeholder="Select CTA title"
                      onChange={(value) => updatePost(selectedPost.id, { ctaTitle: value })}
                    />
                    {isCustomCtaTitle ? (
                      <div>
                        <input
                          className={inputClass}
                          maxLength={characterLimits.ctaTitle}
                          value={customCtaTitleValue}
                          onChange={(event) =>
                            updatePost(selectedPost.id, {
                              ctaTitle: event.target.value || customCtaTitleOption,
                            })
                          }
                          placeholder="Enter custom CTA title"
                        />
                        <CharacterCount value={customCtaTitleValue} limit={characterLimits.ctaTitle} />
                      </div>
                    ) : null}
                  </div>
                </Field>
                <Field label="CTA Button Text" required>
                  <div className="grid gap-3">
                    <CmsSelectControl
                      value={selectedPost.ctaButtonText}
                      options={ctaOptions}
                      label="CTA Button Text"
                      placeholder="Select CTA button"
                      onChange={(value) => updatePost(selectedPost.id, { ctaButtonText: value })}
                    />
                    {isCustomCtaButtonText ? (
                      <div>
                        <input
                          className={inputClass}
                          maxLength={characterLimits.ctaButtonText}
                          value={customCtaButtonTextValue}
                          onChange={(event) =>
                            updatePost(selectedPost.id, {
                              ctaButtonText: event.target.value || customCtaButtonOption,
                            })
                          }
                          placeholder="Enter custom CTA button text"
                        />
                        <CharacterCount value={customCtaButtonTextValue} limit={characterLimits.ctaButtonText} />
                      </div>
                    ) : null}
                  </div>
                </Field>
                <Field label="CTA Text" required>
                  <AutoGrowTextarea
                    required
                    maxLength={characterLimits.ctaText}
                    value={selectedPost.ctaText}
                    placeholder="Short CTA message"
                    onChange={(event) => updatePost(selectedPost.id, { ctaText: event.target.value })}
                  />
                  <CharacterCount value={selectedPost.ctaText} limit={characterLimits.ctaText} />
                </Field>
                <Field label="CTA Link" required>
                  <AutoGrowTextarea
                    required
                    maxLength={characterLimits.ctaLink}
                    value={selectedPost.ctaHref}
                    placeholder="e.g. /contact"
                    onChange={(event) => updatePost(selectedPost.id, { ctaHref: event.target.value })}
                  />
                  <CharacterCount value={selectedPost.ctaHref} limit={characterLimits.ctaLink} />
                </Field>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-8 text-center shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)] shadow-[0_10px_22px_rgba(238,32,40,0.08)]">
                <ListChecks className="h-7 w-7" />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Blog Content
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[2rem] leading-[1.02] tracking-[-0.04em]">
                No post selected
              </h2>
              <p className="mx-auto mt-3 max-w-[32rem] text-sm leading-6 text-[var(--muted)]">
                Create a blog post to edit title, image, sections, CTA, and publish status.
              </p>
              <button
                type="button"
                onClick={addPost}
                className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)]"
              >
                Create Post
                <RevealIcon>
                  <FilePlus2 className="h-4 w-4" />
                </RevealIcon>
              </button>
            </div>
          )}
        </section>
        <BlogLivePreview
          post={selectedPost}
          isVisible={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
        </div>
    </main>
  );
}
