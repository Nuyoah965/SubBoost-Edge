import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const UPSTREAM_COMMIT = "ebc40a202adeaca25c88ca3bbbf085412f6e08f5";
const archiveName = "subboost-edge-source.tar.gz";
const edgeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(edgeRoot, "..");
const archivePath = path.join(edgeRoot, "public", archiveName);
const archiveRelativePath = path.relative(repositoryRoot, archivePath).replaceAll(path.sep, "/");

const excludedDirectories = new Set([
  ".git",
  ".next",
  ".wrangler",
  ".turbo",
  ".codegraph",
  "node_modules",
  "out",
  "dist",
  "coverage",
  ".tmp",
  "tmp",
  "data",
]);

function shouldExcludeFile(relativePath) {
  const name = path.posix.basename(relativePath);
  if (relativePath === archiveRelativePath) return true;
  if (name === "next-env.d.ts" || name === ".DS_Store") return true;
  if (name.endsWith(".tsbuildinfo") || name.endsWith(".pem")) return true;
  if (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) return true;
  if (name === ".dev.vars" || (name.startsWith(".dev.vars.") && name !== ".dev.vars.example")) return true;
  return /^(npm|yarn)-debug\.log/.test(name) || name === "yarn-error.log";
}

async function collectSourceFiles(directory = repositoryRoot) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(repositoryRoot, absolutePath).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
    } else if (entry.isFile() && !shouldExcludeFile(relativePath)) {
      files.push({ absolutePath, relativePath: `subboost-edge-source/${relativePath}` });
    }
  }

  return files;
}

function writeString(buffer, offset, length, value) {
  const encoded = Buffer.from(value, "utf8");
  if (encoded.length > length) throw new Error(`Tar field is too long: ${value}`);
  encoded.copy(buffer, offset);
}

function writeOctal(buffer, offset, length, value) {
  const encoded = value.toString(8).padStart(length - 1, "0") + "\0";
  writeString(buffer, offset, length, encoded);
}

function splitTarPath(relativePath) {
  if (Buffer.byteLength(relativePath) <= 100) return { name: relativePath, prefix: "" };

  for (let index = relativePath.lastIndexOf("/"); index > 0; index = relativePath.lastIndexOf("/", index - 1)) {
    const prefix = relativePath.slice(0, index);
    const name = relativePath.slice(index + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) return { name, prefix };
  }

  throw new Error(`Path cannot be represented in a ustar archive: ${relativePath}`);
}

function createTarEntry(relativePath, content, mode = 0o644) {
  const header = Buffer.alloc(512);
  const { name, prefix } = splitTarPath(relativePath);

  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, content.length);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  writeString(header, 257, 6, "ustar\0");
  writeString(header, 263, 2, "00");
  writeString(header, 265, 32, "root");
  writeString(header, 297, 32, "root");
  writeString(header, 345, 155, prefix);

  const checksum = header.reduce((sum, byte) => sum + byte, 0).toString(8).padStart(6, "0");
  writeString(header, 148, 8, `${checksum}\0 `);

  const padding = Buffer.alloc((512 - (content.length % 512)) % 512);
  return [header, content, padding];
}

async function buildArchive() {
  const files = await collectSourceFiles();
  const manifest = Buffer.from(
    [
      "EdgeSub complete corresponding source",
      "",
      "License: AGPL-3.0-only",
      "Upstream: https://github.com/SubBoost/subboost",
      `Upstream commit: ${UPSTREAM_COMMIT}`,
      "",
      "Build: npm ci && npm run edge:build",
      "Deploy: npm run edge:deploy",
      "",
    ].join("\n"),
    "utf8"
  );
  const chunks = createTarEntry("subboost-edge-source/SOURCE_INFO.txt", manifest);

  for (const file of files) {
    const content = await readFile(file.absolutePath);
    const executable = /\.(?:sh|cjs)$/.test(file.relativePath);
    chunks.push(...createTarEntry(file.relativePath, content, executable ? 0o755 : 0o644));
  }

  chunks.push(Buffer.alloc(1024));
  await mkdir(path.dirname(archivePath), { recursive: true });
  await writeFile(archivePath, gzipSync(Buffer.concat(chunks), { level: 9 }));
  console.log(`Created ${archiveRelativePath} with ${files.length + 1} source files`);
}

await buildArchive();
