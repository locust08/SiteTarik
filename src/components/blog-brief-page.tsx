"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

type BlogBriefForm = {
  briefBusinessDescription: string;
  mainProductsServices: string;
  targetKeywords: string;
  targetLocation: string;
  mainGoal: string;
  idealCustomers: string;
  topicsToCover: string;
  pagesToPush: string;
  additionalNotes: string;
};

type ReceiptData = {
  fullName: string;
  businessName: string;
  websiteUrl: string;
  emailAddress: string;
  selectedPackage: string;
  selectedPackageValue: "core" | "blog";
  submissionDetails?: Record<string, string | string[]>;
  submittedAt: string;
};

const thankYouStorageKey = "siteTarikThankYouSubmission";

const goalOptions = [
  "Get more leads",
  "Get more enquiries",
  "Increase product sales",
  "Improve brand visibility",
  "Educate potential customers",
  "Support SEO growth",
];

const initialBlogBriefForm: BlogBriefForm = {
  briefBusinessDescription: "",
  mainProductsServices: "",
  targetKeywords: "",
  targetLocation: "",
  mainGoal: "Get more leads",
  idealCustomers: "",
  topicsToCover: "",
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
  rows = 4,
  required = false,
}: {
  name: keyof BlogBriefForm;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      name={name}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full resize-none rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3.5 text-base text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(17,17,17,0.68)]">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-sm leading-6 text-[#111111] sm:text-base">
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

export function BlogBriefPage() {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [form, setForm] = useState<BlogBriefForm>(initialBlogBriefForm);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(thankYouStorageKey);

      if (!raw) {
        setReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ReceiptData>;

      if (parsed.selectedPackageValue !== "blog") {
        setReady(true);
        return;
      }

      setReceipt({
        fullName: parsed.fullName ?? "",
        businessName: parsed.businessName ?? "",
        websiteUrl: parsed.websiteUrl ?? "",
        emailAddress: parsed.emailAddress ?? "",
        selectedPackage: parsed.selectedPackage ?? "SEO Enhancement",
        selectedPackageValue: "blog",
        submissionDetails: parsed.submissionDetails ?? undefined,
        submittedAt: parsed.submittedAt ?? new Date().toISOString(),
      });

      setForm((current) => ({
        ...current,
        targetLocation: parsed.submissionDetails?.targetLocation
          ? String(parsed.submissionDetails.targetLocation)
          : "",
      }));
    } finally {
      setReady(true);
    }
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!receipt) {
      setError("We could not find your paid submission.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const mergedReceipt: ReceiptData = {
        ...receipt,
        submissionDetails: form,
        submittedAt: new Date().toISOString(),
      };

      window.sessionStorage.setItem(thankYouStorageKey, JSON.stringify(mergedReceipt));
      window.location.assign("/thank-you?checkout=success&blog=complete");
    } catch {
      setError("We could not save the blog brief. Please try again.");
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
        <div className="absolute inset-0 backdrop-blur-2xl" />
        <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Loading
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
            Just a moment
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
            We&apos;re preparing your blog brief.
          </p>
        </div>
      </main>
    );
  }

  if (!receipt) {
    return <EmptyState />;
  }

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
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[0.98] tracking-[-0.055em] sm:text-[3.3rem]">
              Fill the blog brief
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
              Your payment is done. Add the blog details now so we can prepare the
              12-page SEO Enhancement handoff.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Your details
              </p>
              <dl className="mt-3">
                <SummaryRow label="Full Name" value={receipt.fullName || "Not provided"} />
                <SummaryRow label="Business Name" value={receipt.businessName || "Not provided"} />
                <SummaryRow label="Website URL" value={receipt.websiteUrl || "Not provided"} />
                <SummaryRow label="Email" value={receipt.emailAddress || "Not provided"} />
                <SummaryRow label="Package" value={receipt.selectedPackage} />
              </dl>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Blog Add-On Form
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-[2.2rem] leading-[1.02] tracking-[-0.04em] sm:text-[2.7rem]">
                Tell us what the blog should cover
              </h2>
              <p className="mt-4 max-w-[42rem] text-base leading-7 text-[var(--muted)]">
                Keep it simple. We already have your basic details from checkout, so
                this form only covers the blog plan itself.
              </p>
            </div>

            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-5">
                <label className="block">
                  <FieldLabel required>Briefly describe your business</FieldLabel>
                  <TextArea
                    name="briefBusinessDescription"
                    placeholder="What does your business do and offer?"
                    value={form.briefBusinessDescription}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Main products or services</FieldLabel>
                  <TextArea
                    name="mainProductsServices"
                    placeholder="List your main services or products"
                    value={form.mainProductsServices}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>Target keywords or search terms</FieldLabel>
                    <TextArea
                      name="targetKeywords"
                      placeholder="List keywords or phrases your customers may search for"
                      value={form.targetKeywords}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </label>

                  <label className="block">
                    <FieldLabel required>Target location or market</FieldLabel>
                    <TextArea
                      name="targetLocation"
                      placeholder="Kuala Lumpur, Johor, nationwide"
                      value={form.targetLocation}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>Main goal of the blog pages</FieldLabel>
                    <select
                      name="mainGoal"
                      value={form.mainGoal}
                      onChange={handleChange}
                      className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                    >
                      {goalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <FieldLabel optional>Ideal customers</FieldLabel>
                    <TextArea
                      name="idealCustomers"
                      placeholder="Describe the type of customer you want to attract"
                      value={form.idealCustomers}
                      onChange={handleChange}
                      rows={4}
                    />
                  </label>
                </div>

                <label className="block">
                  <FieldLabel optional>Topics to cover</FieldLabel>
                  <TextArea
                    name="topicsToCover"
                    placeholder="List topics you want included"
                    value={form.topicsToCover}
                    onChange={handleChange}
                    rows={4}
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel optional>Pages or offers to push</FieldLabel>
                    <TextArea
                      name="pagesToPush"
                      placeholder="List the service pages or offers you want readers to visit"
                      value={form.pagesToPush}
                      onChange={handleChange}
                      rows={4}
                    />
                  </label>

                  <label className="block">
                    <FieldLabel optional>Additional notes</FieldLabel>
                    <TextArea
                      name="additionalNotes"
                      placeholder="Anything else we should know"
                      value={form.additionalNotes}
                      onChange={handleChange}
                      rows={4}
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
                    <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                      After you submit this form, we&apos;ll send you to the confirmation page.
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
                        Continue to confirmation
                        <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                          <ArrowRight className="h-4 w-4" />
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
