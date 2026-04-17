import Link from "next/link";
import { ArrowRight } from "lucide-react";

const navItems = [
  { label: "Pricing", href: "/#pricing" },
  { label: "What You Get", href: "/#services" },
  { label: "How It Works", href: "/#how-it-work" },
  { label: "Start", href: "/#contact" },
];

export function CivitasHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-black/8 ${
        solid
          ? "bg-[rgba(255,255,255,0.94)] text-[var(--foreground)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          : "bg-[rgba(255,255,255,0.88)] text-[var(--foreground)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1150px] items-center justify-between px-6 py-7 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-[2rem] font-semibold leading-none tracking-[-0.04em]"
        >
          SiteTarik
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-semibold text-[var(--foreground)]/88 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--gold)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#contact"
          className="group hidden items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5 hover:bg-[#d81c23] lg:inline-flex"
        >
          Start My Website Upgrade
          <span className="w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </header>
  );
}
