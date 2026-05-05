import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const statePath = path.resolve("output", "stripe-alert-state.json");

async function readState() {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      sentEventKeys: Array.isArray(parsed.sentEventKeys) ? parsed.sentEventKeys : [],
    };
  } catch {
    return {
      sentEventKeys: [],
    };
  }
}

async function main() {
  const eventKeys = process.argv.slice(2).filter(Boolean);

  if (eventKeys.length === 0) {
    throw new Error("Usage: node scripts/ack-stripe-alerts.mjs <event-key> [event-key...]");
  }

  const state = await readState();
  const sentEventKeys = new Set(state.sentEventKeys);

  for (const eventKey of eventKeys) {
    sentEventKeys.add(eventKey);
  }

  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        sentEventKeys: [...sentEventKeys].sort(),
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Acknowledged ${eventKeys.length} Stripe alert(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
