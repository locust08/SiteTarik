import { access } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const requiredPaths = [
  ".open-next/worker.js",
  ".open-next/assets",
  ".open-next/.build/durable-objects/queue.js",
  ".open-next/.build/durable-objects/sharded-tag-cache.js",
  ".open-next/.build/durable-objects/bucket-cache-purge.js",
];

for (const relativePath of requiredPaths) {
  const absolutePath = path.join(projectRoot, relativePath);
  await access(absolutePath).catch(() => {
    throw new Error(`Missing Cloudflare build output: ${relativePath}`);
  });
}

const chunkRoots = [
  ".open-next/server-functions/default/server/chunks/ssr",
  ".open-next/server-functions/default/server/chunks",
];

let foundChunkRoot = null;

for (const relativePath of chunkRoots) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    await access(absolutePath);
    foundChunkRoot = relativePath;
    break;
  } catch {
    // Keep checking the next build layout.
  }
}

if (!foundChunkRoot) {
  throw new Error(
    `Missing Cloudflare build output: one of ${chunkRoots.join(", ")}`,
  );
}

console.log("[debug:cloudflare-build] verified OpenNext output", {
  outputDirectory: ".open-next/assets",
  workerEntry: ".open-next/worker.js",
  validatedPaths: requiredPaths,
  validatedChunkRoot: foundChunkRoot,
});
