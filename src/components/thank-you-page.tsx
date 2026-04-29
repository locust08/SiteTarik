"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Layers3,
  LoaderCircle,
  Mail,
  Search,
} from "lucide-react";
import { orderCompleteStorageKey, thankYouStorageKey, thankYouStripeSessionKey } from "@/lib/order-flow";

type ReceiptData = {
  fullName: string;
  businessName: string;
  websiteUrl: string;
  emailAddress: string;
  selectedPackage: string;
  selectedPackageValue: string;
  submissionDetails?: Record<string, string | string[]>;
  submittedAt: string;
};

const fallbackReceipt: ReceiptData = {
  fullName: "Pending submission",
  businessName: "Pending submission",
  websiteUrl: "Pending submission",
  emailAddress: "Pending submission",
  selectedPackage: "Core Relaunch",
  selectedPackageValue: "core",
  submittedAt: "",
};

const nextSteps = [
  { title: "Prep", description: "Queued for build.", icon: Layers3 },
  { title: "SEO", description: "Basic SEO applied.", icon: Search },
  { title: "Delivery", description: "Sent to your email.", icon: Mail },
];

const oneHourMs = 60 * 60 * 1000;
const loadingMs = 1200;
const confirmationMs = 600;

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const blogFieldLabels: Array<[string, string]> = [
  ["briefBusinessDescription", "Briefly describe your business"],
  ["mainProductsServices", "Main products or services"],
  ["targetKeywords", "Target keywords or search terms"],
  ["targetLocation", "Target location or market"],
  ["mainGoal", "Main goal of the blog pages"],
  ["idealCustomers", "Ideal customers"],
  ["topicsToCover", "Topics to cover"],
  ["preferredCTA", "Preferred CTA"],
  ["pagesToPush", "Pages or offers to push"],
  ["additionalNotes", "Additional notes"],
];

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1.5 border-b border-[rgba(0,0,0,0.06)] py-3 last:border-b-0 sm:grid-cols-[0.9fr_1.1fr] sm:items-start">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(17,17,17,0.68)]">
        {label}
      </dt>
      <dd className="min-w-0 whitespace-normal break-words text-sm leading-6 text-[#111111] [overflow-wrap:anywhere] sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function ThankYouPage({
  stripeSessionId: initialStripeSessionId,
  isActiveCheckout = false,
}: {
  stripeSessionId?: string;
  isActiveCheckout?: boolean;
}) {
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(
    initialStripeSessionId ?? null,
  );
  const [receipt, setReceipt] = useState<ReceiptData>(fallbackReceipt);
  const [phase, setPhase] = useState<"loading" | "confirming" | "ready">(
    isActiveCheckout ? "loading" : "ready",
  );
  const [isBlogReviewOpen, setIsBlogReviewOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [stripeReceiptUrl, setStripeReceiptUrl] = useState<string | null>(null);
  const [isResolvingReceipt, setIsResolvingReceipt] = useState(false);
  const isBlogPackage = receipt.selectedPackageValue === "blog";
  const confirmationPaddingClass = isBlogPackage
    ? "pb-3 sm:pb-4 lg:pb-4"
    : "pb-4 sm:pb-5 lg:pb-5";

  useEffect(() => {
    if (initialStripeSessionId) {
      window.sessionStorage.setItem(thankYouStripeSessionKey, initialStripeSessionId);
    }

    if (!isActiveCheckout) {
      try {
        const raw = window.sessionStorage.getItem(thankYouStorageKey);
        const storedStripeSessionId = window.sessionStorage.getItem(thankYouStripeSessionKey);

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ReceiptData>;

          setReceipt({
            ...fallbackReceipt,
            ...parsed,
          });
        }

        if (!initialStripeSessionId && storedStripeSessionId) {
          setStripeSessionId(storedStripeSessionId);
        }
      } catch {
        setReceipt(fallbackReceipt);
      }

      setPhase("ready");
      return;
    }

    let confirmTimeoutId: number | undefined;

    const loadTimeoutId = window.setTimeout(() => {
      try {
        const raw = window.sessionStorage.getItem(thankYouStorageKey);
        const storedStripeSessionId = window.sessionStorage.getItem(thankYouStripeSessionKey);

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ReceiptData>;

          setReceipt({
            ...fallbackReceipt,
            ...parsed,
          });
        }

        if (storedStripeSessionId) {
          setStripeSessionId(storedStripeSessionId);
        }
      } catch {
        setReceipt(fallbackReceipt);
      }

      if (!isActiveCheckout) {
        setPhase("ready");
        return;
      }

      setPhase("confirming");

      confirmTimeoutId = window.setTimeout(() => {
        setPhase("ready");
      }, confirmationMs);
    }, loadingMs);

    return () => {
      window.clearTimeout(loadTimeoutId);

      if (confirmTimeoutId) {
        window.clearTimeout(confirmTimeoutId);
      }
    };
  }, [initialStripeSessionId, isActiveCheckout]);

  useEffect(() => {
    const applyScrollLock = () => {
      const shouldLockScroll = isBlogReviewOpen;

      document.documentElement.style.overflow = shouldLockScroll ? "hidden" : "";
      document.body.style.overflow = shouldLockScroll ? "hidden" : "";
      document.body.style.height = "";
    };

    applyScrollLock();
    window.addEventListener("resize", applyScrollLock);

    return () => {
      window.removeEventListener("resize", applyScrollLock);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isBlogPackage, isBlogReviewOpen]);

  useEffect(() => {
    if (phase !== "ready" || !receipt.submittedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [phase, receipt.submittedAt]);

  useEffect(() => {
    if (phase !== "ready" || stripeReceiptUrl || !stripeSessionId) {
      return;
    }

    const controller = new AbortController();

    const resolveReceipt = async () => {
      setIsResolvingReceipt(true);

      try {
        const response = await fetch(
          `/api/stripe/receipt?session_id=${encodeURIComponent(stripeSessionId)}`,
          {
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as { receiptUrl?: string };

        if (response.ok && payload.receiptUrl) {
          setStripeReceiptUrl(payload.receiptUrl);
        }
      } catch {
        // If Stripe receipt lookup fails, the button stays visible and will retry on click.
      } finally {
        setIsResolvingReceipt(false);
      }
    };

    void resolveReceipt();

    return () => {
      controller.abort();
    };
  }, [phase, stripeReceiptUrl, stripeSessionId]);

  useEffect(() => {
    if (phase !== "ready" || !stripeSessionId) {
      return;
    }

    const orderCompleteValue = JSON.stringify({
      sessionId: stripeSessionId,
      completedAt: new Date().toISOString(),
    });

    window.localStorage.setItem(orderCompleteStorageKey, orderCompleteValue);
  }, [phase, stripeSessionId]);

  const receivedAt = receipt.submittedAt
    ? new Date(receipt.submittedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const countdownLabel = receipt.submittedAt
    ? formatCountdown(new Date(receipt.submittedAt).getTime() + oneHourMs - now)
    : "";

  const handleDownloadReceipt = async () => {
    if (!stripeSessionId) {
      return;
    }

    if (!stripeReceiptUrl) {
      setIsResolvingReceipt(true);

      try {
        const response = await fetch(
          `/api/stripe/receipt?session_id=${encodeURIComponent(stripeSessionId)}`,
        );
        const payload = (await response.json()) as { receiptUrl?: string };

        if (!response.ok || !payload.receiptUrl) {
          return;
        }

        setStripeReceiptUrl(payload.receiptUrl);
        window.open(payload.receiptUrl, "_blank", "noopener,noreferrer");
        return;
      } catch {
        return;
      } finally {
        setIsResolvingReceipt(false);
      }
    }

    window.open(stripeReceiptUrl, "_blank", "noopener,noreferrer");
  };

  if (phase === "loading") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
        <div className="absolute inset-0 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Processing
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
            Hold on
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
            We&apos;re preparing your receipt.
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
            Confirmed
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
            Ngam!
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
            Confirmation saved.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--surface)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(255,255,255,0.9)] text-[var(--foreground)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-[background-color,border-color,color,box-shadow] duration-300">
        <div className="mx-auto w-full max-w-[1230px] px-5 py-7 sm:px-7 lg:px-6">
          <div className="flex items-center">
            <Link
              href="/"
              className="font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-none tracking-[-0.04em]"
            >
              SiteTarik
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1230px] flex-col px-6 pb-5 pt-[88px] sm:px-8 sm:pt-[88px] lg:px-10 lg:pt-[88px]">
        <section className="grid flex-1 items-start gap-8 py-6 pb-12 lg:grid-cols-[0.98fr_1.02fr] lg:items-stretch lg:py-8 lg:pb-14">
          <div
            className={`flex h-full flex-col transition-all duration-700 ${
              phase === "ready" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="max-w-[40rem] space-y-3">
              <h1 className="font-[family-name:var(--font-heading)] text-[2.75rem] leading-[0.98] tracking-[-0.055em] sm:text-[3.9rem] lg:text-[4.8rem]">
                We&apos;re on it.
              </h1>
              <p className="max-w-[28rem] text-base leading-7 text-[var(--muted)] sm:text-lg">
                Preparing your website handoff for final delivery.{" "}
                <Link
                  href="https://wa.me/60123456789"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--foreground)] transition-colors duration-200 hover:text-[#25D366]"
                >
                  <span className="md:hidden">Questions? WhatsApp us.</span>
                  <span className="hidden items-center gap-1 md:inline-flex group">
                    <span>Questions?</span>
                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover:max-w-[7.5rem] group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:max-w-[7.5rem] group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100">
                      WhatsApp us.
                    </span>
                  </span>
                </Link>
              </p>
            </div>

            <div className="mt-4 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:mt-5 sm:p-7 lg:mt-5">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                    What Happens Next
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Clear, fast, and in motion.
                  </p>
                </div>
                {receivedAt ? (
                    <span className="rounded-full border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(17,17,17,0.68)]">
                      {receivedAt}
                    </span>
                ) : null}
              </div>

              <div className="mt-2.5 grid gap-2.5">
                {nextSteps.map((step) => {
                  const Icon = step.icon;
                  const isPrepStep = step.title === "Prep";

                  return (
                    <div
                      key={step.title}
                      className="flex gap-4 rounded-[1.1rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--gold)] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <h3 className="text-sm font-semibold text-[var(--foreground)]">
                            {step.title}
                          </h3>
                          {isPrepStep && countdownLabel ? (
                            <span className="inline-flex w-fit items-center rounded-full border border-[rgba(238,32,40,0.14)] bg-[var(--gold-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(17,17,17,0.68)]">
                              ETA {countdownLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 rounded-[1.1rem] border border-[rgba(238,32,40,0.14)] bg-[var(--gold-soft)] px-4 py-3.5 text-sm leading-6 text-[var(--foreground)]">
                Delivered within <strong>1 hour</strong>. Blog Add-On follows in the same handoff.
              </div>
            </div>
          </div>

          <aside
            className={`h-full rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-all duration-700 sm:p-7 lg:sticky lg:top-5 ${confirmationPaddingClass} ${
              phase === "ready" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                  Submission Confirmation
                </p>
                <h2 className="mt-2.5 font-[family-name:var(--font-heading)] text-[1.75rem] leading-[1.02] tracking-[-0.04em]">
                  Your details
                </h2>
              </div>
              <div className="rounded-full border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                {receipt.selectedPackageValue === "blog" ? "Blog" : "Core"}
              </div>
            </div>

            <dl className="mt-2.5">
              <SummaryRow label="Full Name" value={receipt.fullName} />
              <SummaryRow label="Business Name" value={receipt.businessName} />
              <SummaryRow label="Website URL" value={receipt.websiteUrl} />
              <SummaryRow label="Email" value={receipt.emailAddress} />
              <SummaryRow label="Package" value={receipt.selectedPackage} />
            </dl>

            {isBlogPackage ? (
              <div className="mt-3.5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setIsBlogReviewOpen(true)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="max-w-[34rem]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                      Blog Content Brief
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)] sm:text-base">
                      Open the submitted blog brief and review the fields you filled in.
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                </button>
              </div>
            ) : null}

            <div className="mt-3 rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Confirmed</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    Final link to your email. Review details, then contact us through WhatsApp
                    for any fix.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <Link
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noreferrer"
                className="group/whatsapp inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#1fb85a] hover:shadow-[0_10px_22px_rgba(37,211,102,0.16)]"
              >
                WhatsApp Us
                <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover/whatsapp:w-4 group-hover/whatsapp:translate-x-0 group-hover/whatsapp:opacity-100 group-focus-visible/whatsapp:w-4 group-focus-visible/whatsapp:translate-x-0 group-focus-visible/whatsapp:opacity-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1280px-WhatsApp.svg.png?_=20220228223904"
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </span>
              </Link>

              <button
                type="button"
                onClick={() => void handleDownloadReceipt()}
                disabled={isResolvingReceipt || !stripeSessionId}
                className="group/receipt inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(238,32,40,0.16)] bg-[var(--surface-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 hover:-translate-y-0.5 hover:border-[rgba(238,32,40,0.22)] hover:bg-[var(--gold-soft)] hover:shadow-[0_12px_26px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolvingReceipt ? "Loading Receipt..." : "Download Receipt"}
                <span className="w-0 translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover/receipt:w-4 group-hover/receipt:translate-x-0 group-hover/receipt:opacity-100 group-focus-visible/receipt:w-4 group-focus-visible/receipt:translate-x-0 group-focus-visible/receipt:opacity-100">
                  <Download className="h-4 w-4 text-[var(--gold)]" />
                </span>
              </button>

            </div>
          </aside>
        </section>
      </div>

      {isBlogPackage && isBlogReviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Blog brief review"
          onClick={() => setIsBlogReviewOpen(false)}
        >
            <div
            className="w-full max-w-[760px] overflow-hidden rounded-[1.8rem] border border-white/12 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                  Blog Content Brief
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-heading)] text-[1.6rem] leading-[1.05] tracking-[-0.04em]">
                  Review your submitted details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlogReviewOpen(false)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[rgba(238,32,40,0.18)] hover:bg-[var(--gold-soft)] hover:text-[var(--foreground)] hover:shadow-[0_10px_22px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-4">
                {blogFieldLabels.map(([key, label]) => {
                  const rawValue = receipt.submissionDetails?.[key];
                  const rawCustomCTA = receipt.submissionDetails?.customCTA;
                  const customCTA = Array.isArray(rawCustomCTA)
                    ? rawCustomCTA.join(", ")
                    : rawCustomCTA;
                  const value = key === "preferredCTA" && rawValue === "Other CTA" && customCTA?.trim()
                    ? customCTA
                    : Array.isArray(rawValue)
                    ? rawValue.length > 0
                      ? rawValue.join(", ")
                      : "Not specified"
                    : rawValue && rawValue.trim()
                      ? rawValue
                      : "Not specified";

                  return <DetailRow key={key} label={label} value={value} />;
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
