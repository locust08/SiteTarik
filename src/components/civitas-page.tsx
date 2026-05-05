"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import serviceShowcaseImage from "../../Image/Service Image.png";
import educationShowcaseImage from "../../Image/Education Image.png";
import homeLivingShowcaseImage from "../../Image/Home Living Image.png";
import localSmeShowcaseImage from "../../Image/SME Image.png";
import heroImage from "../../Image/Hero Image.png";
import pricingImage from "../../Image/Pricing Image.png";
import {
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Handshake,
  Landmark,
  Menu,
  MonitorSmartphone,
  Play,
  Scale,
  Search,
  TrendingUp,
  Workflow,
  Settings2,
  X,
  Zap,
} from "lucide-react";
import { CivitasFooter } from "@/components/civitas-footer";
import { CtaLink } from "@/components/cta-link";
import { WebsiteSubmissionSection } from "@/components/website-submission-section";
import { getSiteTarikPackageTitle } from "@/lib/order-flow";
import {
  buildBrowserTrackingMetadata,
  dispatchSiteTarikAnalyticsEvent,
  readTrackingSnapshotFromBrowser,
} from "@/lib/tracking/browser";

type NavItem = {
  label: string;
  href: string;
};

type ValueCard = {
  index: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Service = {
  index: string;
  title: string;
  description: string;
  emphasis: string;
};

type WhyChooseReason = {
  index: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Pricing", href: "#pricing" },
  { label: "What You Get", href: "#services" },
  { label: "How It Works", href: "#how-it-work" },
  { label: "FAQ", href: "#faq" },
];

const valueCards: ValueCard[] = [
  {
    index: "01",
    title: "Integrity & Ethics",
    description:
      "We uphold the highest standards of honesty, confidentiality, and professionalism in every matter.",
    icon: Scale,
  },
  {
    index: "02",
    title: "Client-Centered",
    description:
      "Our approach is tailored to each clientâ€™s unique legal needs, ensuring strategic and representation.",
    icon: Handshake,
  },
  {
    index: "03",
    title: "Legal Solution",
    description:
      "We combine legal expertise with modern strategies to provide solutions that meet todayâ€™s challenges.",
    icon: Landmark,
  },
];

const services: Service[] = [
  {
    index: "01",
    title: "Website Reborn",
    description:
      "We replicate your current WordPress, Drupal, or similar CMS site, clean it up, and set it up with SEO foundations for a low-cost annual plan.",
    emphasis: "SEO foundations",
  },
  {
    index: "02",
    title: "Basic SEO Setup",
    description:
      "Meta title, description, and structure are set up to support relevant ranking without changing the site direction.",
    emphasis: "support relevant ranking",
  },
  {
    index: "03",
    title: "Hosted Output & Delivery",
    description:
      "The finished site is hosted, checked, and delivered via WhatsApp for a simple handoff.",
    emphasis: "delivered via WhatsApp",
  },
  {
    index: "04",
    title: "Blog Add-On",
    description:
      "Launch 12 strategically structured blog pages in one go, backed by basic SEO, hosting, and WhatsApp delivery.",
    emphasis: "12 blog pages",
  },
  {
    index: "05",
    title: "Blog Structure Support",
    description:
      "The blog content structure is tightened so all 12 pages stay clear, consistent, and search-friendly.",
    emphasis: "clear structure",
  },
];

const whyChooseReasons: WhyChooseReason[] = [
  { index: "01", title: "Low annual cost", icon: TrendingUp },
  { index: "02", title: "Fast turnaround", icon: CalendarDays },
  { index: "03", title: "Basic SEO setup", icon: Search },
  { index: "04", title: "Works with existing CMS sites", icon: MonitorSmartphone },
  { index: "05", title: "Simple submission", icon: Workflow },
  { index: "06", title: "No technical setup", icon: Settings2 },
];

const processSteps = [
  {
    index: "01",
    title: (
      <>
        <span className="text-[#ee2028]">Submit</span> your website details
      </>
    ),
  },
  {
    index: "02",
    title: "Choose your package",
  },
  {
    index: "03",
    title: (
      <>
        Complete <span className="text-[#ee2028]">payment</span>
      </>
    ),
  },
  {
    index: "04",
    title: "Blog brief after payment",
  },
  {
    index: "05",
    title: (
      <>
        <span className="text-[#ee2028]">Final output link</span> is sent to
        your WhatsApp
      </>
    ),
  },
];

type ShowcasePanel = {
  title: string;
  summary: string;
  theme: "service" | "education" | "home" | "local";
  image: StaticImageData;
};

const showcasePanels: ShowcasePanel[] = [
  {
    title: "Service business",
    summary: "Sharper trust. Clearer action.",
    theme: "service",
    image: serviceShowcaseImage,
  },
  {
    title: "Education",
    summary: "Clear programmes. Faster decisions.",
    theme: "education",
    image: educationShowcaseImage,
  },
  {
    title: "Home & Living",
    summary: "Premium feel. Better presentation.",
    theme: "home",
    image: homeLivingShowcaseImage,
  },
  {
    title: "Local SME",
    summary: "Local clarity. Easier next step.",
    theme: "local",
    image: localSmeShowcaseImage,
  },
];

const faqItems: FaqItem[] = [
  {
    question: "What do I need to prepare?",
    answer: <>Your website link and basic business details.</>,
  },
  {
    question: "Is this suitable for my website?",
    answer: <>Suitable for most existing business websites, especially WordPress, Drupal, and similar platforms.</>,
  },
  {
    question: "What is included in RM100/year?",
    answer: <>RM100/year includes Basic SEO, hosting, and final website link sent through WhatsApp.</>,
  },
  {
    question: "What is included in SEO Enhancement?",
    answer: <>SEO Enhancement is RM220 total and includes 12 SEO-friendly blog pages, with the brief completed after payment.</>,
  },
  {
    question: "Will SEO be included?",
    answer: <>Basic SEO setup such as meta title and description is included.</>,
  },
  {
    question: "How will I receive the final output?",
    answer: <>You will receive a link via WhatsApp after completion.</>,
  },
  {
    question: "Do I need technical skills?",
    answer: <>No. The process is designed to be simple and straightforward.</>,
  },
];

const heroTrustItems = [
  "Small business ready",
  "Clear process",
  "From RM100/year",
];

const pricingCoreIncludes = [
  "Website reborn",
  "Basic SEO setup",
  "Hosted output",
  "WhatsApp delivery",
];

const pricingBlogIncludes = [
  "12 blog pages",
  "Stronger structure and layout",
  "Clear blog content structure",
  "Basic SEO setup",
  "Hosted output",
  "WhatsApp delivery",
];

function SectionLabel({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={`mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)] ${
        centered ? "justify-center" : ""
      }`}
    >
      <span
        className="h-2.5 w-3 bg-[var(--gold)]"
        style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
      />
      {children}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      data-reveal
      className={className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ShowcaseMockup({
  image,
}: {
  image: StaticImageData;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setOffset({
      x: x * 10,
      y: y * 10,
    });
  };

  const resetOffset = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative h-[clamp(420px,36vw,440px)] overflow-hidden rounded-[1.7rem] border border-[rgba(0,0,0,0.08)] bg-white p-3 shadow-[0_18px_42px_rgba(0,0,0,0.06)] sm:h-[clamp(440px,34vw,460px)]">
      <div
        className="group relative h-full overflow-hidden rounded-[1.45rem] bg-[var(--surface-strong)]"
        onMouseMove={handlePointerMove}
        onMouseEnter={handlePointerMove}
        onMouseLeave={resetOffset}
      >
        <Image
          src={image}
          alt="Website showcase image"
          fill
          className="object-cover object-top transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.03)`,
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 560px"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.06)_100%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
    </div>
  );
}

export function CivitasPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [openService, setOpenService] = useState<number | null>(null);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [selectedPackage, setSelectedPackage] = useState<"core" | "blog">("core");
  const [processProgress, setProcessProgress] = useState(0);
  const isBlogPackage = selectedPackage === "blog";
  const selectedPackageLabel = getSiteTarikPackageTitle(selectedPackage);
  const selectedPackageTitle = getSiteTarikPackageTitle(selectedPackage);
  const selectedPackageDescription = isBlogPackage
    ? "SEO Enhancement includes the Core Reborn handoff plus 12 SEO-friendly blog pages."
    : "Core Reborn gives you a clean website refresh with basic SEO, hosting, and WhatsApp delivery.";
  const selectedPackageIncludes = isBlogPackage
    ? pricingBlogIncludes
    : pricingCoreIncludes;
  const pricingSummary = isBlogPackage
    ? "RM220"
    : "RM100 / year";
  const problemPoints = [
    {
      index: "01",
      title: "Your website feels outdated",
      description: "An older layout can weaken trust at first glance.",
      icon: MonitorSmartphone,
    },
    {
      index: "02",
      title: "Updates take too long",
      description: "Small changes should not turn into costly delays.",
      icon: Zap,
    },
    {
      index: "03",
      title: "Content falls behind",
      description: "Busy teams often struggle to keep the site current.",
      icon: CalendarDays,
    },
  ];
  void valueCards;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" },
    );

    const nodes = document.querySelectorAll("[data-reveal]");
    nodes.forEach((node) => observer.observe(node));

    // Ensure content is fully visible for users who scroll quickly and for
    // automated full-page validation after the initial motion window.
    const fallbackReveal = window.setTimeout(() => {
      nodes.forEach((node) => node.classList.add("is-visible"));
    }, 1400);

    return () => {
      window.clearTimeout(fallbackReveal);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderSolid(window.scrollY > 56);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ["top", "pricing", "services", "how-it-work", "contact"];

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 140;

      let currentSection = "top";

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        if (element.offsetTop <= scrollPosition) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const updateProcessProgress = () => {
      const section = document.getElementById("how-it-work");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const start = viewportHeight * 0.72;
      const end = -rect.height * 0.22;
      const sensitivity = isDesktop ? 1.6 : 1.25;
      const progress = ((start - rect.top) / (start - end)) * sensitivity;

      setProcessProgress(Math.min(1, Math.max(0, progress)));
    };

    let frame = 0;

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProcessProgress);
    };

    updateProcessProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handlePackageChange = (packagePlan: "core" | "blog") => {
    setSelectedPackage(packagePlan);

    const trackingSnapshot = readTrackingSnapshotFromBrowser();

    if (!trackingSnapshot) {
      return;
    }

    dispatchSiteTarikAnalyticsEvent("site_tarik_package_selected", {
      ...buildBrowserTrackingMetadata(trackingSnapshot),
      selected_package: packagePlan,
      package_title: getSiteTarikPackageTitle(packagePlan),
    });
  };

  return (
    <div className="overflow-x-hidden bg-[var(--surface)] text-[var(--foreground)]">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color,box-shadow] duration-300 ${
          headerSolid
            ? "border-b border-black/8 bg-[rgba(255,255,255,0.9)] text-[var(--foreground)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            : "border-b border-white/8 bg-transparent text-white"
        }`}
      >
        <div className="mx-auto w-full max-w-[1230px] px-5 py-7 sm:px-7 lg:px-6">
          <div className="flex items-center justify-between gap-5">
            <Link
              href="#top"
              className="font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-none tracking-[-0.04em]"
            >
              SiteTarik
            </Link>

            <nav
              className={`hidden flex-1 items-center justify-end gap-8 text-sm font-semibold lg:flex ${
                headerSolid ? "text-[var(--foreground)]/88" : "text-white/88"
              }`}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative pb-1 transition ${
                    activeSection === item.href.slice(1)
                      ? headerSolid
                        ? "text-[var(--gold)]"
                        : "text-white"
                      : headerSolid
                        ? "hover:text-[var(--gold)]"
                        : "hover:text-white"
                  }`}
                  onClick={() => setActiveSection(item.href.slice(1))}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full transition ${
                      activeSection === item.href.slice(1)
                        ? headerSolid
                          ? "bg-[var(--gold)] opacity-100"
                          : "bg-white opacity-100"
                        : "opacity-0"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex">
              <Link
                href="#contact"
                className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 ${
                  headerSolid
                    ? "bg-[var(--gold)] text-white hover:bg-[#d81c23]"
                    : "bg-white text-[var(--teal-deep)] hover:bg-white/92"
                }`}
              >
                Start Upgrade
                <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            <button
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${
                headerSolid
                  ? "border border-black/10 text-[var(--foreground)]"
                  : "border border-white/14 text-white"
              }`}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-[rgba(11,32,32,0.78)] backdrop-blur-sm transition ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        } lg:hidden`}
      >
        <div className="hero-panel grain absolute inset-x-4 top-24 rounded-[2rem] border border-white/8 px-6 py-8 text-white shadow-[var(--shadow)]">
          <div className="mb-8 space-y-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block text-2xl font-semibold ${
                  activeSection === item.href.slice(1)
                    ? "text-[var(--gold-soft)]"
                    : ""
                }`}
                onClick={() => {
                  setActiveSection(item.href.slice(1));
                  setMenuOpen(false);
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <CtaLink href="#contact" variant="soft">
            Start Upgrade
          </CtaLink>
        </div>
      </div>

      <main id="top">
        <section className="hero-panel grain relative isolate overflow-hidden px-6 pb-20 pt-32 text-white sm:px-8 lg:px-10 lg:pb-24 lg:pt-36">
          <div className="mx-auto grid w-full max-w-[1150px] items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <Reveal className="max-w-[640px]">
              <h1 className="max-w-[12.5ch] font-[family-name:var(--font-heading)] text-[3.05rem] leading-[1.08] tracking-[-0.042em] sm:text-[4rem] sm:leading-[1.04] lg:text-[4.8rem] lg:leading-[1.01]">
                Upgrade Your WordPress. Skip the Full Rebuild.
              </h1>

              <p className="mt-7 max-w-[33rem] text-lg font-medium leading-8 text-white/74 sm:text-xl">
                Upgrade your existing site with basic SEO and no full rebuild.
                Built for WordPress, Joomla, Drupal, and similar CMS platforms.
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <CtaLink
                  href="#contact"
                  variant="light"
                  className="self-start px-4 py-2.5 sm:px-5 sm:py-3"
                >
                  Start Upgrade
                </CtaLink>
                <Link
                  href="#how-it-work"
                  className="inline-flex items-center gap-3 text-sm font-semibold text-white/88 hover:text-[var(--gold-soft)]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6">
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  </span>
                  See How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/84">
                {heroTrustItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-white/10 bg-white/6 px-4 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                      <span className="font-medium leading-6">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150} className="relative">
              <div className="relative mx-auto w-full max-w-[620px]">
                <div className="relative overflow-hidden rounded-[2.1rem] shadow-[0_22px_56px_rgba(8,8,10,0.16)]">
                  <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                    Before
                  </div>
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-[var(--gold-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)] shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                    After
                  </div>
                  <Image
                    src={heroImage}
                    alt="Website upgrade preview"
                    width={1200}
                    height={1200}
                    className="h-auto w-full object-cover"
                    priority
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="about-us"
          className="bg-[var(--surface)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22"
        >
          <div className="mx-auto w-full max-w-[1260px]">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-16">
              <div className="mx-auto max-w-[44rem] text-center lg:mx-0 lg:text-left">
                <Reveal>
                  <SectionLabel>Problem</SectionLabel>
                </Reveal>
                <Reveal delay={100}>
                  <h2 className="mx-auto max-w-[14ch] font-[family-name:var(--font-heading)] text-[2.65rem] leading-[1.03] tracking-[-0.04em] sm:text-[3.2rem] lg:mx-0 lg:text-[3.8rem]">
                    Existing websites need a smarter{" "}
                    <span className="text-[var(--gold)]">upgrade</span>, not a
                    rebuild.
                  </h2>
                  <p className="mx-auto mt-5 max-w-[34rem] text-lg leading-8 text-[var(--muted)] lg:mx-0">
                    A smarter upgrade can strengthen clarity and conversion
                    without a full rebuild.
                  </p>
                  <div className="mt-7 flex justify-center lg:justify-start">
                    <CtaLink href="#how-it-work" variant="soft">
                      See How It Works
                    </CtaLink>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={140} className="relative">
                <div className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[2.1rem] border border-[var(--border)] bg-white shadow-[var(--shadow)]">
                  <Image
                    src="/civitas/stress-section.png"
                    alt="Website upgrade visual showcase"
                    width={1240}
                    height={980}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {problemPoints.map((point, index) => {
                const Icon = point.icon;

                return (
                  <Reveal key={point.index} delay={120 + index * 100}>
                    <article className="group relative min-h-[250px] rounded-[2rem] border border-[var(--border)] bg-white px-7 pb-7 pt-7 shadow-[var(--shadow)]">
                      <div className="mb-10 flex items-start justify-between gap-4">
                        <Icon className="h-9 w-9 text-[#ee2028]" />
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-bl-[1.5rem] rounded-tr-[2rem] bg-[var(--surface)] text-[1rem] font-medium tracking-[-0.04em] text-[var(--foreground)]">
                          {point.index}
                        </span>
                      </div>
                      <h3 className="max-w-[13ch] font-[family-name:var(--font-heading)] text-[1.7rem] leading-[1.08] tracking-[-0.04em]">
                        {point.title}
                      </h3>
                      <p className="mt-4 max-w-[22ch] text-[0.98rem] leading-7 text-[var(--muted)]">
                        {point.description}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="services"
          className="relative bg-[var(--surface)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22"
        >
          <div className="mx-auto w-full max-w-[1260px]">
            <Reveal className="mx-auto max-w-[760px] text-center">
              <SectionLabel centered>Service Overview</SectionLabel>
              <h2 className="mx-auto max-w-[13ch] font-[family-name:var(--font-heading)] text-[2.85rem] leading-[1.03] tracking-[-0.05em] sm:text-[3.35rem] lg:text-[4rem]">
                What You Get
              </h2>
            </Reveal>

            <div className="mt-14 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {services.map((service, index) => {
                const isOpen = openService === index;
                const panelId = `service-panel-${index}`;
                const buttonId = `service-button-${index}`;

                return (
                  <Reveal
                    key={service.title}
                    delay={80 + index * 70}
                  >
                    <article
                      className={`group transition-colors duration-200 ${
                        isOpen
                          ? "bg-[linear-gradient(90deg,rgba(255,246,247,0)_0%,rgba(255,246,247,0.92)_8%,rgba(255,246,247,0.92)_92%,rgba(255,246,247,0)_100%)]"
                          : "bg-white hover:bg-[linear-gradient(90deg,rgba(255,246,247,0)_0%,rgba(255,246,247,0.92)_8%,rgba(255,246,247,0.92)_92%,rgba(255,246,247,0)_100%)]"
                      } md:grid md:grid-cols-[80px_0.95fr_1.05fr] md:items-start md:gap-5 md:py-8 md:hover:bg-[linear-gradient(90deg,rgba(255,246,247,0)_0%,rgba(255,246,247,0.92)_8%,rgba(255,246,247,0.92)_92%,rgba(255,246,247,0)_100%)]`}
                    >
                      <div className="md:hidden">
                        <button
                          type="button"
                          id={buttonId}
                          aria-controls={panelId}
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenService((current) =>
                              current === index ? null : index,
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 py-4.5 text-left"
                        >
                          <div className="min-w-0">
                            <span className="block text-sm font-medium tracking-[0.16em] text-[#5b6f7a]">
                              {service.index}
                            </span>
                            <h3
                              className="mt-2 font-[family-name:var(--font-heading)] text-[1.55rem] leading-[1.05] tracking-[-0.04em] transition-colors duration-200 sm:text-[1.75rem] text-[var(--foreground)]"
                            >
                              {service.title}
                            </h3>
                          </div>

                          <span
                            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                              isOpen
                                ? "border-[rgba(255,178,188,0.95)] bg-[rgba(255,246,247,0.96)] text-[rgba(238,32,40,0.82)]"
                                : "border-[rgba(255,178,188,0.6)] bg-[rgba(255,246,247,0.72)] text-[rgba(17,17,17,0.72)]"
                            }`}
                            aria-hidden="true"
                          >
                            <ChevronDown
                              className={`h-5 w-5 transition-transform duration-300 ${
                                isOpen ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </span>
                        </button>

                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="pb-4 text-base leading-8 text-[var(--muted)]">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <span className="hidden pt-1 text-xl font-medium tracking-[-0.04em] text-[#5b6f7a] md:block">
                        {service.index}
                      </span>
                      <div className="hidden items-start justify-between gap-3 md:flex">
                        <div className="min-w-0">
                          <h3 className="font-[family-name:var(--font-heading)] text-[1.9rem] leading-[1.02] tracking-[-0.04em] transition-colors duration-200 sm:text-[2.2rem] group-hover:text-[var(--foreground)]">
                            {service.title}
                          </h3>
                        </div>

                        <div className="hidden md:flex md:h-11 md:w-11 md:items-center md:justify-center md:self-start md:rounded-full md:border md:border-[var(--border)] md:text-[var(--foreground)]/60">
                          <ArrowRight
                            className="h-4 w-4 transform-gpu translate-x-0 text-[var(--foreground)]/70 transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:translate-x-[1px] group-hover:text-[#ee2028]"
                          />
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <div className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 ease-out opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                          <div className="overflow-hidden">
                            <p className="pt-0.5 text-base leading-8 text-[var(--muted)]">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={360} className="pt-5 text-center">
              <div className="mx-auto max-w-[36rem]">
                <p className="text-base leading-7 text-[var(--muted)]">
                  Built for decision-makers who want an SEO-ready reborn at a
                  low annual cost, with blog growth available when needed.
                </p>
                <div className="mt-4 flex justify-center">
                  <CtaLink href="#pricing" variant="soft">
                    View Package Details
                  </CtaLink>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="visual-showcase"
          className="bg-[var(--surface)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22"
        >
          <div className="mx-auto w-full max-w-[1260px]">
            <Reveal className="mx-auto max-w-[820px] text-center">
              <SectionLabel centered>Visual Showcase</SectionLabel>
              <h2 className="mx-auto max-w-[12ch] font-[family-name:var(--font-heading)] text-[2.85rem] leading-[1.03] tracking-[-0.05em] sm:text-[3.45rem] lg:text-[4.2rem]">
                See What Your Website Can <span className="text-[#ee2028]">Become</span>
              </h2>
              <p className="mt-6 mx-auto max-w-[40rem] text-lg leading-8 text-[var(--muted)]">
                We refresh your existing WordPress, Drupal, or similar CMS site into a cleaner
                version that supports stronger <span className="text-[#ee2028]">SEO relevance</span> without starting over.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
              {showcasePanels.map((panel, index) => (
                <Reveal key={`${panel.title}-${panel.theme}`} delay={80 + index * 55}>
                  <article>
                    <ShowcaseMockup image={panel.image} />
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={420} className="mt-12 text-center">
              <div className="mx-auto flex max-w-[46rem] flex-col items-center gap-4">
                <p className="max-w-[34rem] text-base leading-8 text-[var(--muted)]">
                  Website reborn from <span className="text-[#ee2028]">RM100/year</span>, plus an optional <span className="text-[#ee2028]">RM120</span> Blog Add-On for
                  {" "}a 12-page upgrade.
                </p>
                <CtaLink href="#contact" variant="soft">
                  Check If Your Website Fits
                </CtaLink>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[var(--surface)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22">
          <div className="mx-auto w-full max-w-[1140px]">
            <Reveal className="mx-auto max-w-[720px] text-center">
              <SectionLabel centered>Why choose this</SectionLabel>
              <h2 className="mx-auto max-w-[12ch] font-[family-name:var(--font-heading)] text-[2.8rem] leading-[1.04] tracking-[-0.04em] sm:text-[3.4rem] lg:text-[3.95rem]">
                <span className="block">Designed for</span>
                <span className="block">
                  <span className="text-[#ee2028]">Practical Results</span>, Not Complexity
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-[38rem] text-base leading-7 text-[var(--muted)] sm:text-lg">
                Clear, compact, and built to keep the process moving.
              </p>
            </Reveal>

            <div className="mt-16 grid gap-x-9 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              {whyChooseReasons.map((reason, index) => {
                const Icon = reason.icon;

                return (
                  <Reveal
                    key={reason.index}
                    delay={80 + index * 45}
                    className="border-b border-[var(--border)] pb-5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[#ee2028] shadow-sm">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-heading)] text-[1.45rem] leading-[1.08] tracking-[-0.04em] sm:text-[1.5rem]">
                          {reason.title}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={420} className="mt-12 text-center">
              <div className="mx-auto flex max-w-[46rem] flex-col items-center gap-4">
                <p className="max-w-[34rem] text-base leading-8 text-[var(--muted)]">
                  Lower cost. Faster turnaround. <span className="text-[#ee2028]">Basic SEO</span>. No technical setup.
                </p>
                <CtaLink href="#contact" variant="soft">
                  Start With RM100/Year
                </CtaLink>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="pricing"
          className="bg-[var(--surface-strong)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22"
        >
          <div className="mx-auto grid w-full max-w-[1260px] gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[var(--shadow)]">
                <Image
                  src={pricingImage}
                  alt="Pricing discussion"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={100}>
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="max-w-[11ch] font-[family-name:var(--font-heading)] text-[2.8rem] leading-[1.02] tracking-[-0.05em] sm:text-[3.3rem] lg:text-[3.8rem]">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-5 max-w-[28rem] text-lg leading-8 text-[var(--muted)]">
                One clear plan for existing websites. Add the{" "}
                <span className="text-[#ee2028]">blog switch</span> only when you need more content.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {["Clear scope", "No hidden cost", "Straightforward delivery"].map((note) => (
                  <span
                    key={note}
                    className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mx-auto mt-14 w-full max-w-[1260px]">
            <Reveal delay={130}>
              <article className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-6 border-b border-[var(--border)] px-6 py-6 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => handlePackageChange(isBlogPackage ? "core" : "blog")}
                    className="max-w-[34rem] text-left"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                      {selectedPackageLabel}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--font-heading)] text-[2rem] leading-[1.04] tracking-[-0.04em] transition-colors duration-200 sm:text-[2.2rem]">
                      {selectedPackageTitle}
                    </h3>
                    <p className="mt-3 max-w-[28rem] text-base leading-7 text-[var(--muted)]">
                      {selectedPackageDescription}
                    </p>
                  </button>
                  <div className="flex items-center gap-3 rounded-full bg-[var(--gold-soft)] px-4 py-3 self-start shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                      Price
                    </span>
                    <span className="text-[1rem] font-semibold text-[var(--foreground)]">
                      {pricingSummary}
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/64">
                      Includes
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {selectedPackageIncludes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-base leading-7 text-[var(--foreground)]">
                          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                    <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                          SEO Enhancement
                          </p>
                          <p className="mt-2 text-base font-medium text-[var(--foreground)]">
                          + RM120
                          </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isBlogPackage}
                          onClick={() => handlePackageChange(isBlogPackage ? "core" : "blog")}
                          className={`relative inline-flex h-9 w-16 items-center rounded-full border transition ${
                            isBlogPackage
                              ? "border-[#ee2028] bg-[#ee2028] shadow-[0_0_0_3px_rgba(238,32,40,0.12)]"
                              : "border-[#b9b9b9] bg-[#ececec] shadow-[0_0_0_3px_rgba(185,185,185,0.1)]"
                          }`}
                        >
                          <span
                            className={`inline-block h-7 w-7 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              isBlogPackage ? "translate-x-8" : "translate-x-1"
                            }`}
                          />
                        </button>
                        {!isBlogPackage ? (
                          <p className="mt-3 flex items-center gap-2 text-right text-sm leading-6 text-[var(--muted)]">
                            <span>Blog brief comes after checkout</span>
                            <span
                              aria-hidden="true"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--gold)] shadow-[0_3px_8px_rgba(0,0,0,0.05)] blog-nudge"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out ${
                        isBlogPackage
                          ? "mt-5 grid-rows-[1fr] opacity-100"
                          : "mt-0 grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="rounded-[1.3rem] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.025)]">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/64">
                            SEO Enhancement includes
                          </p>
                          <ul className="mt-3 space-y-3">
                            {pricingBlogIncludes.map((item) => (
                              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground)]">
                                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--border)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <CtaLink href="#contact" variant="soft" className="justify-center">
                    Choose This Plan
                  </CtaLink>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        <section
          id="how-it-work"
          className="bg-white px-6 py-18 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <Reveal className="mx-auto max-w-[860px] text-center">
              <div className="mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                <span
                  className="h-2.5 w-3 bg-[var(--gold)]"
                  style={{
                    clipPath:
                      "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                  }}
                />
                <span>How It Works</span>
              </div>
              <h2 className="mx-auto max-w-[13ch] font-[family-name:var(--font-heading)] text-[2.9rem] leading-[1.02] tracking-[-0.05em] sm:text-[3.6rem] lg:text-[4.35rem]">
                How It Works
              </h2>
            </Reveal>

            <div className="relative mt-18">
              <div className="hidden lg:block">
                <div className="absolute left-0 right-0 top-[1.85rem] h-px bg-[rgba(17,17,17,0.09)]">
                  <div
                    className="h-full origin-left bg-[#ee2028] transition-transform duration-150 ease-out"
                    style={{ transform: `scaleX(${processProgress})` }}
                  />
                </div>

                <div className="grid gap-x-10 gap-y-16 lg:grid-cols-5">
                  {processSteps.map((step, index) => (
                    <Reveal key={step.index} delay={80 + index * 70}>
                      <article className="relative text-center">
                        <div className="relative z-10 flex justify-center">
                          <span
                            className={`inline-flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full text-lg font-medium transition-[background-color,color,box-shadow] duration-300 ${
                              processProgress >= index / (processSteps.length - 1)
                                ? "bg-[var(--teal)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
                                : "bg-[var(--surface-muted)] text-[var(--foreground)] shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
                            }`}
                          >
                            {step.index}
                          </span>
                        </div>
                        <p className="mx-auto mt-12 max-w-[16ch] font-[family-name:var(--font-heading)] text-[1.75rem] leading-[1.34] tracking-[-0.04em] text-[rgba(17,17,17,0.68)] sm:text-[1.9rem]">
                          {step.title}
                        </p>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>

              <div className="lg:hidden">
                <div className="relative">
                  <div className="absolute left-[1.125rem] top-0 bottom-0 w-px bg-[rgba(17,17,17,0.09)]" />
                  <div
                    className="absolute left-[1.125rem] top-0 bottom-0 w-px origin-top bg-[#ee2028] transition-transform duration-150 ease-out"
                    style={{ transform: `scaleY(${processProgress})` }}
                  />

                  <div className="space-y-10">
                    {processSteps.map((step, index) => {
                      return (
                        <Reveal key={step.index} delay={80 + index * 70}>
                          <article className="relative flex items-start gap-5 pl-0">
                            <span
                              className={`relative z-10 mt-0 inline-flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-full text-[0.9rem] font-medium transition-[background-color,color,box-shadow] duration-300 ${
                                processProgress >= index / (processSteps.length - 1)
                                  ? "bg-[var(--teal)] text-white shadow-[0_10px_18px_rgba(0,0,0,0.14)]"
                                  : "bg-[var(--surface-muted)] text-[var(--foreground)] shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
                              }`}
                            >
                              {step.index}
                            </span>
                            <p className="pt-0.5 font-[family-name:var(--font-heading)] text-[1.6rem] leading-[1.38] tracking-[-0.04em] text-[rgba(17,17,17,0.72)] sm:text-[1.75rem]">
                              {step.title}
                            </p>
                          </article>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Reveal delay={520} className="mt-16 text-center">
                <p className="mx-auto mb-4 max-w-[34rem] text-base leading-8 text-[var(--muted)]">
                  A clear process for existing websites. Payment first for the
                  blog add-on, then the brief, then the handoff.
                </p>
                <CtaLink href="#contact" variant="soft">
                  Submit My Website
                </CtaLink>
              </Reveal>
            </div>
          </div>
        </section>

            <WebsiteSubmissionSection
              selectedPackage={selectedPackage}
              onPackageChange={handlePackageChange}
            />

        <section id="faq" className="bg-[var(--surface-strong)] px-6 py-18 sm:px-8 lg:px-10 lg:py-22">
          <div className="mx-auto w-full max-w-[1260px]">
            <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
              <Reveal className="lg:sticky lg:top-28">
                  <div className="max-w-[31rem]">
                  <SectionLabel>FAQ</SectionLabel>
                  <h2 className="max-w-[11ch] font-[family-name:var(--font-heading)] text-[2.8rem] leading-[1.04] tracking-[-0.04em] sm:text-[3.4rem] lg:text-[3.9rem]">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-5 max-w-[26rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
                    Clear answers on fit, scope, SEO, and delivery so decision-makers can move forward with confidence.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {faqItems.map((item, index) => {
                    const isOpen = openFaq === index;
                    const panelId = `faq-panel-${index}`;
                    const buttonId = `faq-button-${index}`;

                    return (
                      <article
                        key={item.question}
                        className={`transition-colors duration-200 ${
                          isOpen
                            ? "bg-[linear-gradient(90deg,rgba(255,246,247,0)_0%,rgba(255,246,247,0.92)_8%,rgba(255,246,247,0.92)_92%,rgba(255,246,247,0)_100%)]"
                            : "bg-white hover:bg-[linear-gradient(90deg,rgba(255,246,247,0)_0%,rgba(255,246,247,0.92)_8%,rgba(255,246,247,0.92)_92%,rgba(255,246,247,0)_100%)]"
                        }`}
                      >
                        <button
                          type="button"
                          id={buttonId}
                          aria-controls={panelId}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 py-4.5 text-left sm:py-5.5"
                          onClick={() =>
                            setOpenFaq((current) => (current === index ? -1 : index))
                          }
                        >
                          <span className="min-w-0 font-[family-name:var(--font-heading)] text-[1.55rem] leading-[1.05] tracking-[-0.04em] sm:text-[1.75rem]">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                              isOpen
                                ? "rotate-180 text-[var(--gold)]"
                                : "text-[rgba(17,17,17,0.82)]"
                            }`}
                          />
                        </button>

                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="max-w-[38rem] pb-4 text-base leading-8 text-[var(--muted)]">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <CivitasFooter />
    </div>
  );
}

