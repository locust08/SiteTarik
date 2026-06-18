import { buildDashboardPayload, fetchStripeDashboardOrders } from "@/lib/dashboard-data";
import { isCmsWriteAuthorised } from "@/lib/cms-auth";
import { getStripeEnvironmentSnapshot } from "@/lib/stripe-rest";
import { logServerError } from "@/lib/server-debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCmsWriteAuthorised(request)) {
    return Response.json({ error: "Dashboard access requires CMS login." }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    const orders = await fetchStripeDashboardOrders(url.searchParams);

    return Response.json(buildDashboardPayload(orders, url.searchParams));
  } catch (error) {
    logServerError("api.dashboard.orders", "dashboard orders lookup failed", error, {
      ...getStripeEnvironmentSnapshot(),
    });

    const message = error instanceof Error ? error.message : "Unable to load dashboard data.";

    return Response.json({ error: message }, { status: 500 });
  }
}
