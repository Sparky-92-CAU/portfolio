import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";

const sources = [];
const names = new Set();
for (const directory of ["website/pages", "website/shared", "website/projects"]) {
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(html|css|js)$/.test(entry.name)) continue;
    const name = basename(entry.name);
    if (names.has(name)) throw new Error(`Duplicate published filename: ${name}`);
    names.add(name);
    sources.push({ source: join(entry.parentPath, entry.name), name });
  }
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const { source, name } of sources) {
  await cp(source, join("dist", name));
}
await cp("website/assets", "dist/assets", { recursive: true });
console.log("BUILD PASS: static portfolio copied into dist; no environment variables are published.");
