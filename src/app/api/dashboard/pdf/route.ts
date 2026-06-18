import fontkit from "@pdf-lib/fontkit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from "pdf-lib";
import type { DashboardOrder, DashboardPayload } from "@/lib/dashboard-data";
import { buildDashboardPayload, fetchStripeDashboardOrders } from "@/lib/dashboard-data";
import { isCmsWriteAuthorised } from "@/lib/cms-auth";
import { getStripeEnvironmentSnapshot } from "@/lib/stripe-rest";
import { logServerError } from "@/lib/server-debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pageWidth = 595;
const pageHeight = 842;
const margin = 38;
const red = rgb(0.933, 0.125, 0.157);
const ink = rgb(0.067, 0.067, 0.067);
const muted = rgb(0.39, 0.39, 0.39);
const border = rgb(0.88, 0.88, 0.88);
const softRed = rgb(0.996, 0.9, 0.91);
const surface = rgb(0.975, 0.975, 0.975);
const white = rgb(1, 1, 1);

type RevenueItem = {
  label: string;
  count: number;
  revenue: number;
};

type TextOptions = {
  size?: number;
  color?: ReturnType<typeof rgb>;
  maxWidth?: number;
};

function safeText(value: string, limit = 100) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function money(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function printedAtLabel(payload: DashboardPayload) {
  return `Printed at ${formatDateTime(payload.generatedAt)}`;
}

function formatDateRange(payload: DashboardPayload) {
  return `${payload.dateRange.startDate || "All time"} to ${payload.dateRange.endDate || "Today"}`;
}

function formatFilenameDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildReportFilename(payload: DashboardPayload) {
  const { startDate, endDate } = payload.dateRange;
  const today = formatFilenameDate();

  if (startDate || endDate) {
    return `sitetarik-dashboard_${startDate || "all-time"}_${endDate || today}.pdf`;
  }

  return `sitetarik-dashboard_all-time_${today}.pdf`;
}

function wrapText(text: string, maxChars: number) {
  const words = safeText(text, 260).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function buildPackageRevenue(orders: DashboardOrder[]) {
  const revenueMap = new Map<string, RevenueItem>();

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
}

async function fetchAssetBytes(origin: string, pathname: string) {
  let response: Response | null = null;

  try {
    const context = await getCloudflareContext({ async: true });
    const assets = (context.env as { ASSETS?: { fetch: typeof fetch } }).ASSETS;
    response = assets ? await assets.fetch(new Request(new URL(pathname, origin))) : null;
  } catch {
    response = null;
  }

  response ??= await fetch(new URL(pathname, origin), {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Unable to load PDF asset: ${pathname}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function loadManropeFont(pdf: PDFDocument, origin: string) {
  const fontBytes = await fetchAssetBytes(origin, "/fonts/manrope/Manrope-Regular.ttf");
  pdf.registerFontkit(fontkit);
  return pdf.embedFont(fontBytes, { subset: true });
}

async function loadSiteTarikLogo(pdf: PDFDocument, origin: string) {
  const logoBytes = await fetchAssetBytes(origin, "/icon.png");
  return pdf.embedPng(logoBytes);
}

class ReportPdf {
  private pdf!: PDFDocument;
  private page!: PDFPage;
  private pages: PDFPage[] = [];
  private y = pageHeight - margin;
  private payload!: DashboardPayload;
  private font!: PDFFont;
  private logo!: PDFImage;

  static async create(payload: DashboardPayload, origin: string) {
    const pdf = await PDFDocument.create();
    const font = await loadManropeFont(pdf, origin);
    const logo = await loadSiteTarikLogo(pdf, origin);
    const report = Object.create(ReportPdf.prototype) as ReportPdf;
    report.payload = payload;
    report.font = font;
    report.logo = logo;
    report.pdf = pdf;
    report.pages = [];
    report.page = report.addPage();
    return report;
  }

  private addPage() {
    const page = this.pdf.addPage([pageWidth, pageHeight]);
    this.pages.push(page);
    this.page = page;
    this.y = pageHeight - margin;
    return page;
  }

  private text(value: string, x: number, y: number, options: TextOptions = {}) {
    this.page.drawText(value, {
      x,
      y,
      size: options.size ?? 10,
      font: this.font,
      color: options.color ?? ink,
      maxWidth: options.maxWidth,
    });
  }

  private rect(x: number, y: number, width: number, height: number, color: ReturnType<typeof rgb>, borderColor?: ReturnType<typeof rgb>) {
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      color,
      borderColor,
      borderWidth: borderColor ? 1 : 0,
    });
  }

  private line(x1: number, y1: number, x2: number, y2: number, color = border) {
    this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1, color });
  }

  private ensureSpace(height: number) {
    if (this.y - height < 64) {
      this.addPage();
      this.drawHeader(false);
      this.y -= 18;
    }
  }

  private label(value: string, x: number, y: number) {
    this.text(value.toUpperCase(), x, y, { size: 7.5, color: red });
  }

  private drawHeader(isCover: boolean) {
    this.page.drawImage(this.logo, {
      x: margin,
      y: this.y - 21,
      width: 30,
      height: 30,
    });
    this.text("SiteTarik", margin + 36, this.y - 4, { size: 18, color: ink });
    this.text("Stripe Customer Report", margin + 36, this.y - 19, { size: 8, color: muted });
    this.text(formatDateRange(this.payload), 388, this.y - 7, { size: 9, color: ink });
    this.text(printedAtLabel(this.payload), 388, this.y - 21, { size: 7, color: muted });
    this.line(margin, this.y - 34, pageWidth - margin, this.y - 34);
    this.y -= isCover ? 70 : 54;
  }

  private drawKpiCard(label: string, value: string, x: number, width: number) {
    this.rect(x, this.y - 64, width, 64, surface, border);
    this.label(label, x + 12, this.y - 18);
    this.text(value, x + 12, this.y - 46, { size: 17, color: ink, maxWidth: width - 24 });
  }

  private drawListSection(
    title: string,
    subtitle: string,
    items: Array<{ label: string; value: string; meta?: string }>,
    x: number,
    width: number,
    sectionHeight = 180,
  ) {
    this.rect(x, this.y - sectionHeight, width, sectionHeight, white, border);
    this.label(subtitle, x + 12, this.y - 18);
    this.text(title, x + 12, this.y - 43, { size: 16, color: ink });

    let rowY = this.y - 72;
    const rows = items.slice(0, 6);
    const hasMeta = rows.some((item) => item.meta);
    const rowStep = hasMeta ? 34 : 22;

    if (!rows.length) {
      this.text("No data found for this date range.", x + 12, rowY, { size: 9, color: muted });
      return;
    }

    for (const item of rows) {
      this.line(x + 12, rowY + 11, x + width - 12, rowY + 11, rgb(0.93, 0.93, 0.93));
      this.text(safeText(item.label, 32), x + 12, rowY - 2, { size: 9, color: ink, maxWidth: width - 105 });
      this.text(item.value, x + width - 88, rowY - 2, { size: 9, color: red, maxWidth: 78 });
      if (item.meta) {
        this.text(item.meta, x + 12, rowY - 18, { size: 7, color: muted });
      }
      rowY -= rowStep;
    }
  }

  private drawSummary() {
    const { summary } = this.payload;
    const gap = 12;
    const cardWidth = (pageWidth - margin * 2 - gap * 2) / 3;
    this.drawKpiCard("Paid Customers", String(summary.totalCustomers), margin, cardWidth);
    this.drawKpiCard("Unique Emails", String(summary.uniqueEmails), margin + cardWidth + gap, cardWidth);
    this.drawKpiCard("Paid Revenue", money(summary.totalRevenue, summary.currency), margin + (cardWidth + gap) * 2, cardWidth);
    this.y -= 88;

    const sectionWidth = (pageWidth - margin * 2 - gap) / 2;
    this.drawListSection(
      "Package Mix",
      "Services Bought",
      summary.packageBreakdown.map((item) => ({ label: item.label, value: `${item.count} (${item.percentage}%)` })),
      margin,
      sectionWidth,
    );
    this.drawListSection(
      "Segment Leaders",
      "Business Types",
      summary.businessTypeBreakdown.map((item) => ({ label: item.label, value: `${item.count} (${item.percentage}%)` })),
      margin + sectionWidth + gap,
      sectionWidth,
    );
    this.y -= 204;

    this.ensureSpace(230);
    this.drawListSection(
      "Package Value",
      "Revenue by Package",
      buildPackageRevenue(this.payload.orders).map((item) => ({
        label: item.label,
        value: money(item.revenue, this.payload.summary.currency),
        meta: `${item.count} paid customers`,
      })),
      margin,
      pageWidth - margin * 2,
      220,
    );
    this.y -= 244;
  }

  private drawTransactionHeader() {
    this.ensureSpace(70);
    this.label("Transactions", margin, this.y);
    this.text("Paid Stripe Sessions", margin, this.y - 24, { size: 18, color: ink });
    this.text(`${this.payload.orders.length} transactions in selected date range`, 370, this.y - 18, {
      size: 8,
      color: muted,
    });
    this.y -= 44;
    this.rect(margin, this.y - 22, pageWidth - margin * 2, 22, softRed);
    this.text("Date", margin + 8, this.y - 14, { size: 7, color: red });
    this.text("Customer", 98, this.y - 14, { size: 7, color: red });
    this.text("Business", 215, this.y - 14, { size: 7, color: red });
    this.text("Type", 325, this.y - 14, { size: 7, color: red });
    this.text("Package", 405, this.y - 14, { size: 7, color: red });
    this.text("Amount", 505, this.y - 14, { size: 7, color: red });
    this.y -= 30;
  }

  private drawTransaction(order: DashboardOrder, index: number) {
    this.ensureSpace(42);

    if (this.y > pageHeight - margin - 80 || this.y < 92) {
      this.drawTransactionHeader();
    }

    const rowHeight = 38;

    if (index % 2 === 0) {
      this.rect(margin, this.y - rowHeight + 8, pageWidth - margin * 2, rowHeight, surface);
    }

    this.line(margin, this.y + 8, pageWidth - margin, this.y + 8, rgb(0.92, 0.92, 0.92));
    this.text(formatDate(order.createdIso), margin + 8, this.y - 7, { size: 7, color: ink });
    this.text(wrapText(order.customerName, 22)[0], 98, this.y - 4, { size: 8, color: ink, maxWidth: 106 });
    this.text(safeText(order.customerEmail, 28), 98, this.y - 17, { size: 6.5, color: muted, maxWidth: 106 });
    this.text(safeText(order.businessName, 20), 215, this.y - 4, { size: 8, color: ink, maxWidth: 98 });
    this.text(safeText(order.websiteUrl, 25), 215, this.y - 17, { size: 6.5, color: red, maxWidth: 98 });
    this.text(safeText(order.businessType, 17), 325, this.y - 7, { size: 7.5, color: ink, maxWidth: 72 });
    this.text(safeText(order.packageTitle, 18), 405, this.y - 7, { size: 7.5, color: red, maxWidth: 92 });
    this.text(safeText(order.receiptCode, 28), 405, this.y - 21, { size: 6.2, color: muted, maxWidth: 92 });
    this.text(money(order.amountTotal, order.currency), 505, this.y - 7, { size: 7.5, color: ink, maxWidth: 54 });
    this.y -= rowHeight;
  }

  private drawFooters() {
    this.pages.forEach((page, index) => {
      page.drawLine({ start: { x: margin, y: 42 }, end: { x: pageWidth - margin, y: 42 }, thickness: 1, color: border });
      page.drawText("SiteTarik internal report", { x: margin, y: 26, size: 7, font: this.font, color: muted });
      page.drawText(printedAtLabel(this.payload), { x: 198, y: 26, size: 7, font: this.font, color: muted });
      page.drawText(`Page ${index + 1} of ${this.pages.length}`, { x: pageWidth - 88, y: 26, size: 7, font: this.font, color: muted });
    });
  }

  async build() {
    this.drawHeader(true);
    this.label("Customer Dashboard", margin, this.y);
    this.text("Paid Customer Overview", margin, this.y - 32, { size: 30, color: ink });
    this.text("A performance view of paid Stripe sessions, services bought, business segments, and revenue.", margin, this.y - 52, {
      size: 10,
      color: muted,
      maxWidth: pageWidth - margin * 2,
    });
    this.y -= 92;
    this.drawSummary();
    this.drawTransactionHeader();

    if (this.payload.orders.length) {
      this.payload.orders.forEach((order, index) => this.drawTransaction(order, index));
    } else {
      this.text("No paid Stripe checkout sessions found for this date range.", margin, this.y - 8, { size: 9, color: muted });
    }

    this.drawFooters();
    return Buffer.from(await this.pdf.save());
  }
}

async function createPdf(payload: DashboardPayload, origin: string) {
  const report = await ReportPdf.create(payload, origin);
  return report.build();
}

export async function GET(request: Request) {
  if (!isCmsWriteAuthorised(request)) {
    return Response.json({ error: "Dashboard access requires CMS login." }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    const orders = await fetchStripeDashboardOrders(url.searchParams);
    const payload = buildDashboardPayload(orders, url.searchParams);
    const pdf = await createPdf(payload, url.origin);

    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${buildReportFilename(payload)}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    logServerError("api.dashboard.pdf", "dashboard PDF failed", error, {
      ...getStripeEnvironmentSnapshot(),
    });

    const message = error instanceof Error ? error.message : "Unable to generate dashboard PDF.";

    return Response.json({ error: message }, { status: 500 });
  }
}
