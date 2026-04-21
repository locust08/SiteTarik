import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CtaVariant = "soft" | "light" | "brand" | "dark";

const variantClasses: Record<CtaVariant, string> = {
  soft: "bg-[var(--gold-soft)] text-[var(--teal-deep)]",
  light: "bg-white text-[var(--teal-deep)]",
  brand: "bg-[var(--gold)] text-white",
  dark: "bg-[var(--teal)] text-white",
};

const variantHoverClasses: Record<CtaVariant, string> = {
  soft: "",
  light: "hover:bg-white/92",
  brand: "hover:bg-[#d81c23]",
  dark: "hover:bg-[var(--teal-deep)]",
};

export const ctaBaseClassName =
  "group inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-0.5";

export const ctaContentClassName =
  "inline-flex items-center gap-2 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-focus-visible:-translate-x-0.5";

export const ctaArrowClassName =
  "w-0 -translate-x-1 overflow-hidden opacity-0 transition-[width,opacity,transform] duration-200 ease-out group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100";

export function ctaClassName(variant: CtaVariant = "soft", className = "") {
  return `${ctaBaseClassName} ${variantClasses[variant]} ${variantHoverClasses[variant]} ${className}`;
}

export function CtaLink({
  href,
  children,
  variant = "soft",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: CtaVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={ctaClassName(variant, className)}
    >
      <span className={ctaContentClassName}>
        {children}
        <span className={ctaArrowClassName}>
          <ArrowRight className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}
