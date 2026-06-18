"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  LoaderCircle,
  PieChart,
  RefreshCw,
  Search,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardBreakdownItem, DashboardPayload } from "@/lib/dashboard-data";

const chartColors = ["#ee2028", "#111111", "#7f1d1d", "#f97316", "#0f766e", "#525252", "#a16207", "#be123c"];
const minimumDashboardLoadingMs = 2400;
const tablePageSize = 10;
const tableInteractionLoadingMs = 420;
const dashboardLoadingStages = [
  {
    label: "Connecting to Stripe",
    title: "Reading paid sessions",
    description: "Checking completed payments and customer records.",
  },
  {
    label: "Reading customer signals",
    title: "Grouping revenue intent",
    description: "Sorting package mix, business types, and buyer details.",
  },
  {
    label: "Preparing decision view",
    title: "Building the dashboard",
    description: "Turning payment data into clear, actionable insight.",
  },
];
const inputClass =
  "min-h-[52px] w-full rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3.5 text-[15px] leading-6 text-[var(--foreground)] outline-none placeholder:text-[0.92rem] placeholder:text-[var(--muted)]/72 focus:border-[var(--gold)]";

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateValue: string) {
  if (!dateValue) {
    return "All time";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function CalendarDateControl({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [value]);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

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

  const monthLabel = new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }

          setIsOpen((current) => !current);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`group flex min-h-[52px] w-full items-center justify-between rounded-[1rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,0.96))] px-4 py-3.5 text-left text-[15px] text-[var(--foreground)] shadow-[0_6px_18px_rgba(0,0,0,0.04)] transition duration-200 hover:border-[rgba(238,32,40,0.2)] hover:shadow-[0_12px_24px_rgba(238,32,40,0.06)] focus:outline-none focus:ring-4 focus:ring-[rgba(238,32,40,0.08)] ${
          isOpen ? "border-[var(--gold)] shadow-[0_0_0_4px_rgba(238,32,40,0.08),0_12px_24px_rgba(0,0,0,0.06)]" : "border-[var(--border)]"
        }`}
      >
        <span className={value ? "text-[var(--foreground)]" : "text-[var(--muted)]/72"}>
          {value ? formatDateLabel(value) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--gold)] transition duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={placeholder}
          className="absolute left-0 top-full z-30 mt-2 w-full max-w-[19rem] rounded-[1rem] border border-[rgba(0,0,0,0.08)] bg-white p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">{monthLabel}</p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span
                key={day}
                className="py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]/70"
              >
                {day}
              </span>
            ))}
            {calendarDays.map((date) => {
              const isoDate = toIsoDate(date);
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = isoDate === value;
              const isToday = isoDate === toIsoDate(new Date());

              return (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => {
                    onChange(isoDate);
                    setIsOpen(false);
                  }}
                  className={`flex aspect-square min-h-8 items-center justify-center rounded-[0.62rem] text-[0.82rem] font-semibold transition ${
                    isSelected
                      ? "bg-[var(--gold)] text-white shadow-[0_10px_22px_rgba(238,32,40,0.24)]"
                      : isToday
                        ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                        : isCurrentMonth
                          ? "text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                          : "text-[var(--muted)]/35 hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="mt-2 w-full rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              Clear date
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
          <p className="mt-3 font-[family-name:var(--font-heading)] text-[2.35rem] leading-none tracking-[-0.04em]">
            {value}
          </p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{helper}</p>
    </article>
  );
}

function DashboardLoadingState({ stage }: { stage: (typeof dashboardLoadingStages)[number] }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.98)_0%,rgba(18,18,18,0.98)_100%)] px-6">
      <div className="absolute inset-0 backdrop-blur-2xl" />
      <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-[2rem] border border-white/10 bg-white/8 px-8 py-10 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
          <LoaderCircle className="h-9 w-9 animate-spin" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {stage.label}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[2.5rem] leading-[1] tracking-[-0.05em]">
          {stage.title}
        </h1>
        <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/72">
          {stage.description}
        </p>
      </div>
    </main>
  );
}

function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PieBreakdown({
  title,
  items,
}: {
  title: string;
  items: DashboardBreakdownItem[];
}) {
  const [hoveredItem, setHoveredItem] = useState<DashboardBreakdownItem | null>(null);
  let angle = 0;
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const activeLabel = hoveredItem?.label ?? "Total";
  const activeValue = hoveredItem ? `${hoveredItem.count} (${hoveredItem.percentage}%)` : String(total);

  return (
    <article className="dashboard-card rounded-[8px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Breakdown</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[1.9rem] leading-none tracking-[-0.04em]">
            {title}
          </h2>
        </div>
        <PieChart className="h-5 w-5 text-[var(--gold)]" />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[210px_1fr] md:items-center">
        <div className="relative mx-auto h-[210px] w-[210px]">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            {items.length ? (
              items.map((item, index) => {
                const sweep = total ? (item.count / total) * 360 : 0;
                const path = describeArc(100, 92, angle, angle + sweep);
                angle += sweep;
                const isDimmed = Boolean(hoveredItem && hoveredItem.label !== item.label);

                return (
                  <path
                    key={item.label}
                    className={`dashboard-pie-slice cursor-pointer transition duration-200 ${isDimmed ? "opacity-45" : "opacity-100"}`}
                    d={path}
                    fill={chartColors[index % chartColors.length]}
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ animationDelay: `${index * 70}ms` }}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() => setHoveredItem(item)}
                    onBlur={() => setHoveredItem(null)}
                    tabIndex={0}
                  />
                );
              })
            ) : (
              <circle cx="100" cy="100" r="82" fill="var(--surface-muted)" />
            )}
          </svg>
        </div>

        <div className="grid gap-2.5">
          <div className="rounded-[8px] border border-[rgba(238,32,40,0.18)] bg-[var(--gold-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              {activeLabel}
            </p>
            <p className="mt-1 font-[family-name:var(--font-heading)] text-[2rem] leading-none tracking-[-0.04em] text-[var(--foreground)]">
              {activeValue}
            </p>
          </div>
          {items.length ? (
            items.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-3 rounded-[8px] border px-3 py-2.5 transition duration-200 ${
                  hoveredItem?.label === item.label
                    ? "border-[rgba(238,32,40,0.28)] bg-[var(--gold-soft)] shadow-[0_10px_22px_rgba(238,32,40,0.08)]"
                    : "border-[var(--border)] bg-[var(--surface-strong)]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <span className="truncate text-sm font-semibold text-[var(--foreground)]">{item.label}</span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[var(--muted)]">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">No paid customers in this date range.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function BusinessTypeRanking({ items }: { items: DashboardBreakdownItem[] }) {
  const topItems = items.slice(0, 6);
  const maxCount = topItems[0]?.count ?? 0;
  const totalCustomers = items.reduce((sum, item) => sum + item.count, 0);
  const topBusinessType = topItems[0];

  return (
    <article className="dashboard-card rounded-[8px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Business Types</p>
          <h2 className="mt-2 whitespace-nowrap font-[family-name:var(--font-heading)] text-[1.9rem] leading-none tracking-[-0.04em]">
            Segment Leaders
          </h2>
        </div>
        {topBusinessType ? (
          <p className="text-sm leading-6 text-[var(--muted)] xl:max-w-[32rem] xl:whitespace-nowrap xl:text-right">
            <span className="font-semibold text-[var(--foreground)]">{topBusinessType.label}</span> leads the segment at{" "}
            <span className="font-semibold text-[var(--gold)]">{topBusinessType.percentage}%</span> of{" "}
            {totalCustomers} customers.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)] xl:max-w-[32rem] xl:whitespace-nowrap xl:text-right">
            No business type data found for the selected date range.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {topItems.length ? (
          topItems.map((item, index) => (
            <div key={item.label} className="grid gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-xs font-semibold text-[var(--gold)]">
                    {index + 1}
                  </span>
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--muted)]">
                  {item.count} ({item.percentage}%)
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(17,17,17,0.07)]">
                <div
                  className="h-full rounded-full bg-[var(--gold)]"
                  style={{ width: maxCount ? `${Math.max(8, (item.count / maxCount) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
            No business types found for this date range.
          </p>
        )}
      </div>
    </article>
  );
}

function RevenueByPackage({
  orders,
  currency,
}: {
  orders: DashboardPayload["orders"];
  currency: string;
}) {
  const packageRevenue = useMemo(() => {
    const revenueMap = new Map<string, { label: string; count: number; revenue: number }>();

    for (const order of orders) {
      const label = order.packageTitle || "Unknown Package";
      const current = revenueMap.get(label) ?? { label, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += order.amountTotal;
      revenueMap.set(label, current);
    }

    return Array.from(revenueMap.values()).sort(
      (a, b) => b.revenue - a.revenue || b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [orders]);
  const topPackage = packageRevenue[0];
  const maxRevenue = topPackage?.revenue ?? 0;

  return (
    <article className="dashboard-card rounded-[8px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Revenue</p>
          <h2 className="mt-2 whitespace-nowrap font-[family-name:var(--font-heading)] text-[1.9rem] leading-none tracking-[-0.04em]">
            Package Value
          </h2>
        </div>
        {topPackage ? (
          <p className="text-sm leading-6 text-[var(--muted)] xl:max-w-[34rem] xl:text-right">
            <span className="font-semibold text-[var(--foreground)]">{topPackage.label}</span> leads revenue at{" "}
            <span className="font-semibold text-[var(--gold)]">{formatMoney(topPackage.revenue, currency)}</span>.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)] xl:max-w-[34rem] xl:text-right">
            No package revenue found for the selected date range.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {packageRevenue.length ? (
          packageRevenue.map((item, index) => (
            <div key={item.label} className="grid gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-xs font-semibold text-[var(--gold)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{item.count} paid customers</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                  {formatMoney(item.revenue, currency)}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(17,17,17,0.07)]">
                <div
                  className="h-full rounded-full bg-[var(--gold)]"
                  style={{ width: maxRevenue ? `${Math.max(8, (item.revenue / maxRevenue) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
            No package revenue found for this date range.
          </p>
        )}
      </div>
    </article>
  );
}

export function DashboardClient({ initialNeedsLogin = false }: { initialNeedsLogin?: boolean }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(!initialNeedsLogin);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(initialNeedsLogin);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasLoginUnlocked, setHasLoginUnlocked] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [visibleOrderCount, setVisibleOrderCount] = useState(tablePageSize);
  const [isSearchApplying, setIsSearchApplying] = useState(false);
  const [isTableExpanding, setIsTableExpanding] = useState(false);
  const [isTableCollapsing, setIsTableCollapsing] = useState(false);
  const [isPdfPreparing, setIsPdfPreparing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const hasPresentedDashboardRef = useRef(false);
  const skipNextDashboardFetchRef = useRef(false);
  const searchTimerRef = useRef<number | null>(null);
  const tableExpandTimerRef = useRef<number | null>(null);
  const tableCollapseTimerRef = useRef<number | null>(null);
  const pdfTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (startDate) {
      params.set("startDate", startDate);
    }

    if (endDate) {
      params.set("endDate", endDate);
    }

    return params.toString();
  }, [startDate, endDate]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
      if (tableExpandTimerRef.current) {
        window.clearTimeout(tableExpandTimerRef.current);
      }
      if (tableCollapseTimerRef.current) {
        window.clearTimeout(tableCollapseTimerRef.current);
      }
      if (pdfTimerRef.current) {
        window.clearTimeout(pdfTimerRef.current);
      }
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    setLoadingStageIndex(0);
    const stageTimers = dashboardLoadingStages.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setLoadingStageIndex(index + 1);
      }, (index + 1) * 900),
    );

    return () => {
      stageTimers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [isLoading, queryString]);

  const markDashboardPresented = () => {
    if (hasPresentedDashboardRef.current) {
      return;
    }

    hasPresentedDashboardRef.current = true;
  };

  useEffect(() => {
    if (needsLogin) {
      setIsLoading(false);
      return;
    }

    if (skipNextDashboardFetchRef.current) {
      skipNextDashboardFetchRef.current = false;
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      const loadStartedAt = Date.now();
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/dashboard/orders${queryString ? `?${queryString}` : ""}`, {
          cache: "no-store",
        });
        const result = (await response.json().catch(() => null)) as DashboardPayload | { error?: string } | null;

        if (response.status === 401) {
          if (!cancelled) {
            setNeedsLogin(true);
            setPayload(null);
          }

          return;
        }

        if (!response.ok) {
          throw new Error((result as { error?: string } | null)?.error || "Could not load dashboard data.");
        }

        if (!hasPresentedDashboardRef.current) {
          await wait(Math.max(0, minimumDashboardLoadingMs - (Date.now() - loadStartedAt)));
        }

        if (!cancelled) {
          setNeedsLogin(false);
          setPayload(result as DashboardPayload);
          markDashboardPresented();
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [needsLogin, queryString]);

  const summary = payload?.summary;
  const pdfHref = `/api/dashboard/pdf${queryString ? `?${queryString}` : ""}`;
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const filteredOrders = useMemo(() => {
    const orders = payload?.orders ?? [];

    if (!normalizedCustomerSearch) {
      return orders;
    }

    return orders.filter((order) =>
      [
        order.customerName,
        order.customerEmail,
        order.businessName,
        order.packageTitle,
        order.selectedPackage,
      ].some((value) => value.toLowerCase().includes(normalizedCustomerSearch)),
    );
  }, [normalizedCustomerSearch, payload?.orders]);
  const visibleOrders = filteredOrders.slice(0, visibleOrderCount);
  const hasMoreOrders = visibleOrderCount < filteredOrders.length;

  useEffect(() => {
    setVisibleOrderCount(tablePageSize);
    setIsTableExpanding(false);
    setIsTableCollapsing(false);
  }, [normalizedCustomerSearch, queryString, payload?.orders]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setHasLoginUnlocked(false);
    setLoginError("");

    try {
      const response = await fetch("/api/cms/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Password incorrect. Please try again.");
      }

      setPassword("");
      setIsLoading(true);
      const loadStartedAt = Date.now();
      const dataResponse = await fetch(`/api/dashboard/orders${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const data = (await dataResponse.json().catch(() => null)) as DashboardPayload | { error?: string } | null;

      if (!dataResponse.ok) {
        throw new Error((data as { error?: string } | null)?.error || "Could not load dashboard data.");
      }

      if (!hasPresentedDashboardRef.current) {
        await wait(Math.max(0, minimumDashboardLoadingMs - (Date.now() - loadStartedAt)));
      }

      setPayload(data as DashboardPayload);
      skipNextDashboardFetchRef.current = true;
      markDashboardPresented();
      setHasLoginUnlocked(true);
      await wait(620);
      setNeedsLogin(false);
    } catch (loginFailure) {
      setHasLoginUnlocked(false);
      setLoginError(loginFailure instanceof Error ? loginFailure.message : "Password incorrect. Please try again.");
    } finally {
      setIsLoggingIn(false);
      setIsLoading(false);
    }
  };

  const activeLoadingStage = dashboardLoadingStages[loadingStageIndex] ?? dashboardLoadingStages[0];
  const applyCustomerSearch = () => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    setIsSearchApplying(true);
    searchTimerRef.current = window.setTimeout(() => {
      setCustomerSearch(customerSearchInput.trim());
      setIsSearchApplying(false);
      searchTimerRef.current = null;
    }, tableInteractionLoadingMs);
  };
  const showMoreOrders = () => {
    if (tableExpandTimerRef.current || isTableExpanding) {
      return;
    }

    setIsTableExpanding(true);
    tableExpandTimerRef.current = window.setTimeout(() => {
      setVisibleOrderCount((current) => current + tablePageSize);
      setIsTableExpanding(false);
      tableExpandTimerRef.current = null;
    }, tableInteractionLoadingMs);
  };
  const showLessOrders = () => {
    if (tableCollapseTimerRef.current || isTableCollapsing) {
      return;
    }

    setIsTableCollapsing(true);
    tableCollapseTimerRef.current = window.setTimeout(() => {
      setVisibleOrderCount(tablePageSize);
      setIsTableCollapsing(false);
      tableCollapseTimerRef.current = null;
    }, 260);
  };
  const showPdfPreparing = () => {
    if (pdfTimerRef.current) {
      window.clearTimeout(pdfTimerRef.current);
    }

    setIsPdfPreparing(true);
    pdfTimerRef.current = window.setTimeout(() => {
      setIsPdfPreparing(false);
      pdfTimerRef.current = null;
    }, tableInteractionLoadingMs);
  };
  const resetDashboardControls = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    setIsResetting(true);
    setStartDate("");
    setEndDate("");
    setCustomerSearchInput("");
    setCustomerSearch("");
    setVisibleOrderCount(tablePageSize);
    resetTimerRef.current = window.setTimeout(() => {
      setIsResetting(false);
      resetTimerRef.current = null;
    }, tableInteractionLoadingMs);
  };

  if (needsLogin) {
    return (
      <main className="dashboard-enter flex min-h-screen items-center justify-center bg-[var(--surface-strong)] px-5 py-10 text-[var(--foreground)]">
        <section className="w-full max-w-[440px] rounded-[2rem] border border-[var(--border)] bg-white p-7 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Protected Dashboard</p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-none tracking-[-0.04em]">
            SiteTarik Dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Enter the CMS password to view Stripe customer metrics and download reports.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Password
              </span>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {loginError ? <p className="text-sm font-semibold text-[var(--gold)]">{loginError}</p> : null}

            <button
              type="submit"
              disabled={isLoggingIn || hasLoginUnlocked}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)] disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:shadow-none"
            >
              {hasLoginUnlocked ? (
                <>
                  Unlocking
                  <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                </>
              ) : isLoggingIn ? (
                <>
                  Unlocking
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                </>
              ) : (
                "Unlock Dashboard"
              )}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (isLoading && !payload && !error) {
    return <DashboardLoadingState stage={activeLoadingStage} />;
  }

  return (
    <main className="dashboard-enter min-h-screen bg-[var(--surface)] px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <header className="border-b border-[var(--border)] pb-8">
          <div className="grid gap-7">
            <div className="max-w-[740px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                Stripe Customer Dashboard
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[3.3rem] font-semibold leading-none tracking-[-0.04em] sm:text-[4.8rem]">
                Paid Customer Overview
              </h1>
              <p className="mt-5 max-w-[42rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
                Monitor paid SiteTarik checkout sessions by package and business type, filtered by Stripe payment date.
              </p>
            </div>

            <div className="w-full rounded-[8px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
              <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.35fr)] lg:items-center">
                <form
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    applyCustomerSearch();
                  }}
                >
                  <label className="block">
                    <span className="sr-only">Search paid customers</span>
                    <input
                      className={`${inputClass} pl-4 ${customerSearchInput ? "pr-24" : "pr-14"}`}
                      type="text"
                      placeholder="Search customers, email, business, package"
                      value={customerSearchInput}
                      onChange={(event) => setCustomerSearchInput(event.target.value)}
                    />
                  </label>
                  {customerSearchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchInput("");
                        setCustomerSearch("");
                      }}
                      className="absolute right-14 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--gold)] transition-[background-color,color] duration-200 hover:bg-[var(--gold-soft)] hover:text-[#d81c23]"
                      aria-label="Clear customer search"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSearchApplying}
                    className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--gold)] text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_10px_22px_rgba(238,32,40,0.16)]"
                    aria-label="Search paid customers"
                    title="Search"
                  >
                    {isSearchApplying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </form>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CalendarDateControl value={startDate} onChange={setStartDate} placeholder="Start date" />
                  <CalendarDateControl value={endDate} onChange={setEndDate} placeholder="End date" />
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:ml-auto lg:w-[calc((((100%-0.75rem)*1.35/2.35)-0.75rem)/2)]">
                <a
                  href={pdfHref}
                  onClick={showPdfPreparing}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-white transition-[background-color,box-shadow,color] duration-200 hover:bg-[#d81c23] hover:shadow-[0_14px_28px_rgba(238,32,40,0.16)]"
                >
                  {isPdfPreparing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isPdfPreparing ? "Preparing" : "Download PDF"}
                </a>
                <button
                  type="button"
                  onClick={resetDashboardControls}
                  disabled={isResetting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-[background-color,border-color,color] duration-200 hover:border-[rgba(238,32,40,0.22)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold)] disabled:cursor-wait disabled:text-[var(--muted)]"
                >
                  {isResetting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isResetting ? "Resetting" : "Reset"}
                </button>
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <section className="mt-8 rounded-[8px] border border-[rgba(238,32,40,0.22)] bg-[var(--gold-soft)] p-5 text-[var(--foreground)]">
            <p className="font-semibold">Dashboard data could not load.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{error}</p>
          </section>
        ) : null}

        {isLoading && payload ? (
          <section className="mt-8 flex items-center gap-3 rounded-[8px] border border-[rgba(238,32,40,0.18)] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                {activeLoadingStage.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{activeLoadingStage.description}</p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 py-8 md:grid-cols-3">
          <KpiCard
            label="Paid Customers"
            value={!summary ? "..." : String(summary.totalCustomers)}
            helper="Paid completed Stripe checkout sessions in the selected date range."
            icon={UsersRound}
          />
          <KpiCard
            label="Unique Emails"
            value={!summary ? "..." : String(summary.uniqueEmails)}
            helper="Distinct customer emails, useful when one buyer purchases more than once."
            icon={Search}
          />
          <KpiCard
            label="Paid Revenue"
            value={!summary ? "..." : formatMoney(summary.totalRevenue, summary.currency)}
            helper="Gross amount from paid checkout sessions before Stripe fees."
            icon={WalletCards}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <PieBreakdown title="Core Reborn vs SEO Enhancement" items={summary?.packageBreakdown ?? []} />
          <BusinessTypeRanking items={summary?.businessTypeBreakdown ?? []} />
        </section>

        <section className="pt-5">
          <RevenueByPackage orders={payload?.orders ?? []} currency={summary?.currency ?? "MYR"} />
        </section>

        <section className="py-8">
          <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Customers</p>
                <h2 className="mt-1 font-[family-name:var(--font-heading)] text-[1.8rem] leading-none tracking-[-0.04em]">
                  Paid Stripe Sessions
                </h2>
              </div>
              <div className="text-sm font-medium text-[var(--muted)] sm:text-right">
                <p>{formatDateLabel(startDate)} to {endDate ? formatDateLabel(endDate) : "Today"}</p>
                {filteredOrders.length ? (
                  <p className="mt-1 text-xs">
                    Showing {visibleOrders.length} of {filteredOrders.length} sessions
                  </p>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead className="bg-[var(--surface-strong)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Business</th>
                    <th className="min-w-[170px] whitespace-nowrap px-5 py-3">Business Type</th>
                    <th className="min-w-[170px] px-5 py-3">Package</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y divide-[var(--border)] transition-transform duration-300 ${
                    isTableCollapsing ? "-translate-y-2" : "translate-y-0"
                  }`}
                >
                  {visibleOrders.length ? (
                    visibleOrders.map((order) => (
                      <tr key={order.id} className="align-top text-sm text-[var(--foreground)]">
                        <td className="whitespace-nowrap px-5 py-4 text-[var(--muted)]">{formatOrderDate(order.createdIso)}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{order.customerName}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{order.customerEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{order.businessName}</p>
                          {order.websiteUrl ? (
                            <a
                              href={order.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block max-w-[180px] truncate text-xs text-[var(--gold)]"
                            >
                              {order.websiteUrl}
                            </a>
                          ) : null}
                        </td>
                        <td className="min-w-[170px] whitespace-nowrap px-5 py-4">{order.businessType}</td>
                        <td className="min-w-[170px] px-5 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full bg-[var(--gold-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--gold)]">
                            {order.packageTitle}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatMoney(order.amountTotal, order.currency)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--muted)]">{order.receiptCode}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-10 text-center text-sm leading-6 text-[var(--muted)]" colSpan={7}>
                        {isLoading
                          ? activeLoadingStage.description
                          : normalizedCustomerSearch
                            ? "No customers match this search in the selected date range."
                            : "No paid customers found for this date range."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {hasMoreOrders || visibleOrderCount > tablePageSize ? (
              <div className="border-t border-[var(--border)] bg-white px-5 py-4 text-center">
                {hasMoreOrders ? (
                  <button
                    type="button"
                    onClick={showMoreOrders}
                    disabled={isTableExpanding}
                    className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-[rgba(238,32,40,0.22)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold)] hover:shadow-[0_10px_22px_rgba(238,32,40,0.08)] disabled:cursor-wait disabled:text-[var(--muted)]"
                  >
                    {isTableExpanding ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Show More"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={showLessOrders}
                    disabled={isTableCollapsing}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)] transition-[background-color,color,opacity] duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:cursor-default disabled:opacity-60"
                  >
                    Show Less
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
