import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile("website/projects/cat-store/cat-store.js", "utf8");
for (const [hostname, expectedBase] of [
  ["127.0.0.1", "http://localhost:8081"],
  ["localhost", "http://localhost:8081"],
  ["sparky-92-cau.github.io", "https://cat-store-api.onrender.com"],
]) {
  test(`cat store initializes and refreshes using the correct API on ${hostname}`, async () => {
    const elements = new Map();
    function element(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        content: "https://cat-store-api.onrender.com",
        dataset: {},
        listeners: {},
        addEventListener(name, handler) { this.listeners[name] = handler; },
        replaceChildren() {},
        append() {},
      });
      return elements.get(selector);
    }
    const calls = [];
    runInNewContext(source, {
      document: { querySelector: element, querySelectorAll: () => [], createElement: () => element("created") },
      window: { location: { hostname } },
      Headers,
      fetch: async (url) => {
        calls.push(url);
        return { ok: true, text: async () => "[]" };
      },
    });
    await new Promise(setImmediate);
    assert.deepEqual(calls, [`${expectedBase}/api/cats`]);
    assert.equal(element("#auth-panel").hidden, false);
    assert.equal(element("#account-bar").hidden, true);
    assert.equal(typeof element("#refresh-admin-data").listeners.click, "function");
    await element("#refresh-admin-data").listeners.click();
    assert.equal(calls.length, 2);
    assert.equal(element("#store-notice").textContent, "Store data refreshed.");
  });
}
