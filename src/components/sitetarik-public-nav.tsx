"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { CtaLink } from "@/components/cta-link";
import { siteStickyHeaderClassName } from "@/lib/site-header";

const navItems = [
  { label: "Pricing", href: "/#pricing", activeKey: "pricing" },
  { label: "What You Get", href: "/#services", activeKey: "services" },
  { label: "How It Works", href: "/#how-it-work", activeKey: "how-it-work" },
  { label: "Blog", href: "/blog", activeKey: "blog" },
  { label: "FAQ", href: "/#faq", activeKey: "faq" },
];

export function SiteTarikPublicNav({ activeKey = "blog" }: { activeKey?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className={`${siteStickyHeaderClassName} border-b border-black/8 bg-[rgba(255,255,255,0.9)] text-[var(--foreground)] shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-md transition-[background-color,border-color,color,box-shadow] duration-300`}>
        <div className="mx-auto w-full max-w-[1230px] px-5 py-7 sm:px-7 lg:px-6">
          <div className="flex items-center justify-between gap-5">
            <Link
              href="/"
              title="SiteTarik homepage"
              className="font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-none tracking-[-0.04em]"
            >
              SiteTarik
            </Link>

            <nav className="hidden flex-1 items-center justify-end gap-8 text-sm font-semibold text-[var(--foreground)]/88 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`relative pb-1 transition ${
                    activeKey === item.activeKey ? "text-[var(--gold)]" : "hover:text-[var(--gold)]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full transition ${
                      activeKey === item.activeKey ? "bg-[var(--gold)] opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex">
              <Link
                href="/#contact"
                title="Start Upgrade"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23]"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[var(--foreground)] lg:hidden"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-[rgba(11,32,32,0.78)] backdrop-blur-sm transition ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } lg:hidden`}
      >
        <div className="hero-panel grain absolute left-4 top-24 w-[calc(100%-2rem)] rounded-[2rem] border border-white/8 px-6 py-8 text-white shadow-[var(--shadow)]">
          <div className="mb-8 space-y-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`block text-2xl font-semibold ${
                  activeKey === item.activeKey ? "text-[var(--gold-soft)]" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <CtaLink href="/#contact" variant="soft">
            Start Upgrade
          </CtaLink>
        </div>
      </div>
    </>
  );
}
