"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { ctaClassName } from "@/components/cta-link";
import {
  blogBriefSubmittedStorageKey,
  orderCompleteStorageKey,
  parseSiteTarikOrderCompletion,
  thankYouStorageKey,
  thankYouStripeSessionKey,
} from "@/lib/order-flow";
import {
  buildBrowserTrackingMetadata,
  dispatchSiteTarikAnalyticsEvent,
  readTrackingSnapshotFromBrowser,
} from "@/lib/tracking/browser";

type PackagePlan = "core" | "blog";

type WebsiteSubmissionForm = {
  fullName: string;
  email: string;
  businessName: string;
  websiteUrl: string;
  whatsappNumber: string;
  businessType: string;
  businessTypeOther: string;
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

const emptyCompletionState = null;

const packagePlans: Array<{
  value: PackagePlan;
  title: string;
  price: string;
  summary: string;
  highlights: string[];
}> = [
  {
    value: "core",
    title: "Core Reborn",
    price: "RM100 / year",
    summary: "Best for existing websites that need a lean refresh with basic SEO, hosting, and WhatsApp delivery.",
    highlights: [
      "Website refresh prepared",
      "Basic SEO setup included",
      "Hosted version delivered on WhatsApp",
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
      "Basic SEO, hosting, and WhatsApp delivery",
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

const fieldCharacterLimits: Record<keyof WebsiteSubmissionForm, number> = {
  fullName: 80,
  email: 120,
  businessName: 70,
  websiteUrl: 200,
  whatsappNumber: 14,
  businessType: 80,
  businessTypeOther: 80,
  briefBusinessDescription: 320,
  mainProductsServices: 280,
  industry: 100,
  differentiator: 260,
  priorityServices: 260,
  idealCustomers: 240,
  customerProblems: 300,
  targetLocation: 80,
  contentLanguage: 80,
  targetKeywords: 200,
  topicsToCover: 320,
  topicsToAvoid: 240,
  competitorWebsites: 300,
  preferredContentTypes: 500,
  toneOfWriting: 120,
  topicDirection: 120,
  keyPointsToRepeat: 320,
  mainGoal: 80,
  preferredCTA: 80,
  pagesToPush: 240,
  restrictions: 300,
  additionalNotes: 320,
};

const initialWebsiteSubmissionForm: WebsiteSubmissionForm = {
  fullName: "",
  email: "",
  businessName: "",
  websiteUrl: "",
  whatsappNumber: "+60",
  businessType: "Service",
  businessTypeOther: "",
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
  helperText,
}: {
  name: keyof WebsiteSubmissionForm;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  helperText?: string;
}) {
  const characterLimit = fieldCharacterLimits[name];

  return (
    <>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={characterLimit}
        className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]"
      />
      <div className="mt-1.5 flex min-h-5 items-center justify-between gap-3 text-[0.72rem] font-medium leading-5 text-[var(--muted)]/72">
        <span>{helperText}</span>
        <span className="ml-auto text-right">
          {value.length}/{characterLimit}
        </span>
      </div>
    </>
  );
}

function normalizeWhatsAppNumberInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  const localDigits = digits.startsWith("60") ? digits.slice(2) : digits;

  return `+60${localDigits.slice(0, 11)}`;
}

function TextArea({
  name,
  placeholder,
  value,
  onChange,
  rows = 2,
  required = false,
}: {
  name: keyof WebsiteSubmissionForm;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(true);
  const [checkoutConfigMessage, setCheckoutConfigMessage] = useState<string | null>(null);
  const [locationDetectionState, setLocationDetectionState] = useState<
    "idle" | "detecting" | "detected" | "manual"
  >("idle");
  const [completionState, setCompletionState] = useState<string | null>(emptyCompletionState);
  const didAttemptLocationDetect = useRef(false);

  const isBlogPackage = selectedPackage === "blog";
  const isOtherBusinessType = websiteForm.businessType === "Others";
  const resolvedBusinessType = isOtherBusinessType
    ? websiteForm.businessTypeOther.trim()
    : websiteForm.businessType;
  const introCopy =
    selectedPackage === "blog"
      ? "SEO Enhancement selected. Pay first, then complete the brief."
      : "Core Reborn selected. Share the essentials and we’ll handle the rest.";

  useEffect(() => {
    try {
      const storedCompletion = parseSiteTarikOrderCompletion(
        window.localStorage.getItem(orderCompleteStorageKey),
      );
      const activeSessionId = window.sessionStorage.getItem(thankYouStripeSessionKey);
      const isActiveCompletion =
        Boolean(activeSessionId) && storedCompletion?.sessionId === activeSessionId;

      setCompletionState(isActiveCompletion ? storedCompletion.sessionId : null);
    } catch {
      setCompletionState(null);
    }

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

  useEffect(() => {
    let isActive = true;

    async function loadCheckoutConfig() {
      try {
        const response = await fetch("/api/checkout-config", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ready?: boolean;
          message?: string;
        };

        if (!isActive) {
          return;
        }

        setCheckoutReady(payload.ready !== false);
        setCheckoutConfigMessage(payload.ready === false ? payload.message ?? "Checkout is not configured yet." : null);
      } catch {
        if (!isActive) {
          return;
        }

        setCheckoutReady(true);
        setCheckoutConfigMessage(null);
      }
    }

    void loadCheckoutConfig();

    return () => {
      isActive = false;
    };
  }, []);

  const handleWebsiteInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    if (name === "whatsappNumber") {
      setWebsiteForm((current) => ({
        ...current,
        whatsappNumber: normalizeWhatsAppNumberInput(value),
      }));
      return;
    }

    setWebsiteForm((current) => ({ ...current, [name]: value }));
  };

  const handleWebsiteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (completionState) {
      setSubmitError("Your last order is complete. Start a new order to continue.");
      return;
    }
    if (isOtherBusinessType && !websiteForm.businessTypeOther.trim()) {
      setSubmitError("Please enter your business type.");
      return;
    }
    if (!checkoutReady) {
      setSubmitError(checkoutConfigMessage ?? "Checkout is not configured yet.");
      return;
    }
    if (!whatsappConsent) {
      setSubmitError("Please tick the WhatsApp consent box before continuing.");
      return;
    }
    if (!/^\+60\d{9,11}$/.test(websiteForm.whatsappNumber)) {
      setSubmitError("Please enter a valid WhatsApp number in +60 format.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    const trackingSnapshot = readTrackingSnapshotFromBrowser();
    const packageDetails = packagePlans.find((plan) => plan.value === selectedPackage);

    if (trackingSnapshot) {
      dispatchSiteTarikAnalyticsEvent("site_tarik_checkout_started", {
        ...buildBrowserTrackingMetadata(trackingSnapshot),
        selected_package: selectedPackage,
        package_title: packageDetails?.title ?? selectedPackage,
        business_type: resolvedBusinessType,
      });
    }

    const submissionDetails = {
      ...websiteForm,
      businessType: resolvedBusinessType,
    };
    const receiptData = {
      fullName: websiteForm.fullName,
      email: websiteForm.email,
      businessName: websiteForm.businessName,
      websiteUrl: websiteForm.websiteUrl,
      whatsappNumber: websiteForm.whatsappNumber,
      whatsappConsent,
      selectedPackage: packageDetails?.title ?? selectedPackage,
      selectedPackageValue: selectedPackage,
      submissionDetails,
      paidAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.removeItem(orderCompleteStorageKey);
      window.localStorage.removeItem(blogBriefSubmittedStorageKey);
      window.sessionStorage.removeItem(thankYouStripeSessionKey);
    } catch {
      // Ignore storage cleanup failures and continue with checkout.
    }

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
          email: websiteForm.email,
          businessName: websiteForm.businessName,
          websiteUrl: websiteForm.websiteUrl,
          whatsappNumber: websiteForm.whatsappNumber,
          whatsappConsent,
          businessType: resolvedBusinessType,
          targetLocation: websiteForm.targetLocation,
          submissionDetails,
          tracking: trackingSnapshot ?? undefined,
        }),
      });

      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        id?: string;
        receiptCode?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We could not start the checkout flow.");
      }

      if (!payload.url) {
        throw new Error("Checkout was created without a redirect URL.");
      }

      const nextReceiptData = {
        ...receiptData,
        receiptCode: payload.receiptCode ?? "",
      };

      window.sessionStorage.setItem(thankYouStorageKey, JSON.stringify(nextReceiptData));

      if (payload.id) {
        window.sessionStorage.setItem(thankYouStripeSessionKey, payload.id);
      }

      if (trackingSnapshot) {
        dispatchSiteTarikAnalyticsEvent("site_tarik_checkout_redirected", {
          ...buildBrowserTrackingMetadata(trackingSnapshot),
          selected_package: selectedPackage,
          package_title: packageDetails?.title ?? selectedPackage,
          checkout_session_id: payload.id ?? "",
          receipt_code: payload.receiptCode ?? "",
        });
      }

      window.location.assign(payload.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed.";

      if (message.includes("Missing STRIPE_SECRET_KEY")) {
        setSubmitError("Checkout is not configured yet. Add STRIPE_SECRET_KEY to .env.local or your deployment environment to enable payment.");
      } else if (message.includes("STRIPE_SECRET_KEY must start with")) {
        setSubmitError("Checkout is not configured yet. STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
      } else if (message.includes("Missing NEXT_PUBLIC_SITE_URL")) {
        setSubmitError("Checkout is not configured yet. Add NEXT_PUBLIC_SITE_URL to your environment and restart the app.");
      } else {
        setSubmitError(message);
      }
      setIsSubmitting(false);
    }
  };

  const handleStartNewOrder = () => {
    try {
      window.localStorage.removeItem(orderCompleteStorageKey);
      window.localStorage.removeItem(blogBriefSubmittedStorageKey);
      window.sessionStorage.removeItem(thankYouStorageKey);
      window.sessionStorage.removeItem(thankYouStripeSessionKey);
    } catch {
      // Ignore storage cleanup failures and let the user continue manually.
    }

    setCompletionState(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setLocationDetectionState("idle");
    didAttemptLocationDetect.current = false;
    setWebsiteForm(initialWebsiteSubmissionForm);
    setWhatsappConsent(false);
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
            Share your website details and package. We&apos;ll deliver a hosted version with
            <span className="text-[#ee2028]"> basic SEO</span> and the
            <span className="text-[#ee2028]"> final link on WhatsApp</span>.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-5">
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
                    placeholder="Full name"
                    value={websiteForm.fullName}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Email</FieldLabel>
                  <TextInput
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={websiteForm.email}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <FieldLabel required>Business Name</FieldLabel>
                <TextInput
                  name="businessName"
                  placeholder="Business name"
                  value={websiteForm.businessName}
                  onChange={handleWebsiteInputChange}
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <FieldLabel required>Website URL</FieldLabel>
                  <TextInput
                    name="websiteUrl"
                    type="url"
                    placeholder="Website URL"
                    value={websiteForm.websiteUrl}
                    onChange={handleWebsiteInputChange}
                    required
                  />
                </label>

                <label className="block">
                  <FieldLabel required>WhatsApp Number</FieldLabel>
                  <TextInput
                    name="whatsappNumber"
                    type="tel"
                    placeholder="+60 12 345 6789"
                    value={websiteForm.whatsappNumber}
                    onChange={handleWebsiteInputChange}
                    required
                    helperText="Fixed +60 format. Enter 9 to 11 digits after the prefix."
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

                {isOtherBusinessType ? (
                  <label className="block">
                    <FieldLabel required>Other Business Type</FieldLabel>
                    <TextInput
                      name="businessTypeOther"
                      placeholder="Enter your business type"
                      value={websiteForm.businessTypeOther}
                      onChange={handleWebsiteInputChange}
                      required
                    />
                  </label>
                ) : null}

                <label className="block">
                  <FieldLabel required>Target Location or Market</FieldLabel>
                  <TextInput
                    name="targetLocation"
                    placeholder="City or market"
                    value={websiteForm.targetLocation}
                    onChange={handleWebsiteInputChange}
                    required
                    helperText={locationDetectionState === "detecting" ? "Detecting location..." : undefined}
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(event) => setWhatsappConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border)] text-[var(--gold)] focus:ring-[var(--gold)]"
                  required
                />
                <span className="text-sm leading-6 text-[var(--foreground)]">
                  I agree to receive the final delivery and order updates through WhatsApp.
                </span>
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Select Package
              </legend>
              {!whatsappConsent ? (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Tick the WhatsApp consent above to unlock package selection and payment.
                </p>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {packagePlans.map((plan) => {
                  const isSelected = selectedPackage === plan.value;

                  return (
                    <button
                      key={plan.value}
                      type="button"
                      disabled={!whatsappConsent}
                      onClick={() => onPackageChange(plan.value)}
                      aria-pressed={isSelected}
                      className={`rounded-[1rem] border p-4 text-left transition duration-200 ${
                        !whatsappConsent
                          ? "cursor-not-allowed border-[var(--border)] bg-[rgba(247,247,247,0.9)] opacity-55 shadow-none"
                          : isSelected
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
                          placeholder="What do you offer?"
                          value={websiteForm.briefBusinessDescription}
                          onChange={handleWebsiteInputChange}
                          rows={2}
                          required
                        />
                      </label>

                      <label className="block">
                        <FieldLabel required>Main products or services</FieldLabel>
                        <TextArea
                          name="mainProductsServices"
                          placeholder="Main services or products"
                          value={websiteForm.mainProductsServices}
                          onChange={handleWebsiteInputChange}
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
                            value={websiteForm.targetKeywords}
                            onChange={handleWebsiteInputChange}
                            rows={2}
                            required
                          />
                        </label>

                        <label className="block">
                          <FieldLabel required>Target location or market</FieldLabel>
                          <TextInput
                            name="targetLocation"
                            placeholder="City or market"
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
                            placeholder="Ideal customer"
                            value={websiteForm.idealCustomers}
                            onChange={handleWebsiteInputChange}
                            rows={2}
                          />
                        </label>
                      </div>

                      <label className="block">
                      <FieldLabel optional>Topics to cover</FieldLabel>
                      <TextArea
                        name="topicsToCover"
                        placeholder="Topics to cover"
                        value={websiteForm.topicsToCover}
                        onChange={handleWebsiteInputChange}
                        rows={2}
                        />
                      </label>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                          <FieldLabel optional>Pages or offers to push</FieldLabel>
                          <TextArea
                            name="pagesToPush"
                            placeholder="Pages or offers"
                            value={websiteForm.pagesToPush}
                            onChange={handleWebsiteInputChange}
                            rows={2}
                          />
                        </label>

                        <label className="block">
                          <FieldLabel optional>Additional notes</FieldLabel>
                          <TextArea
                            name="additionalNotes"
                            placeholder="Any extra notes"
                            value={websiteForm.additionalNotes}
                            onChange={handleWebsiteInputChange}
                            rows={2}
                          />
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.9)] px-5 py-4 sm:px-6 sm:py-5">
              {completionState ? (
                <div className="rounded-[1rem] border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                  Your purchase is already complete. Start a new order only if you want to submit a fresh request.
                </div>
              ) : null}
              {submitError ? (
                <p className="rounded-[1rem] border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                  {submitError}
                </p>
              ) : !checkoutReady && checkoutConfigMessage ? (
                <p className="rounded-[1rem] border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                  {checkoutConfigMessage}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-[34rem]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                    Trust Line
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                    Final website output link will be delivered on WhatsApp after
                    completion.
                  </p>
                </div>
                {completionState ? (
                  <button
                    type="button"
                    onClick={handleStartNewOrder}
                    className={ctaClassName("soft", "justify-center")}
                  >
                    Start New Order
                    <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !checkoutReady || !whatsappConsent}
                    className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 ${
                      isSubmitting || !checkoutReady || !whatsappConsent
                        ? "cursor-not-allowed bg-[#f3a4a8] shadow-none"
                        : "bg-[var(--gold)] hover:-translate-y-0.5 hover:bg-[#d81c23] hover:shadow-[0_18px_35px_rgba(0,0,0,0.16)]"
                    }`}
                    aria-live="polite"
                  >
                    {isSubmitting ? (
                      <>
                        Redirecting
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </>
                    ) : !checkoutReady ? (
                      <>Checkout unavailable</>
                    ) : (
                      <>
                        Continue to payment
                        <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
    </section>
  );
}

