import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";

test("running Neon-backed cat store serves catalog and preserves existing admin authentication", { timeout: 30000 }, async () => {
  const file = "cat-store-api/.env";
  const local = { ...(existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {}), ...process.env };
  assert.ok(local.ADMIN_EMAIL && local.ADMIN_PASSWORD, "Configure existing cat-store admin credentials before running the live check.");
  const base = `http://127.0.0.1:${local.PORT || "8081"}`;
  const request = (path, options = {}) => fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) });
  const catalog = await request("/api/cats");
  assert.equal(catalog.status, 200);
  const cats = await catalog.json();
  assert.ok(Array.isArray(cats));
  assert.ok(cats.length >= 3, "Expected the fictional catalog seeded by Flyway.");
  assert.equal((await request("/api/admin/cats")).status, 401);
  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: local.ADMIN_EMAIL, password: local.ADMIN_PASSWORD, accountType: "ADMIN" }),
  });
  assert.equal(login.status, 200);
  const account = await login.json();
  assert.equal(account.user.role, "ADMIN");
  const inventory = await request("/api/admin/cats", {
    headers: { Authorization: `Bearer ${account.accessToken}`, Origin: "http://127.0.0.1:3000" },
  });
  assert.equal(inventory.status, 200);
  assert.equal(inventory.headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:3000");
  assert.ok((await inventory.json()).length >= cats.length);
  console.log("PASS live cat store: database catalog, existing admin login, authorized inventory, unauthorized rejection and local browser CORS.");
});
