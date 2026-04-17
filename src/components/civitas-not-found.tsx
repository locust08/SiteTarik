import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CivitasFooter } from "@/components/civitas-footer";
import { CivitasHeader } from "@/components/civitas-header";

export function CivitasNotFound() {
  return (
    <div className="min-h-screen bg-[var(--surface-strong)] text-[var(--foreground)]">
      <CivitasHeader solid />

      <main className="px-6 pb-24 pt-24 sm:px-8 lg:px-10 lg:pt-28">
        <div className="mx-auto flex min-h-[58vh] max-w-[900px] flex-col items-center justify-center text-center">
          <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Page not found
          </div>
          <h1 className="max-w-[12ch] font-[family-name:var(--font-heading)] text-[3.2rem] leading-[1.02] tracking-[-0.04em] sm:text-[4.3rem] lg:text-[4.8rem]">
            It looks like you&apos;ve taken a wrong turn to here!!
          </h1>
          <p className="mt-6 max-w-[26rem] text-[1.05rem] leading-9 text-[var(--muted)] sm:text-[1.2rem]">
            But don&apos;t worry, we&apos;re here to guide you back, your legal
            solutions are just a click away!
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold-soft)] px-5 py-3 text-sm font-semibold text-[var(--teal-deep)] hover:-translate-y-0.5"
          >
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <CivitasFooter />
    </div>
  );
}
