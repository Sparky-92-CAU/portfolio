export function catStoreEnvironment(neon, local, inherited = {}) {
  function databaseConnection(value, name, pooled) {
    if (!value) throw new Error(`${name} is required. Keep the Neon connection URLs in root .env.local.`);
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.username || !url.password || url.pathname === "/") {
      throw new Error(`${name} must be a complete PostgreSQL connection URL.`);
    }
    if (!pooled && url.hostname.includes("-pooler")) throw new Error(`${name} must use the direct, non-pooled host for Flyway.`);
    url.searchParams.set("sslmode", "verify-full");
    url.searchParams.set("sslfactory", "org.postgresql.ssl.DefaultJavaSSLFactory");
    return {
      url: `jdbc:postgresql://${url.host}${url.pathname}?${url.searchParams}`,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }
  const app = databaseConnection(neon.DATABASE_URL, "DATABASE_URL", true);
  const migrations = databaseConnection(neon.DATABASE_URL_UNPOOLED, "DATABASE_URL_UNPOOLED", false);
  const environment = { ...local, ...inherited };
  for (const key of ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]) {
    if (!environment[key]) throw new Error(`${key} is required in cat-store-api\\.env or the process environment.`);
  }
  const origins = new Set((environment.CORS_ALLOWED_ORIGINS || "https://sparky-92-cau.github.io").split(",").map((origin) => origin.trim()).filter(Boolean));
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"]) origins.add(origin);
  return {
    ...environment,
    SPRING_PROFILES_ACTIVE: "neon",
    SPRING_DATASOURCE_URL: app.url,
    SPRING_DATASOURCE_USERNAME: app.user,
    SPRING_DATASOURCE_PASSWORD: app.password,
    SPRING_FLYWAY_URL: migrations.url,
    SPRING_FLYWAY_USER: migrations.user,
    SPRING_FLYWAY_PASSWORD: migrations.password,
    CORS_ALLOWED_ORIGINS: [...origins].join(","),
  };
}
