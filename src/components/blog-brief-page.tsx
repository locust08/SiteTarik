"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, LoaderCircle, ThumbsUp } from "lucide-react";
import {
  blogBriefSubmittedStorageKey,
  formatSiteTarikDateTime,
  thankYouStorageKey,
  thankYouStripeSessionKey,
} from "@/lib/order-flow";
import {
  buildBrowserTrackingMetadata,
  dispatchSiteTarikAnalyticsEvent,
  readTrackingSnapshotFromBrowser,
} from "@/lib/tracking/browser";

type BlogBriefForm = {
  briefBusinessDescription: string;
  mainProductsServices: string;
  targetKeywords: string;
  targetLocation: string;
  mainGoal: string;
  idealCustomers: string;
  topicsToCover: string;
  preferredCTA: string;
  customCTA: string;
  pagesToPush: string;
  additionalNotes: string;
};

type ReceiptData = {
  fullName: string;
  businessName: string;
  websiteUrl: string;
  whatsappNumber: string;
  whatsappConsent?: boolean;
  selectedPackage: string;
  selectedPackageValue: "core" | "blog";
  submissionDetails?: Record<string, string | string[]>;
  paidAt?: string;
  submittedAt: string;
  receiptCode?: string;
};

type StripeVerifyPayload = {
  isPaid?: boolean;
  selectedPackage?: string;
  paidAtIso?: string | null;
  receiptCode?: string | null;
  hasBlogBrief?: boolean;
  order?: {
    packageTitle?: string;
    fullName?: string;
    businessName?: string;
    websiteUrl?: string;
    whatsappNumber?: string;
    targetLocation?: string;
    receiptCode?: string;
  };
  blog?: {
    briefBusinessDescription?: string;
    mainProductsServices?: string;
    targetKeywords?: string;
    targetLocation?: string;
    mainGoal?: string;
    idealCustomers?: string;
    topicsToCover?: string;
    ctaText?: string;
    pagesToPush?: string;
    additionalNotes?: string;
  };
};

type BlogBriefLockRecord = {
  sessionId: string;
  submittedAt: string;
};

const minimumLoadingMs = 1200;
const lockedLoadingCheckDelayMs = 1200;
const lockedLoadingTotalMs = 1800;
const confirmationMs = 600;
const fieldCharacterLimits: Record<keyof BlogBriefForm, number> = {
  briefBusinessDescription: 280,
  mainProductsServices: 240,
  targetKeywords: 160,
  targetLocation: 70,
  mainGoal: 60,
  idealCustomers: 200,
  topicsToCover: 280,
  preferredCTA: 50,
  customCTA: 50,
  pagesToPush: 180,
  additionalNotes: 240,
};

const goalOptions = [
  "Get more leads",
  "Get more enquiries",
  "Increase product sales",
  "Improve brand visibility",
  "Educate potential customers",
  "Support SEO growth",
];

const ctaOptions = [
  "WhatsApp us",
  "Get a quote",
  "Book a call",
  "Request consultation",
  "View package",
  "Claim offer",
  "Learn more",
  "Contact us",
  "Other CTA",
];

const initialBlogBriefForm: BlogBriefForm = {
  briefBusinessDescription: "",
  mainProductsServices: "",
  targetKeywords: "",
  targetLocation: "",
  mainGoal: "Get more leads",
  idealCustomers: "",
  topicsToCover: "",
  preferredCTA: "WhatsApp us",
  customCTA: "",
  pagesToPush: "",
  additionalNotes: "",
};

function FieldLabel({
  children,
  required = false,
  optional = false,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[0.86rem] font-semibold tracking-[0.01em] text-[var(--foreground)]/86">
      {children}
      {required ? <span className="ml-1 text-[#ee2028]">*</span> : null}
      {optional ? (
        <span className="ml-1 text-[0.72rem] font-medium text-[var(--muted)]">(Optional)</span>
      ) : null}
    </span>
  );
}

function TextArea({
  name,
  placeholder,
  value,
  onChange,
  rows = 2,
  required = false,
}: {
  name: keyof BlogBriefForm;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  rows?: number;
  required?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const characterLimit = fieldCharacterLimits[name];

  useEffect(() => {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <>
      <textarea
        ref={textareaRef}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={characterLimit}
        className="w-full resize-none overflow-hidden rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3.5 text-base leading-7 text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]"
      />
      <span className="mt-1.5 block text-right text-[0.72rem] font-medium text-[var(--muted)]/72">
        {value.length}/{characterLimit}
      </span>
    </>
  );
}

function TextInput({
  name,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  name: keyof BlogBriefForm;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
}) {
  const characterLimit = fieldCharacterLimits[name];

  return (
    <>
      <input
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={characterLimit}
        className="w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3.5 text-base leading-6 text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]"
      />
      <span className="mt-1.5 block text-right text-[0.72rem] font-medium text-[var(--muted)]/72">
        {value.length}/{characterLimit}
      </span>
    </>
  );
}

function SelectControl({
  name,
  value,
  onChange,
  options,
  required = false,
}: {
  name: keyof BlogBriefForm;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
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
    onChange({
      target: {
        name,
        value: selectedValue,
      },
    } as ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
          name={name}
          value={value}
          required
          readOnly
        />
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between rounded-[1rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,0.96))] px-4 py-3.5 text-left text-[15px] text-[var(--foreground)] shadow-[0_6px_18px_rgba(0,0,0,0.04)] transition duration-200 hover:border-[rgba(238,32,40,0.2)] hover:shadow-[0_12px_24px_rgba(238,32,40,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)] ${
          isOpen ? "border-[var(--gold)] shadow-[0_0_0_4px_rgba(238,32,40,0.08),0_12px_24px_rgba(0,0,0,0.06)]" : "border-[var(--border)]"
        }`}
      >
        <span className="truncate">{selectedOption}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--gold)] transition duration-200 ${
            isOpen ? "rotate-180 text-[var(--gold)]" : "text-[var(--gold)]/80 group-hover:text-[var(--gold)]"
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[1rem] border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <div role="listbox" aria-label={String(name)} className="max-h-64 overflow-auto p-2">
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5 border-b border-[var(--border)] py-2.5 last:border-b-0 sm:grid-cols-[0.42fr_0.58fr] sm:items-start sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(17,17,17,0.68)]">
        {label}
      </dt>
      <dd className="min-w-0 whitespace-normal break-words text-left text-sm leading-6 text-[#111111] [overflow-wrap:anywhere] sm:text-right sm:text-base">
        {value}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
    <main className="relative min-h-screen bg-[var(--surface)] px-6 py-10 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-[760px] flex-col items-center justify-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          SEO Enhancement
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em] sm:text-[3.4rem]">
          Blog brief not found
        </h1>
        <p className="mt-4 max-w-[34rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
          This page opens after payment for the SEO Enhancement package. If you
          have not checked out yet, go back to the home page and choose the
          package there.
        </p>
        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23]"
        >
          Back to home
          <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </main>
  );
}

function LockedState({ sessionId }: { sessionId: string | null }) {
  const thankYouHref = sessionId
    ? `/thank-you?checkout=success&blog=complete&session_id=${encodeURIComponent(sessionId)}`
    : "/thank-you";

  return (
    <main className="relative min-h-screen bg-[var(--surface)] px-6 py-10 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-[760px] flex-col items-center justify-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          SEO Enhancement
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em] sm:text-[3.4rem]">
          Blog brief already submitted
        </h1>
        <p className="mt-4 max-w-[34rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
          Your brief is locked to keep the submission accurate. View your
          receipt and brief to review details or request corrections via
          WhatsApp.
        </p>
        <Link
          href={thankYouHref}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23]"
        >
          View receipt and brief
          <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/"
          className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold)] underline decoration-[rgba(238,32,40,0.32)] underline-offset-4 transition-colors duration-200 hover:text-[#d81c23] hover:decoration-[#d81c23]"
        >
          Back to home
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}

function LockedLoadingState() {
  const [isSecured, setIsSecured] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsSecured(true);
    }, lockedLoadingCheckDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
      <div className="absolute inset-0 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition-colors duration-300 ${
            isSecured
              ? "border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
              : "border-white/12 bg-white/10 text-white"
          }`}
        >
          {isSecured ? (
            <CheckCircle2 className="h-10 w-10 animate-pulse" />
          ) : (
            <LoaderCircle className="h-9 w-9 animate-spin" />
          )}
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {isSecured ? "Brief submitted" : "Checking brief"}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
          {isSecured ? "Submission secured" : "Reviewing status"}
        </h1>
        <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
          {isSecured ? "Loading receipt options." : "Confirming your submitted brief."}
        </p>
      </div>
    </main>
  );
}

function readBlogBriefLock(sessionId: string | null) {
  if (!sessionId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(blogBriefSubmittedStorageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<BlogBriefLockRecord>;

    if (parsed.sessionId !== sessionId) {
      return null;
    }

    return {
      sessionId: parsed.sessionId ?? sessionId,
      submittedAt: parsed.submittedAt ?? "",
    } satisfies BlogBriefLockRecord;
  } catch {
    return null;
  }
}

function getBlogBriefSessionId() {
  const params = new URLSearchParams(window.location.search);
  const urlSessionId = params.get("session_id");
  const storedSessionId = window.sessionStorage.getItem(thankYouStripeSessionKey);
  const sessionId = urlSessionId ?? storedSessionId;

  if (urlSessionId) {
    window.sessionStorage.setItem(thankYouStripeSessionKey, urlSessionId);
  }

  return sessionId;
}

function getStoredFieldValue(
  fields: Record<string, string | string[]> | undefined,
  key: string,
) {
  const rawValue = fields?.[key];

  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? "";
  }

  return rawValue ?? "";
}

function getVerificationCtaState(ctaText: string | undefined) {
  const normalizedCtaText = ctaText?.trim() ?? "";

  if (!normalizedCtaText) {
    return {
      preferredCTA: initialBlogBriefForm.preferredCTA,
      customCTA: "",
    };
  }

  if (ctaOptions.includes(normalizedCtaText)) {
    return {
      preferredCTA: normalizedCtaText,
      customCTA: "",
    };
  }

  return {
    preferredCTA: "Other CTA",
    customCTA: normalizedCtaText,
  };
}

function buildReceiptFromVerification(
  payload: StripeVerifyPayload,
  storedReceipt: Partial<ReceiptData> | null,
) {
  const order = payload.order ?? {};
  const blog = payload.blog ?? {};
  const storedSubmissionDetails = storedReceipt?.submissionDetails;
  const ctaState = getVerificationCtaState(blog.ctaText);
  const submissionDetails = {
    ...(storedSubmissionDetails ?? {}),
    targetLocation:
      blog.targetLocation ||
      order.targetLocation ||
      getStoredFieldValue(storedSubmissionDetails, "targetLocation"),
    briefBusinessDescription:
      blog.briefBusinessDescription ||
      getStoredFieldValue(storedSubmissionDetails, "briefBusinessDescription"),
    mainProductsServices:
      blog.mainProductsServices ||
      getStoredFieldValue(storedSubmissionDetails, "mainProductsServices"),
    targetKeywords:
      blog.targetKeywords || getStoredFieldValue(storedSubmissionDetails, "targetKeywords"),
    mainGoal: blog.mainGoal || getStoredFieldValue(storedSubmissionDetails, "mainGoal"),
    idealCustomers:
      blog.idealCustomers || getStoredFieldValue(storedSubmissionDetails, "idealCustomers"),
    topicsToCover:
      blog.topicsToCover || getStoredFieldValue(storedSubmissionDetails, "topicsToCover"),
    preferredCTA: ctaState.preferredCTA,
    customCTA: ctaState.customCTA,
    pagesToPush: blog.pagesToPush || getStoredFieldValue(storedSubmissionDetails, "pagesToPush"),
    additionalNotes:
      blog.additionalNotes || getStoredFieldValue(storedSubmissionDetails, "additionalNotes"),
  };

  return {
    fullName: order.fullName || storedReceipt?.fullName || "",
    businessName: order.businessName || storedReceipt?.businessName || "",
    websiteUrl: order.websiteUrl || storedReceipt?.websiteUrl || "",
    whatsappNumber: order.whatsappNumber || storedReceipt?.whatsappNumber || "",
    whatsappConsent: storedReceipt?.whatsappConsent ?? false,
    selectedPackage: order.packageTitle || storedReceipt?.selectedPackage || "SEO Enhancement",
    selectedPackageValue: "blog",
    submissionDetails,
    paidAt: payload.paidAtIso ?? storedReceipt?.paidAt ?? storedReceipt?.submittedAt ?? "",
    submittedAt: storedReceipt?.submittedAt ?? payload.paidAtIso ?? new Date().toISOString(),
    receiptCode: payload.receiptCode ?? order.receiptCode ?? storedReceipt?.receiptCode ?? "",
  } satisfies ReceiptData;
}

function buildFormFromReceipt(receipt: ReceiptData) {
  const submissionDetails = receipt.submissionDetails;
  const ctaState = getVerificationCtaState(getStoredFieldValue(submissionDetails, "preferredCTA"));
  const resolvedPreferredCta =
    getStoredFieldValue(submissionDetails, "preferredCTA") === "Other CTA"
      ? "Other CTA"
      : ctaState.preferredCTA;
  const resolvedCustomCta =
    getStoredFieldValue(submissionDetails, "preferredCTA") === "Other CTA"
      ? getStoredFieldValue(submissionDetails, "customCTA")
      : ctaState.customCTA;

  return {
    briefBusinessDescription: getStoredFieldValue(submissionDetails, "briefBusinessDescription"),
    mainProductsServices: getStoredFieldValue(submissionDetails, "mainProductsServices"),
    targetKeywords: getStoredFieldValue(submissionDetails, "targetKeywords"),
    targetLocation: getStoredFieldValue(submissionDetails, "targetLocation"),
    mainGoal: getStoredFieldValue(submissionDetails, "mainGoal") || initialBlogBriefForm.mainGoal,
    idealCustomers: getStoredFieldValue(submissionDetails, "idealCustomers"),
    topicsToCover: getStoredFieldValue(submissionDetails, "topicsToCover"),
    preferredCTA: resolvedPreferredCta,
    customCTA: resolvedCustomCta,
    pagesToPush: getStoredFieldValue(submissionDetails, "pagesToPush"),
    additionalNotes: getStoredFieldValue(submissionDetails, "additionalNotes"),
  } satisfies BlogBriefForm;
}

async function syncBlogBriefStripeMetadata(receipt: ReceiptData, form: BlogBriefForm, sessionId: string) {
  const effectiveCTA = form.preferredCTA === "Other CTA" && form.customCTA.trim()
    ? form.customCTA.trim()
    : form.preferredCTA;
  const orderDetails = {
    selectedPackage: receipt.selectedPackageValue,
    fullName: receipt.fullName,
    businessName: receipt.businessName,
    websiteUrl: receipt.websiteUrl,
    whatsappNumber: receipt.whatsappNumber,
    targetLocation: form.targetLocation,
  };
  const blogDetails = {
    briefBusinessDescription: form.briefBusinessDescription,
    mainProductsServices: form.mainProductsServices,
    mainGoal: form.mainGoal,
    targetKeywords: form.targetKeywords,
    idealCustomers: form.idealCustomers,
    topicsToCover: form.topicsToCover,
    ctaText: effectiveCTA,
    pagesToPush: form.pagesToPush,
    additionalNotes: form.additionalNotes,
  };

  const response = await fetch("/api/stripe/session-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      selectedPackage: "blog",
      fullName: receipt.fullName,
      businessName: receipt.businessName,
      websiteUrl: receipt.websiteUrl,
      whatsappNumber: receipt.whatsappNumber,
      targetLocation: form.targetLocation,
      briefBusinessDescription: form.briefBusinessDescription,
      mainProductsServices: form.mainProductsServices,
      targetKeywords: form.targetKeywords,
      mainGoal: form.mainGoal,
      idealCustomers: form.idealCustomers,
      topicsToCover: form.topicsToCover,
      ctaText: effectiveCTA,
      pagesToPush: form.pagesToPush,
      additionalNotes: form.additionalNotes,
      orderDetails,
      blogDetails,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to save Stripe metadata.");
  }
}

export function BlogBriefPage() {
  const [lockedSessionId, setLockedSessionId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [form, setForm] = useState<BlogBriefForm>(initialBlogBriefForm);
  const [phase, setPhase] = useState<"loading" | "confirming" | "ready">("loading");
  const [accessState, setAccessState] = useState<"checking" | "allowed" | "denied" | "locking" | "locked">(
    "checking",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let confirmTimeoutId: number | undefined;
    const startedAt = Date.now();

    const waitForMinimumLoadingTime = async () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minimumLoadingMs - elapsed);

      if (remaining > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
      }
    };

    const waitForLockedLoadingTime = async () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, lockedLoadingTotalMs - elapsed);

      if (remaining > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
      }
    };

    const verifyPaymentAccess = async (sessionId: string) => {
      const existingLock = readBlogBriefLock(sessionId);

      if (existingLock) {
        setLockedSessionId(sessionId);
      }

      try {
        const response = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
        const payload = (await response.json()) as StripeVerifyPayload;

        const allowed = response.ok && payload.isPaid === true && payload.selectedPackage === "blog";

        if (!allowed) {
          setAccessState("denied");
          return null;
        }

        if (payload.hasBlogBrief || existingLock) {
          setLockedSessionId(sessionId);
          setAccessState("locking");
          await waitForLockedLoadingTime();

          if (!cancelled) {
            setAccessState("locked");
          }

          return null;
        }

        setAccessState("allowed");
        return payload;
      } catch {
        setAccessState("denied");
        return null;
      }
    };

    const initializeBrief = async () => {
      try {
        const sessionId = getBlogBriefSessionId();

        if (!sessionId) {
          setAccessState("denied");
          await waitForMinimumLoadingTime();
          return;
        }

        const verifiedPayload = await verifyPaymentAccess(sessionId);

        if (!verifiedPayload) {
          await waitForMinimumLoadingTime();
          return;
        }

        const raw = window.sessionStorage.getItem(thankYouStorageKey);
        const storedReceipt = raw ? (JSON.parse(raw) as Partial<ReceiptData>) : null;
        const nextReceipt = buildReceiptFromVerification(verifiedPayload, storedReceipt);
        const nextForm = buildFormFromReceipt(nextReceipt);

        if (!cancelled) {
          setReceipt(nextReceipt);
          setForm(nextForm);
          window.sessionStorage.setItem(thankYouStorageKey, JSON.stringify(nextReceipt));
        }

        await waitForMinimumLoadingTime();

        if (!cancelled) {
          setPhase("confirming");

          confirmTimeoutId = window.setTimeout(() => {
            if (!cancelled) {
              setPhase("ready");
            }
          }, confirmationMs);
        }
      } catch {
        await waitForMinimumLoadingTime();
      }
    };

    void initializeBrief();

    return () => {
      cancelled = true;

      if (confirmTimeoutId) {
        window.clearTimeout(confirmTimeoutId);
      }
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!receipt) {
      setError("We could not find your paid submission.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const sessionId = getBlogBriefSessionId();

      if (!sessionId) {
        throw new Error("We could not verify your Stripe session.");
      }

      const mergedReceipt: ReceiptData = {
        ...receipt,
        submissionDetails: {
          ...(receipt.submissionDetails ?? {}),
          ...form,
          whatsappNumber: receipt.whatsappNumber,
          whatsappConsent: String(receipt.whatsappConsent ?? false),
        },
        paidAt: receipt.paidAt ?? receipt.submittedAt,
        submittedAt: new Date().toISOString(),
      };

      await syncBlogBriefStripeMetadata(receipt, form, sessionId);
      window.sessionStorage.setItem(thankYouStorageKey, JSON.stringify(mergedReceipt));
      window.sessionStorage.setItem(thankYouStripeSessionKey, sessionId);
      window.localStorage.setItem(
        blogBriefSubmittedStorageKey,
        JSON.stringify({
          sessionId,
          submittedAt: mergedReceipt.submittedAt,
        } satisfies BlogBriefLockRecord),
      );

      const trackingSnapshot = readTrackingSnapshotFromBrowser();

      if (trackingSnapshot) {
        dispatchSiteTarikAnalyticsEvent("site_tarik_blog_brief_submitted", {
          ...buildBrowserTrackingMetadata(trackingSnapshot),
          selected_package: "blog",
          checkout_session_id: sessionId,
          receipt_code: mergedReceipt.receiptCode ?? "",
        });
      }

      const thankYouUrl = sessionId
        ? `/thank-you?checkout=success&blog=complete&session_id=${encodeURIComponent(sessionId)}`
        : "/thank-you?checkout=success&blog=complete";

      window.location.assign(thankYouUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not save the blog brief. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  if (accessState === "denied") {
    return <EmptyState />;
  }

  if (accessState === "locking") {
    return <LockedLoadingState />;
  }

  if (accessState === "locked") {
    return <LockedState sessionId={lockedSessionId} />;
  }

  if (phase === "loading") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
        <div className="absolute inset-0 backdrop-blur-2xl" />
        <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Verifying access
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
            Preparing your brief
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
            We&apos;re confirming your payment details and loading the brief form.
          </p>
        </div>
      </main>
    );
  }

  if (phase === "confirming") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
        <div className="absolute inset-0 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[#22c55e] shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
            <CheckCircle2 className="h-10 w-10 animate-pulse" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Payment confirmed
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
            Ngam!
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
            Your payment is confirmed. We&apos;re loading the blog brief now.
          </p>
        </div>
      </main>
    );
  }

  if (!receipt) {
    return <EmptyState />;
  }

  const paymentTime = receipt.paidAt
    ? formatSiteTarikDateTime(receipt.paidAt)
    : receipt.submittedAt
      ? formatSiteTarikDateTime(receipt.submittedAt)
      : "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface)] text-[var(--foreground)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.92)] text-[var(--foreground)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex w-full max-w-[1230px] items-center justify-between px-5 py-7 sm:px-7 lg:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-none tracking-[-0.04em]"
          >
            SiteTarik
          </Link>

          <span className="hidden rounded-full border border-[rgba(238,32,40,0.14)] bg-[var(--gold-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(17,17,17,0.68)] sm:inline-flex">
            Payment complete
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1230px] px-6 pb-12 pt-[110px] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-7 lg:sticky lg:top-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              Next step
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.2rem] leading-[1.02] tracking-[-0.04em] sm:text-[2.7rem]">
              Fill the blog brief
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm leading-6 text-[var(--muted)] sm:text-base">
              Payment complete. Add the blog details so we can prepare the
              SEO Enhancement handoff.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Your details
              </p>
              <dl className="mt-3">
                {paymentTime ? <SummaryRow label="Paid At (MYT)" value={paymentTime} /> : null}
                <SummaryRow label="Full Name" value={receipt.fullName || "Not provided"} />
                <SummaryRow label="Business Name" value={receipt.businessName || "Not provided"} />
                <SummaryRow label="Website URL" value={receipt.websiteUrl || "Not provided"} />
                <SummaryRow label="WhatsApp" value={receipt.whatsappNumber || "Not provided"} />
                <SummaryRow label="Package" value={receipt.selectedPackage} />
              </dl>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Blog Add-On Form
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-[2.2rem] leading-[1.02] tracking-[-0.04em] sm:text-[2.6rem]">
                Tell us what the blog should cover
              </h2>
              <p className="mt-4 max-w-[42rem] text-base leading-7 text-[var(--muted)]">
                Keep it concise. We already have your checkout details.
              </p>
            </div>

            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-5">
                <label className="block">
                  <FieldLabel required>Briefly describe your business</FieldLabel>
                  <TextArea
                    name="briefBusinessDescription"
                    placeholder="What do you offer?"
                    value={form.briefBusinessDescription}
                    onChange={handleChange}
                    rows={2}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Main products or services</FieldLabel>
                  <TextArea
                    name="mainProductsServices"
                    placeholder="Main services or products"
                    value={form.mainProductsServices}
                    onChange={handleChange}
                    rows={2}
                    required
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>Target keywords or search terms</FieldLabel>
                    <TextArea
                      name="targetKeywords"
                      placeholder="Key search terms"
                      value={form.targetKeywords}
                      onChange={handleChange}
                      rows={2}
                      required
                    />
                  </label>

                  <label className="block">
                    <FieldLabel required>Target location or market</FieldLabel>
                    <TextArea
                      name="targetLocation"
                      placeholder="City or market"
                      value={form.targetLocation}
                      onChange={handleChange}
                      rows={2}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>Main goal of the blog pages</FieldLabel>
                    <SelectControl
                      name="mainGoal"
                      value={form.mainGoal}
                      onChange={handleChange}
                      options={goalOptions}
                      required
                    />
                  </label>

                  <label className="block">
                    <FieldLabel optional>Ideal customers</FieldLabel>
                    <TextArea
                      name="idealCustomers"
                      placeholder="Ideal customer"
                      value={form.idealCustomers}
                      onChange={handleChange}
                      rows={2}
                    />
                  </label>
                </div>

                <label className="block">
                  <FieldLabel optional>Topics to cover</FieldLabel>
                  <TextArea
                    name="topicsToCover"
                    placeholder="Topics to cover"
                    value={form.topicsToCover}
                    onChange={handleChange}
                    rows={2}
                  />
                </label>

                <label className="block">
                  <FieldLabel optional>Preferred CTA</FieldLabel>
                  <SelectControl
                    name="preferredCTA"
                    value={form.preferredCTA}
                    onChange={handleChange}
                    options={ctaOptions}
                  />
                </label>

                {form.preferredCTA === "Other CTA" ? (
                  <label className="block">
                    <FieldLabel optional>Custom CTA</FieldLabel>
                    <TextInput
                      name="customCTA"
                      placeholder="Example: Check availability, Start my project, Talk to our team"
                      value={form.customCTA}
                      onChange={handleChange}
                    />
                  </label>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel optional>Pages or offers to push</FieldLabel>
                    <TextArea
                      name="pagesToPush"
                      placeholder="Pages or offers"
                      value={form.pagesToPush}
                      onChange={handleChange}
                      rows={2}
                    />
                  </label>

                  <label className="block">
                    <FieldLabel optional>Additional notes</FieldLabel>
                    <TextArea
                      name="additionalNotes"
                      placeholder="Any extra notes"
                      value={form.additionalNotes}
                      onChange={handleChange}
                      rows={2}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.9)] px-5 py-4">
                {error ? (
                  <p className="mb-3 rounded-[1rem] border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                      Final step
                    </p>
                    <p className="mt-1 text-[0.95rem] leading-6 text-[var(--foreground)]">
                      After you submit, we&apos;ll send you to the confirmation page.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23] hover:shadow-[0_18px_35px_rgba(0,0,0,0.16)]"
                  >
                    {submitting ? (
                      <>
                        Saving
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        Ngam?
                        <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                          <ThumbsUp className="h-4 w-4" />
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
