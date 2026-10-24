import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { catStoreEnvironment } from "./cat-store-env.mjs";

const root = resolve(import.meta.dirname, "..");
function readEnvironment(file) {
  if (!existsSync(file)) {
    return {};
  }
  return parseEnv(readFileSync(file, "utf8"));
}
const neonFile = resolve(root, existsSync(resolve(root, ".env")) ? ".env" : ".env.local");
const neon = { ...readEnvironment(neonFile), ...process.env };
const local = readEnvironment(resolve(root, "cat-store-api", ".env"));
const environment = catStoreEnvironment(neon, local, process.env);
const jar = resolve(root, "cat-store-api", "target", "cat-store-api-0.1.0.jar");
if (!existsSync(jar)) throw new Error("Build the API first: cd cat-store-api; .\\mvnw.cmd package");
console.log("Starting cat store with Neon Postgres (pooled application connection, direct Flyway connection, cat_store schema).");
const child = spawn("java", ["-jar", jar], { cwd: resolve(root, "cat-store-api"), env: environment, stdio: "inherit" });
child.on("error", (error) => { console.error(`Could not start cat-store API: ${error.message}`); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
