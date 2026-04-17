import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const menuLinks = [
  { label: "Pricing", href: "/#pricing" },
  { label: "What You Get", href: "/#services" },
  { label: "How It Works", href: "/#how-it-work" },
  { label: "FAQ", href: "/#faq" },
];

const contactLinks = [
  {
    icon: Mail,
    label: "testing@gmail.com",
    href: "mailto:testing@gmail.com",
  },
  {
    icon: Phone,
    label: "+01 23 456 789",
    href: "tel:+123456789",
  },
  {
    icon: MapPin,
    label: "Petaling Jaya, Selangor",
    href: "https://www.google.com/maps/search/Petaling+Jaya,+Selangor",
  },
];

export function CivitasFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)] bg-[linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)] px-6 py-16 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1150px] gap-12 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div>
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-[2.2rem] font-semibold leading-none tracking-[-0.04em]"
          >
            SiteTarik
          </Link>
          <p className="mt-5 max-w-[16rem] text-lg leading-8 text-[var(--muted)]">
            Clean website upgrades for existing business sites.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            Menu
          </p>
          <ul className="mt-5 space-y-3 text-base text-[rgba(17,17,17,0.72)]">
            {menuLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-[var(--foreground)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            Get in touch
          </p>
          <div className="mt-5 space-y-3">
            {contactLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-[1rem] border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-4 text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.04)] transition-[background-color,border-color,color,transform] duration-200 hover:border-[rgba(0,0,0,0.12)] hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[var(--gold)]" />
                    <span>{item.label}</span>
                  </span>
                  <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
