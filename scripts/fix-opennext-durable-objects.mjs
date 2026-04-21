import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
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
}
