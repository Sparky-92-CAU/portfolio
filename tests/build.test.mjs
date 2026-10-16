import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("static build includes portfolio only, without backend source or configuration", async () => {
  const files = await readdir("dist", { recursive: true });
  for (const page of ["index.html", "projects.html", "cat-store.html", "guitar-song-finder.html"]) {
    assert.ok(files.includes(page), `${page} is published`);
  }
  assert.ok(!files.some((file) => /(^|[/\\])\.env|\.ts$|package.*\.json$|^node_modules|^cat-store-api|^guitar-song-finder-api/.test(file)));
  assert.ok(!files.some((file) => /workspace/i.test(file)), "Removed workspace is not published");
  for (const directory of ["website/pages", "website/shared", "website/projects", "website/assets"]) {
    for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const source = join(entry.parentPath, entry.name);
      const published = directory === "website/assets"
        ? join("dist", "assets", source.slice(directory.length + 1))
        : join("dist", entry.name);
      assert.deepEqual(await readFile(published), await readFile(source), `${source} is published unchanged`);
    }
  }
});

test("static build rejects duplicate public filenames before replacing existing output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-build-test-"));
  try {
    for (const path of ["website/pages", "website/shared", "website/projects/example", "dist"]) {
      await mkdir(join(directory, path), { recursive: true });
    }
    await writeFile(join(directory, "website/pages/index.html"), "home");
    await writeFile(join(directory, "website/projects/example/index.html"), "duplicate");
    await writeFile(join(directory, "dist/index.html"), "previous build");
    await assert.rejects(
      promisify(execFile)(process.execPath, [resolve("scripts/build.mjs")], { cwd: directory }),
      /Duplicate published filename: index\.html/,
    );
    assert.equal(await readFile(join(directory, "dist/index.html"), "utf8"), "previous build");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
