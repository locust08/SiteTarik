import { stripeApiRequest } from "@/lib/stripe-rest";

export type DashboardOrder = {
  id: string;
  created: number;
  createdIso: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  businessType: string;
  selectedPackage: "core" | "blog" | "unknown";
  packageTitle: string;
  amountTotal: number;
  currency: string;
  receiptCode: string;
  websiteUrl: string;
  whatsappNumber: string;
};

export type DashboardBreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

export type DashboardSummary = {
  totalCustomers: number;
  uniqueEmails: number;
  totalRevenue: number;
  currency: string;
  packageBreakdown: DashboardBreakdownItem[];
  businessTypeBreakdown: DashboardBreakdownItem[];
};

export type DashboardPayload = {
  orders: DashboardOrder[];
  summary: DashboardSummary;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
};

type StripeCheckoutSession = {
  id: string;
  created: number;
  amount_total?: number | null;
  currency?: string | null;
  status?: string;
  payment_status?: string;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, string | undefined> | null;
};

type StripeListResponse<T> = {
  data: T[];
  has_more: boolean;
};

const packageLabels: Record<DashboardOrder["selectedPackage"], string> = {
  core: "Core Reborn",
  blog: "SEO Enhancement",
  unknown: "Unknown Package",
};

function trimValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeSelectedPackage(value: string | null | undefined): DashboardOrder["selectedPackage"] {
  const normalized = trimValue(value).toLowerCase();

  if (normalized === "core") {
    return "core";
  }

  if (normalized === "blog") {
    return "blog";
  }

  return "unknown";
}

function toDayStartUnix(date: string) {
  return Math.floor(new Date(`${date}T00:00:00.000Z`).getTime() / 1000);
}

function toDayEndUnix(date: string) {
  return Math.floor(new Date(`${date}T23:59:59.999Z`).getTime() / 1000);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function getMetadataValue(metadata: Record<string, string | undefined>, ...keys: string[]) {
  for (const key of keys) {
    const value = trimValue(metadata[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function buildBreakdown(values: string[], fallbackLabel: string): DashboardBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = trimValue(value) || fallbackLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = values.length || 1;

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function mapSessionToOrder(session: StripeCheckoutSession): DashboardOrder {
  const metadata = session.metadata ?? {};
  const selectedPackage = normalizeSelectedPackage(
    getMetadataValue(metadata, "selectedPackage", "order_selectedPackage"),
  );
  const customerName =
    getMetadataValue(metadata, "fullName", "order_fullName") ||
    trimValue(session.customer_details?.name) ||
    "Unknown customer";
  const customerEmail =
    trimValue(session.customer_details?.email) ||
    trimValue(session.customer_email) ||
    "No email";

  return {
    id: session.id,
    created: session.created,
    createdIso: new Date(session.created * 1000).toISOString(),
    customerName,
    customerEmail,
    businessName: getMetadataValue(metadata, "businessName", "order_businessName") || "Not provided",
    businessType: getMetadataValue(metadata, "businessType", "order_businessType") || "Not specified",
    selectedPackage,
    packageTitle:
      getMetadataValue(metadata, "packageTitle", "order_packageTitle") || packageLabels[selectedPackage],
    amountTotal: session.amount_total ?? 0,
    currency: (session.currency ?? "myr").toUpperCase(),
    receiptCode: getMetadataValue(metadata, "receiptCode", "order_receiptCode") || session.id,
    websiteUrl: getMetadataValue(metadata, "websiteUrl", "order_websiteUrl"),
    whatsappNumber: getMetadataValue(metadata, "whatsappNumber", "order_whatsappNumber"),
  };
}

export function normalizeDashboardDateRange(searchParams: URLSearchParams) {
  const startDate = trimValue(searchParams.get("startDate"));
  const endDate = trimValue(searchParams.get("endDate"));

  return {
    startDate: isIsoDate(startDate) ? startDate : "",
    endDate: isIsoDate(endDate) ? endDate : "",
  };
}

export async function fetchStripeDashboardOrders(searchParams: URLSearchParams) {
  const { startDate, endDate } = normalizeDashboardDateRange(searchParams);
  const allSessions: StripeCheckoutSession[] = [];
  let startingAfter = "";

  do {
    const params = new URLSearchParams({
      limit: "100",
      status: "complete",
    });

    if (startDate) {
      params.set("created[gte]", String(toDayStartUnix(startDate)));
    }

    if (endDate) {
      params.set("created[lte]", String(toDayEndUnix(endDate)));
    }

    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const page = await stripeApiRequest<StripeListResponse<StripeCheckoutSession>>(
      `/checkout/sessions?${params.toString()}`,
    );

    allSessions.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id ?? "" : "";
  } while (startingAfter && allSessions.length < 1000);

  return allSessions
    .filter((session) => session.payment_status === "paid")
    .map(mapSessionToOrder)
    .sort((a, b) => b.created - a.created);
}

export function buildDashboardPayload(
  orders: DashboardOrder[],
  searchParams: URLSearchParams,
): DashboardPayload {
  const { startDate, endDate } = normalizeDashboardDateRange(searchParams);
  const currency = orders[0]?.currency ?? "MYR";
  const uniqueEmails = new Set(
    orders
      .map((order) => order.customerEmail.toLowerCase())
      .filter((email) => email && email !== "no email"),
  );

  return {
    orders,
    summary: {
      totalCustomers: orders.length,
      uniqueEmails: uniqueEmails.size,
      totalRevenue: orders.reduce((sum, order) => sum + order.amountTotal, 0),
      currency,
      packageBreakdown: buildBreakdown(
        orders.map((order) => packageLabels[order.selectedPackage]),
        "Unknown Package",
      ),
      businessTypeBreakdown: buildBreakdown(
        orders.map((order) => order.businessType),
        "Not specified",
      ),
    },
    dateRange: {
      startDate,
      endDate,
    },
    generatedAt: new Date().toISOString(),
  };
}
