"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

type PackagePlan = "core" | "blog";

type WebsiteSubmissionForm = {
  fullName: string;
  businessName: string;
  websiteUrl: string;
  emailAddress: string;
  businessType: string;
  briefBusinessDescription: string;
  mainProductsServices: string;
  industry: string;
  differentiator: string;
  priorityServices: string;
  idealCustomers: string;
  customerProblems: string;
  targetLocation: string;
  contentLanguage: string;
  targetKeywords: string;
  topicsToCover: string;
  topicsToAvoid: string;
  competitorWebsites: string;
  preferredContentTypes: string[];
  toneOfWriting: string;
  topicDirection: string;
  keyPointsToRepeat: string;
  mainGoal: string;
  preferredCTA: string;
  pagesToPush: string;
  restrictions: string;
  additionalNotes: string;
};

const thankYouStorageKey = "siteTarikThankYouSubmission";

const packagePlans: Array<{
  value: PackagePlan;
  title: string;
  price: string;
  summary: string;
  highlights: string[];
}> = [
  {
    value: "core",
    title: "Core Relaunch",
    price: "RM100 / year",
    summary: "Best for existing websites that need a lean refresh with basic SEO, hosting, and email delivery.",
    highlights: [
      "Website refresh prepared",
      "Basic SEO setup included",
      "Hosted version delivered by email",
    ],
  },
  {
    value: "blog",
    title: "SEO Enhancement",
    price: "RM220",
    summary: "Includes 12 weekly blog releases for stronger SEO and content direction.",
    highlights: [
      "12 blog pages generated",
      "Weekly release schedule",
      "Stronger structure and layout",
      "Basic SEO, hosting, and email delivery",
    ],
  },
];

const businessTypeOptions = ["Service", "Education", "E-commerce", "Home & Living", "Others"];

const mainGoalOptions = [
  "Get more leads",
  "Get more enquiries",
  "Increase product sales",
  "Improve brand visibility",
  "Educate potential customers",
  "Support SEO growth",
];

const initialWebsiteSubmissionForm: WebsiteSubmissionForm = {
  fullName: "",
  businessName: "",
  websiteUrl: "",
  emailAddress: "",
  businessType: "Service",
  briefBusinessDescription: "",
  mainProductsServices: "",
  industry: "",
  differentiator: "",
  priorityServices: "",
  idealCustomers: "",
  customerProblems: "",
  targetLocation: "",
  contentLanguage: "English",
  targetKeywords: "",
  topicsToCover: "",
  topicsToAvoid: "",
  competitorWebsites: "",
  preferredContentTypes: [],
  toneOfWriting: "Professional",
  topicDirection: "Balanced mix of both",
  keyPointsToRepeat: "",
  mainGoal: "Get more leads",
  preferredCTA: "Contact us",
  pagesToPush: "",
  restrictions: "",
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
      {optional ? <span className="ml-1 text-[0.72rem] font-medium text-[var(--muted)]">(Optional)</span> : null}
    </span>
  );
}

function TextInput({
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
}: {
  name: keyof WebsiteSubmissionForm;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]"
    />
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
  name: keyof WebsiteSubmissionForm;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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

function SelectControl({
  name,
  value,
  onChange,
  options,
  disabledOptions = [],
  required = false,
}: {
  name: keyof WebsiteSubmissionForm;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options: string[];
  disabledOptions?: string[];
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
    } as ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
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
              const isDisabled = disabledOptions.includes(option);
              const isSelected = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center justify-between rounded-[0.85rem] px-4 py-3 text-left text-[15px] transition ${
                    isSelected
                      ? "bg-[var(--gold-soft)] text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--foreground)]"
                  } ${isDisabled ? "cursor-not-allowed opacity-35" : ""}`}
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

export function WebsiteSubmissionSection({
  selectedPackage,
  onPackageChange,
}: {
  selectedPackage: PackagePlan;
  onPackageChange: (packagePlan: PackagePlan) => void;
}) {
  const [websiteForm, setWebsiteForm] = useState<WebsiteSubmissionForm>(initialWebsiteSubmissionForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationDetectionState, setLocationDetectionState] = useState<
    "idle" | "detecting" | "detected" | "manual"
  >("idle");
  const didAttemptLocationDetect = useRef(false);

  const isBlogPackage = selectedPackage === "blog";
  const introCopy =
    selectedPackage === "blog"
      ? "SEO Enhancement selected. Pay first, then complete the blog brief on the next page."
      : "Core Relaunch selected. Share your website details and we will prepare the hosted version with basic SEO for your existing website, then send the final website link to your email.";

  useEffect(() => {
    if (didAttemptLocationDetect.current || websiteForm.targetLocation) {
      return;
    }

    didAttemptLocationDetect.current = true;

    if (!navigator.geolocation) {
      setLocationDetectionState("manual");
      return;
    }

    setLocationDetectionState("detecting");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!response.ok) {
            return;
          }

          const data = (await response.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              county?: string;
              state?: string;
              country?: string;
            };
          };

          const locality =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.suburb ??
            data.address?.county ??
            data.address?.state ??
            "";
          const country = data.address?.country ?? "";
          const detectedLocation = [locality, country].filter(Boolean).join(", ");

          if (detectedLocation) {
            setWebsiteForm((current) =>
              current.targetLocation ? current : { ...current, targetLocation: detectedLocation },
            );
            setLocationDetectionState("detected");
          } else {
            setLocationDetectionState("manual");
          }
        } catch {
          // Leave the field empty if reverse lookup fails.
          setLocationDetectionState("manual");
        }
      },
      () => {
        // Location access is optional; the user can type manually.
        setLocationDetectionState("manual");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 24 * 60 * 60 * 1000,
        timeout: 5000,
      },
    );
  }, [websiteForm.targetLocation]);

  const handleWebsiteInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setWebsiteForm((current) => ({ ...current, [name]: value }));
  };

  const handleWebsiteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const packageDetails = packagePlans.find((plan) => plan.value === selectedPackage);
    const receiptData = {
      fullName: websiteForm.fullName,
      businessName: websiteForm.businessName,
      websiteUrl: websiteForm.websiteUrl,
      emailAddress: websiteForm.emailAddress,
      selectedPackage: packageDetails?.title ?? selectedPackage,
      selectedPackageValue: selectedPackage,
      submissionDetails: websiteForm,
      submittedAt: new Date().toISOString(),
    };

    window.sessionStorage.setItem(thankYouStorageKey, JSON.stringify(receiptData));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedPackage,
          fullName: websiteForm.fullName,
          businessName: websiteForm.businessName,
          websiteUrl: websiteForm.websiteUrl,
          emailAddress: websiteForm.emailAddress,
          targetLocation: websiteForm.targetLocation,
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "We could not start the checkout flow.");
      }

      if (!payload.url) {
        throw new Error("Checkout was created without a redirect URL.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Checkout failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfb_100%)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22"
    >
      <div className="mx-auto w-full max-w-[1260px]">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            <span
              className="h-2.5 w-3 bg-[var(--gold)]"
              style={{
                clipPath:
                  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              }}
            />
            <span>Form Section</span>
          </div>
          <h2 className="mx-auto max-w-none whitespace-nowrap font-[family-name:var(--font-heading)] text-[2.7rem] leading-[0.98] tracking-[-0.06em] sm:text-[3.2rem] lg:text-[4.2rem]">
            Submit Your Website
          </h2>
          <p className="mx-auto mt-6 max-w-[44rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
            Share your website details and choose your package. We will prepare
            the hosted version with <span className="text-[#ee2028]">basic SEO</span> and send the
            <span className="text-[#ee2028]"> final website link to your email</span>.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="mx-auto w-full max-w-[960px] rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="border-b border-[var(--border)] pb-6">
              <div className="min-w-0">
                <h3 className="mt-4 max-w-[14ch] font-[family-name:var(--font-heading)] text-[2.2rem] leading-[1.02] tracking-[-0.04em] sm:text-[2.6rem]">
                  Strategic brief for a clear next step
                </h3>
                <p className="mt-4 max-w-[36rem] text-base leading-7 text-[var(--muted)]">
                  {introCopy}
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-8" onSubmit={handleWebsiteSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Required
              </legend>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <FieldLabel required>Full Name</FieldLabel>
                  <TextInput
                    name="fullName"
                    placeholder="Enter your full name"
                    value={websiteForm.fullName}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Business Name</FieldLabel>
                  <TextInput
                    name="businessName"
                    placeholder="Enter your business name"
                    value={websiteForm.businessName}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <FieldLabel required>Website URL</FieldLabel>
                  <TextInput
                    name="websiteUrl"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={websiteForm.websiteUrl}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Email Address</FieldLabel>
                  <TextInput
                    name="emailAddress"
                    type="email"
                    placeholder="Enter your email address"
                    value={websiteForm.emailAddress}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
                <label className="block">
                  <FieldLabel required>Business Type</FieldLabel>
                  <SelectControl
                    name="businessType"
                    value={websiteForm.businessType}
                    onChange={handleWebsiteInputChange}
                    options={businessTypeOptions}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Target Location or Market</FieldLabel>
                  <TextInput
                    name="targetLocation"
                    placeholder="Kuala Lumpur, Johor, nationwide"
                    value={websiteForm.targetLocation}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                  <p className="mt-2 text-[0.72rem] leading-5 text-[var(--muted)]">
                    {locationDetectionState === "detecting"
                      ? "Detecting your location automatically..."
                      : locationDetectionState === "detected"
                        ? "Auto-detected from your browser when available."
                        : "Auto-detects when location access is allowed."}
                  </p>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Select Package
              </legend>

              <div className="grid gap-3 md:grid-cols-2">
                {packagePlans.map((plan) => {
                  const isSelected = selectedPackage === plan.value;

                  return (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => onPackageChange(plan.value)}
                      aria-pressed={isSelected}
                      className={`rounded-[1rem] border p-4 text-left transition duration-200 ${
                        isSelected
                          ? "border-[rgba(238,32,40,0.28)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,248,249,0.96))] shadow-[0_8px_18px_rgba(238,32,40,0.05)]"
                          : "border-[var(--border)] bg-[var(--surface-strong)] hover:border-[rgba(238,32,40,0.14)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.035)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/68">
                            {plan.title}
                          </p>
                          <p className="mt-2 text-[1.05rem] font-semibold leading-6 text-[var(--foreground)]">
                            {plan.price}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                            isSelected
                              ? "border-[rgba(238,32,40,0.34)] bg-[rgba(238,32,40,0.06)]"
                              : "border-[var(--border)] bg-white"
                          }`}
                          aria-hidden="true"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full transition ${
                              isSelected ? "bg-[rgba(238,32,40,0.82)]" : "bg-transparent"
                            }`}
                          />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isBlogPackage ? (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Blog brief comes after payment on the next page.
                </p>
              ) : null}
            </fieldset>

            {false ? (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5 sm:p-6">
                <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                    Blog Content Brief
                  </p>
                  <p className="max-w-[48rem] text-sm leading-7 text-[var(--muted)] sm:text-base">
                    Complete this section so we can plan 12 blog pages aligned to
                    your industry, SEO direction, and business goals.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/64">
                      Required
                    </legend>
                    <div className="grid gap-5">
                      <label className="block">
                        <FieldLabel required>Briefly describe your business</FieldLabel>
                        <TextArea
                          name="briefBusinessDescription"
                          placeholder="What does your business do and offer?"
                          value={websiteForm.briefBusinessDescription}
                          onChange={handleWebsiteInputChange}
                          rows={4}
                          required
                        />
                      </label>

                      <label className="block">
                        <FieldLabel required>Main products or services</FieldLabel>
                        <TextArea
                          name="mainProductsServices"
                          placeholder="List your main services or products"
                          value={websiteForm.mainProductsServices}
                          onChange={handleWebsiteInputChange}
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
                            value={websiteForm.targetKeywords}
                            onChange={handleWebsiteInputChange}
                            rows={4}
                            required
                          />
                        </label>

                        <label className="block">
                          <FieldLabel required>Target location or market</FieldLabel>
                          <TextInput
                            name="targetLocation"
                            placeholder="Kuala Lumpur, Johor, nationwide"
                            value={websiteForm.targetLocation}
                            onChange={handleWebsiteInputChange}
                            required
                          />
                        </label>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                          <FieldLabel required>Main goal of the blog pages</FieldLabel>
                          <SelectControl
                            name="mainGoal"
                            value={websiteForm.mainGoal}
                            onChange={handleWebsiteInputChange}
                            options={mainGoalOptions}
                            required
                          />
                        </label>

                        <label className="block">
                          <FieldLabel optional>Ideal customers</FieldLabel>
                          <TextArea
                            name="idealCustomers"
                            placeholder="Describe the type of customer you want to attract"
                            value={websiteForm.idealCustomers}
                            onChange={handleWebsiteInputChange}
                            rows={4}
                          />
                        </label>
                      </div>

                      <label className="block">
                        <FieldLabel optional>Topics to cover</FieldLabel>
                        <TextArea
                          name="topicsToCover"
                          placeholder="List topics you want included"
                          value={websiteForm.topicsToCover}
                          onChange={handleWebsiteInputChange}
                          rows={4}
                        />
                      </label>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                          <FieldLabel optional>Pages or offers to push</FieldLabel>
                          <TextArea
                            name="pagesToPush"
                            placeholder="List the service pages or offers you want readers to visit"
                            value={websiteForm.pagesToPush}
                            onChange={handleWebsiteInputChange}
                            rows={4}
                          />
                        </label>

                        <label className="block">
                          <FieldLabel optional>Additional notes</FieldLabel>
                          <TextArea
                            name="additionalNotes"
                            placeholder="Anything else we should know"
                            value={websiteForm.additionalNotes}
                            onChange={handleWebsiteInputChange}
                            rows={4}
                          />
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.9)] px-5 py-4">
              {submitError ? (
                <p className="mb-3 rounded-[1rem] border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                  {submitError}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                    Trust Line
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                    Final website output link will be delivered by email after
                    completion.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23] hover:shadow-[0_18px_35px_rgba(0,0,0,0.16)]"
                  aria-live="polite"
                >
                  {isSubmitting ? (
                    <>
                      Redirecting
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
    </section>
  );
}

