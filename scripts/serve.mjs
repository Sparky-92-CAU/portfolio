import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".pdf": "application/pdf" };
const server = createServer(async (request, response) => {
  let path;
  try {
    path = resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  if (path === root) path = resolve(root, "index.html");
  if (!path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" }).end(body);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "EISDIR") {
      console.error("Static server failed", error.code);
      response.writeHead(500).end("Server error");
      return;
    }
    response.writeHead(404).end("Not found");
  }
});
server.listen(3000, "127.0.0.1", () => console.log("Portfolio listening at http://127.0.0.1:3000"));
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
