import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const buildDir = path.join(projectRoot, ".open-next", ".build");
const durableObjectsDir = path.join(buildDir, "durable-objects");
const overridesDir = path.join(buildDir, "overrides");
const sourceDir = path.join(
  projectRoot,
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "api",
);

await mkdir(durableObjectsDir, { recursive: true });
await mkdir(overridesDir, { recursive: true });

console.log("[debug:cloudflare-build] preparing OpenNext patches", {
  buildDir,
  sourceDir,
});

await Promise.all(
  [
    ["durable-objects/queue.js", "durable-objects/queue.js"],
    ["durable-objects/sharded-tag-cache.js", "durable-objects/sharded-tag-cache.js"],
    ["durable-objects/bucket-cache-purge.js", "durable-objects/bucket-cache-purge.js"],
    ["overrides/internal.js", "overrides/internal.js"],
    ["cloudflare-context.js", "cloudflare-context.js"],
  ].map(([source, destination]) =>
    copyFile(path.join(sourceDir, source), path.join(buildDir, destination)),
  ),
);

const serverFunctionRoot = path.join(
  projectRoot,
  ".open-next",
  "server-functions",
  "default",
);
const nextChunksRoot = path.join(serverFunctionRoot, ".next", "server", "chunks");
const runtimeChunksRoot = path.join(serverFunctionRoot, "server", "chunks");

async function mirrorDirectory(sourceRoot, destinationRoot) {
  await mkdir(destinationRoot, { recursive: true });

  for (const entry of await readdir(sourceRoot, { withFileTypes: true })) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);

    if (entry.isDirectory()) {
      await mirrorDirectory(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

if (await stat(nextChunksRoot).catch(() => null)) {
  await mirrorDirectory(nextChunksRoot, runtimeChunksRoot);

  console.log("[debug:cloudflare-build] mirrored runtime chunks", {
    nextChunksRoot,
    runtimeChunksRoot,
  });
}

const workerPath = path.join(projectRoot, ".open-next", "worker.js");
const workerSource = await readFile(workerPath, "utf8");

if (!workerSource.includes("__sitetarikStripeFetch")) {
  const stripeHelper = String.raw`
async function __sitetarikStripeFetch(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "");

  if (
    pathname !== "/api/checkout" &&
    pathname !== "/api/stripe/verify" &&
    pathname !== "/api/stripe/receipt"
  ) {
    return null;
  }

  const secretKey = env?.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
  const siteUrl = env?.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!secretKey) {
    return Response.json(
      { error: "Missing STRIPE_SECRET_KEY. Configure it in your deployment environment before calling Stripe." },
      { status: 500 },
    );
  }

  const stripeApiRequest = async (path, { method = "GET", body } = {}) => {
    const response = await fetch("https://api.stripe.com/v1" + path, {
      method,
      headers: {
        Authorization: "Bearer " + secretKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body?.toString(),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ?? ("Stripe request failed with status " + response.status + "."),
      );
    }

    return payload;
  };

  const trimMetadataValue = (value) => value?.slice(0, 500) ?? "";
  const isValidWebsiteUrl = (value) => {
    try {
      const parsedUrl = new URL(value);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  };
  const isValidWhatsAppNumber = (value) => /^\+60\d{9,11}$/.test(value);
  const readSubmissionDetail = (submissionDetails, key) => {
    const rawValue = submissionDetails?.[key];
    return Array.isArray(rawValue) ? rawValue[0] : rawValue;
  };
  const getTimestampIso = (timestamp) => {
    if (!timestamp || !Number.isFinite(timestamp)) {
      return null;
    }

    return new Date(timestamp * 1000).toISOString();
  };

  try {
  if (pathname === "/api/checkout") {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed." }, { status: 405 });
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Invalid checkout payload." }, { status: 400 });
    }

    const selectedPackage = payload?.selectedPackage;
    if (selectedPackage !== "core" && selectedPackage !== "blog") {
      return Response.json({ error: "Please choose a valid package." }, { status: 400 });
    }

    const packageConfig = {
      core: {
        title: "Core Reborn",
        amount: 10000,
        description: "Annual core relaunch package with basic SEO and hosting handoff.",
        mode: "subscription",
      },
      blog: {
        title: "SEO Enhancement",
        amount: 22000,
        description: "One-time SEO enhancement package with 12 weekly blog releases.",
        mode: "payment",
      },
    };

    const packageDetails = packageConfig[selectedPackage];
    const baseUrl = request.headers.get("origin") || siteUrl;
    const successPath = selectedPackage === "blog" ? "/blog-brief" : "/thank-you";
    const submissionDetails = payload?.submissionDetails ?? {};
    const fullName = trimMetadataValue(payload?.fullName || readSubmissionDetail(submissionDetails, "fullName"));
    const businessName = trimMetadataValue(payload?.businessName || readSubmissionDetail(submissionDetails, "businessName"));
    const websiteUrl = trimMetadataValue(payload?.websiteUrl || readSubmissionDetail(submissionDetails, "websiteUrl"));
    const whatsappNumber = trimMetadataValue(payload?.whatsappNumber || readSubmissionDetail(submissionDetails, "whatsappNumber"));
    const whatsappConsent = payload?.whatsappConsent === true;
    const businessType = trimMetadataValue(payload?.businessType || readSubmissionDetail(submissionDetails, "businessType"));
    const targetLocation = trimMetadataValue(payload?.targetLocation || readSubmissionDetail(submissionDetails, "targetLocation"));

    if (!fullName || !businessName || !websiteUrl || !whatsappNumber || !businessType || !targetLocation) {
      return Response.json(
        { error: "Please complete every required field before checkout." },
        { status: 400 },
      );
    }

    if (!isValidWebsiteUrl(websiteUrl)) {
      return Response.json(
        { error: "Please enter a valid website link that starts with http:// or https://." },
        { status: 400 },
      );
    }

    if (!isValidWhatsAppNumber(whatsappNumber)) {
      return Response.json(
        { error: "Please enter a valid WhatsApp number in +60 format." },
        { status: 400 },
      );
    }

    if (!whatsappConsent) {
      return Response.json(
        { error: "Please agree to be contacted through WhatsApp." },
        { status: 400 },
      );
    }

    const formData = new URLSearchParams();

    formData.set("mode", packageDetails.mode);
    formData.set("allow_promotion_codes", "true");
    formData.set("success_url", baseUrl + successPath + "?checkout=success&session_id={CHECKOUT_SESSION_ID}");
    formData.set("cancel_url", baseUrl + "/#contact");
    formData.set("metadata[selectedPackage]", selectedPackage);
    formData.set("metadata[packageTitle]", packageDetails.title);
    formData.set("metadata[fullName]", fullName);
    formData.set("metadata[businessName]", businessName);
    formData.set("metadata[websiteUrl]", websiteUrl);
    formData.set("metadata[whatsappNumber]", whatsappNumber);
    formData.set("metadata[whatsappConsent]", String(whatsappConsent));
    formData.set("metadata[businessType]", businessType);
    formData.set("metadata[targetLocation]", targetLocation);
    formData.set("metadata[receiptCode]", "ST-" + selectedPackage.toUpperCase() + "-" + (crypto.randomUUID().replace(/-/g, "").slice(-8).toUpperCase() || "PENDING"));
    formData.set("line_items[0][quantity]", "1");
    formData.set("line_items[0][price_data][currency]", "myr");
    formData.set("line_items[0][price_data][unit_amount]", String(packageDetails.amount));
    formData.set("line_items[0][price_data][product_data][name]", packageDetails.title);
    formData.set("line_items[0][price_data][product_data][description]", packageDetails.description);

    if (packageDetails.mode === "subscription") {
      formData.set("line_items[0][price_data][recurring][interval]", "year");
    }

    const checkoutSession = await stripeApiRequest("/checkout/sessions", {
      method: "POST",
      body: formData,
    });

    if (!checkoutSession.url) {
      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return Response.json({
      url: checkoutSession.url,
      id: checkoutSession.id,
    });
  }

  const getStringParam = (value) => {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  };

  const sessionId = getStringParam(url.searchParams.get("session_id") ?? undefined);
  if (!sessionId) {
    return Response.json({ error: "Missing Stripe session id." }, { status: 400 });
  }

  if (pathname === "/api/stripe/verify") {
    const session = await stripeApiRequest("/checkout/sessions/" + encodeURIComponent(sessionId));
    const metadata = session?.metadata ?? {};
    const selectedPackage = trimMetadataValue(metadata.selectedPackage);
    const isPaid =
      session?.status === "complete" &&
      session?.payment_status === "paid" &&
      (selectedPackage === "blog" || selectedPackage === "core");
    const order = {
      selectedPackage,
      packageTitle: trimMetadataValue(metadata.packageTitle),
      fullName: trimMetadataValue(metadata.fullName),
      businessName: trimMetadataValue(metadata.businessName),
      websiteUrl: trimMetadataValue(metadata.websiteUrl),
      whatsappNumber: trimMetadataValue(metadata.whatsappNumber),
      whatsappConsent: trimMetadataValue(metadata.whatsappConsent),
      businessType: trimMetadataValue(metadata.businessType),
      targetLocation: trimMetadataValue(metadata.targetLocation),
      receiptCode: trimMetadataValue(metadata.receiptCode),
    };
    const blog = {
      mainGoal: trimMetadataValue(metadata.mainGoal),
      primaryKeyword: trimMetadataValue(metadata.primaryKeyword),
      secondaryKeywords: trimMetadataValue(metadata.secondaryKeywords),
      toneOfWriting: trimMetadataValue(metadata.toneOfWriting),
      audienceShort: trimMetadataValue(metadata.audienceShort),
      blogTopicIdeas: trimMetadataValue(metadata.blogTopicIdeas),
      ctaText: trimMetadataValue(metadata.ctaText),
      pagesToPush: trimMetadataValue(metadata.pagesToPush),
      additionalNotes: trimMetadataValue(metadata.additionalNotes),
    };
    const paidAtIso =
      session?.mode === "payment"
        ? await (async () => {
            const paymentIntentId =
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

            if (!paymentIntentId) {
              return null;
            }

            const paymentIntent = await stripeApiRequest(
              "/payment_intents/" + encodeURIComponent(paymentIntentId) + "?expand[]=latest_charge",
            );
            const latestCharge =
              paymentIntent?.latest_charge && typeof paymentIntent.latest_charge !== "string"
                ? paymentIntent.latest_charge
                : null;

            return getTimestampIso(latestCharge?.created ?? paymentIntent?.created ?? null);
          })()
        : session?.mode === "subscription"
          ? await (async () => {
              const subscriptionId =
                typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

              if (!subscriptionId) {
                return null;
              }

              const subscription = await stripeApiRequest(
                "/subscriptions/" + encodeURIComponent(subscriptionId) + "?expand[]=latest_invoice",
              );
              const latestInvoice =
                subscription?.latest_invoice && typeof subscription.latest_invoice !== "string"
                  ? subscription.latest_invoice
                  : null;

              return getTimestampIso(latestInvoice?.created ?? subscription?.created ?? null);
            })()
          : null;

    return Response.json({
      isPaid,
      mode: session?.mode,
      paymentStatus: session?.payment_status,
      sessionStatus: session?.status,
      selectedPackage,
      receiptCode: order.receiptCode,
      paidAtIso,
      order,
      blog,
    });
  }

  const session = await stripeApiRequest("/checkout/sessions/" + encodeURIComponent(sessionId));

  if (session?.mode === "payment") {
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const paymentIntent = await stripeApiRequest("/payment_intents/" + encodeURIComponent(paymentIntentId) + "?expand[]=latest_charge");
      const latestCharge = paymentIntent?.latest_charge;

      if (latestCharge && typeof latestCharge !== "string" && latestCharge.receipt_url) {
        return Response.json({ receiptUrl: latestCharge.receipt_url });
      }
    }
  }

  if (session?.mode === "subscription") {
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await stripeApiRequest("/subscriptions/" + encodeURIComponent(subscriptionId) + "?expand[]=latest_invoice");
      const latestInvoice = subscription?.latest_invoice;

      if (latestInvoice && typeof latestInvoice !== "string") {
        if (latestInvoice.hosted_invoice_url) {
          return Response.json({ receiptUrl: latestInvoice.hosted_invoice_url });
        }

        if (latestInvoice.invoice_pdf) {
          return Response.json({ receiptUrl: latestInvoice.invoice_pdf });
        }
      }
    }
  }

  return Response.json(
    { error: "Stripe receipt could not be resolved for this payment." },
    { status: 404 },
  );
  } catch (error) {
    console.error("[debug:sitetarik-stripe] direct route failed", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process the Stripe request.",
      },
      { status: 500 },
    );
  }
}
`;

  const patchedWorker = workerSource
    .replace("export default {", `${stripeHelper}\nexport default {`)
    .replace(
      "const url = new URL(request.url);\n            // Serve images in development.",
      `const url = new URL(request.url);
            const directStripeResponse = await __sitetarikStripeFetch(request, env);
            if (directStripeResponse) {
                return directStripeResponse;
            }
            // Serve images in development.`,
    );

  await writeFile(workerPath, patchedWorker, "utf8");
  console.log("[debug:cloudflare-build] patched worker with direct Stripe routes", {
    workerPath,
  });
}
