import type { ReactNode } from "react";

type ReceiptSummaryRowProps = {
  label: string;
  value: string;
  truncateValue?: boolean;
};

type ReceiptDetailRowProps = {
  label: string;
  value: string;
};

type ReceiptCardProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ReceiptSummaryRow({
  label,
  value,
  truncateValue = false,
}: ReceiptSummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(17,17,17,0.68)]">
        {label}
      </dt>
      <dd
        title={truncateValue ? value : undefined}
        className={`min-w-0 text-right text-sm leading-6 text-[#111111] sm:text-base ${
          truncateValue ? "max-w-[58%] truncate" : "break-words"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function ReceiptDetailRow({ label, value }: ReceiptDetailRowProps) {
  return (
    <div className="grid gap-1.5 border-b border-[rgba(0,0,0,0.06)] py-3 last:border-b-0 sm:grid-cols-[0.9fr_1.1fr] sm:items-start">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(17,17,17,0.68)]">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-[#111111] sm:text-right">{value}</dd>
    </div>
  );
}

export function ReceiptCard({
  eyebrow,
  title,
  description,
  badge,
  children,
  footer,
  className = "",
}: ReceiptCardProps) {
  return (
    <section
      className={`rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] sm:p-7 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
            {eyebrow}
          </p>
          <h2 className="mt-2.5 font-[family-name:var(--font-heading)] text-[1.75rem] leading-[1.02] tracking-[-0.04em]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {badge ? (
          <div className="shrink-0 rounded-full border border-[rgba(238,32,40,0.16)] bg-[var(--gold-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-2.5">{children}</div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
