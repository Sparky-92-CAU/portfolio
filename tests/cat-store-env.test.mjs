import test from "node:test";
import assert from "node:assert/strict";
import { catStoreEnvironment } from "../scripts/cat-store-env.mjs";

const neon = {
  DATABASE_URL: "postgresql://user%40test:pass%23word@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  DATABASE_URL_UNPOOLED: "postgresql://user%40test:pass%23word@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require",
};
const local = { JWT_SECRET: "test-secret", ADMIN_EMAIL: "admin@example.test", ADMIN_PASSWORD: "test-password", SPRING_DATASOURCE_URL: "jdbc:postgresql://database/local" };

test("Neon is used only by the cat-store Java child, preserving credentials and separating migrations", () => {
  const result = catStoreEnvironment(neon, local, { JWT_SECRET: "existing-secret" });
  assert.equal(result.SPRING_PROFILES_ACTIVE, "neon");
  assert.equal(result.SPRING_DATASOURCE_USERNAME, "user@test");
  assert.equal(result.SPRING_DATASOURCE_PASSWORD, "pass#word");
  assert.equal(result.SPRING_DATASOURCE_URL, "jdbc:postgresql://ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory");
  assert.equal(result.SPRING_FLYWAY_URL, "jdbc:postgresql://ep-example.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory");
  assert.equal(result.JWT_SECRET, "existing-secret");
  assert.equal(result.ADMIN_PASSWORD, local.ADMIN_PASSWORD);
  assert.ok(result.CORS_ALLOWED_ORIGINS.includes("http://127.0.0.1:3000"));
  assert.equal(local.SPRING_DATASOURCE_URL, "jdbc:postgresql://database/local");
});

test("missing connection URLs, credentials and a pooled migration URL fail explicitly", () => {
  assert.throws(() => catStoreEnvironment({}, local), /DATABASE_URL is required/);
  assert.throws(() => catStoreEnvironment({ ...neon, DATABASE_URL_UNPOOLED: neon.DATABASE_URL }, local), /non-pooled host/);
  assert.throws(() => catStoreEnvironment(neon, {}), /JWT_SECRET is required/);
  assert.throws(() => catStoreEnvironment({ ...neon, DATABASE_URL: "https://example.com" }, local), /PostgreSQL connection URL/);
});
