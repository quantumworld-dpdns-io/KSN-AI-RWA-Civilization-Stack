import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const importPattern =
  /(from\s+["'])(\.\.?\/[^"']+)(["'])|(import\s*\(\s*["'])(\.\.?\/[^"']+)(["'])/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveRelativeImport(filePath, relativePath) {
  if (relativePath.endsWith(".js")) {
    return relativePath;
  }

  const fileDir = path.dirname(filePath);
  const candidateFile = path.resolve(fileDir, `${relativePath}.js`);
  if (existsSync(candidateFile)) {
    const resolved = `${relativePath}.js`;
    return resolved.startsWith(".") ? resolved : `./${resolved}`;
  }

  const candidateIndex = path.resolve(fileDir, relativePath, "index.js");
  if (existsSync(candidateIndex)) {
    const resolved = `${relativePath}/index.js`;
    return resolved.startsWith(".") ? resolved : `./${resolved}`;
  }

  return `${relativePath}.js`;
}

function fixImports(filePath, source) {
  return source.replace(importPattern, (match, fromPrefix, fromPath, fromSuffix, importPrefix, importPath, importSuffix) => {
    const prefix = fromPrefix ?? importPrefix;
    const relativePath = fromPath ?? importPath;
    const suffix = fromSuffix ?? importSuffix;
    const resolved = resolveRelativeImport(filePath, relativePath);

    if (resolved === relativePath) {
      return match;
    }

    return `${prefix}${resolved}${suffix}`;
  });
}

async function fixDirectory(dir) {
  const files = await walk(dir);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const updated = fixImports(file, source);

    if (updated !== source) {
      await writeFile(file, updated, "utf8");
    }
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");

for (const target of process.argv.slice(2)) {
  await fixDirectory(path.resolve(repoRoot, target));
}
