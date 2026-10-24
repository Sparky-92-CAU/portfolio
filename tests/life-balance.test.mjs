import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const modelSource = await readFile("website/projects/life-balance/life-balance-model.js", "utf8");
const clientSource = await readFile("website/projects/life-balance/life-balance.js", "utf8");
const context = {};
runInNewContext(modelSource, context);
const model = context.LifeBalanceModel;
const plain = (value) => JSON.parse(JSON.stringify(value));
const ratedDraft = () => {
  const draft = plain(model.newDraft());
  draft.categories.forEach((area, index) => { area.score = index; });
  return draft;
};

test("default wheel starts unrated and new check-ins keep areas, not ratings or reflections", () => {
  const draft = model.newDraft();
  assert.deepEqual(plain(draft.categories.map((area) => area.name)), plain(model.defaults));
  assert.ok(draft.categories.every((area) => area.score === null));
  assert.ok(model.validDraft(draft));
  assert.ok(!model.validDraft(draft, true));
  draft.categories[0].name = "Chosen family";
  draft.categories[0].score = 10;
  draft.reflections.step = "Call on Saturday";
  const next = model.newDraft(draft.categories);
  assert.equal(next.categories[0].name, "Chosen family");
  assert.equal(next.categories[0].id, draft.categories[0].id);
  assert.equal(next.categories[0].score, null);
  assert.equal(next.reflections.step, "");
  next.categories[0].name = "Changed";
  assert.equal(draft.categories[0].name, "Chosen family");
});

test("wheel geometry puts 0 at center, 10 at edge, and preserves spoke order", () => {
  assert.deepEqual(plain(model.point(0, 8, 0)), { x: 320, y: 320 });
  assert.deepEqual(plain(model.point(0, 8, 10)), { x: 320, y: 130 });
  assert.deepEqual(plain(model.point(2, 8, 10)), { x: 510, y: 320 });
  assert.deepEqual(plain(model.point(4, 8, 5)), { x: 320, y: 415 });
  for (let count = 3; count <= 12; count++) {
    for (let index = 0; index < count; index++) {
      const point = model.point(index, count, 10);
      assert.ok(Math.abs(Math.hypot(point.x - 320, point.y - 320) - 190) < 1e-9);
    }
  }
});

test("stored state round-trips dates, zero scores, names and reflections without accepting malformed data", () => {
  const draft = ratedDraft();
  draft.date = "2024-02-29";
  draft.categories[0].score = 0;
  draft.reflections.values = "<script>not markup</script>";
  const state = { version: 1, draft, entries: [{ ...draft, id: "checkin-1", savedAt: "2026-10-24T10:00:00Z" }] };
  assert.deepEqual(plain(model.parseState(JSON.stringify(state))), state);
  for (const raw of ["null", "{broken", '{"version":2}', JSON.stringify({ ...state, entries: [state.entries[0], state.entries[0]] })]) {
    assert.throws(() => model.parseState(raw));
  }
  for (const date of ["2025-02-29", "2026-04-31", "0000-01-01", "2026-13-01", ""]) {
    assert.equal(model.validDate(date), false, date);
  }
  for (const score of [-1, 11, 2.5, "5", undefined]) {
    const bad = ratedDraft();
    bad.categories[0].score = score;
    assert.ok(!model.validDraft(bad, true));
  }
  for (const change of [
    (draft) => { draft.categories[0].name = " "; },
    (draft) => { draft.categories[0].name = "friends"; },
    (draft) => { draft.categories[0].id = draft.categories[1].id; },
    (draft) => { draft.categories = draft.categories.slice(0, 2); },
    (draft) => { draft.reflections.step = "x".repeat(3001); },
  ]) {
    const bad = ratedDraft();
    change(bad);
    assert.ok(!model.validDraft(bad, true));
  }
});

test("history sorts by check-in date then save time and compares areas by stable identity", () => {
  const first = { ...ratedDraft(), date: "2026-10-20", savedAt: "2026-10-24T10:00:00Z" };
  const second = { ...ratedDraft(), date: "2026-10-21", savedAt: "2026-10-23T10:00:00Z" };
  const third = { ...ratedDraft(), date: "2026-10-21", savedAt: "2026-10-24T10:00:00Z" };
  assert.deepEqual(plain(model.sortedEntries([second, first, third])), [third, second, first]);
  second.categories[0].name = "Chosen family";
  second.categories[0].score = 10;
  second.categories[1].id = "new-area";
  const deltas = model.changes(second, first);
  assert.equal(deltas[0].change, 10);
  assert.equal(deltas[1].change, null);
  assert.equal(deltas[2].change, 0);
  assert.ok(model.changes(first).every((area) => area.change === null));
});

function app({ raw = null, failWrite = false } = {}) {
  const elements = new Map();
  let nextId = 0;
  const errors = [];
  function node(tag = "div") {
    return {
      tag, children: [], attributes: {}, listeners: {}, value: "", hidden: false, disabled: false,
      textContent: "",
      set id(value) { this._id = value; elements.set(value, this); },
      get id() { return this._id; },
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      setCustomValidity(message) { this.validityMessage = message; },
      reportValidity() { return ![...elements.values()].some((el) => el.validityMessage); },
      focus() { this.focused = true; },
    };
  }
  for (const id of ["balance-warning-text", "balance-warning", "draft-status", "balance-status", "balance-wheel",
    "rated-count", "balance-categories", "add-category", "checkin-date", "reflection-balance", "reflection-values",
    "reflection-step", "balance-history", "history-empty", "clear-history", "new-checkin", "balance-form",
    "balance-reset-storage", "history-heading"]) {
    const element = node();
    element.id = id;
  }
  const stored = new Map(raw === null ? [] : [[model.storageKey, raw]]);
  const sandbox = {
    document: { getElementById: (id) => elements.get(id), createElement: node, createElementNS: (_, tag) => node(tag) },
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => { if (failWrite) throw new Error("Quota exceeded"); stored.set(key, value); },
      removeItem: (key) => stored.delete(key),
    },
    window: { confirm: () => true },
    crypto: { randomUUID: () => `test-id-${++nextId}` },
    console: { error: (...args) => errors.push(args) },
  };
  runInNewContext(modelSource, sandbox);
  runInNewContext(clientSource, sandbox);
  return {
    elements, stored, errors, sandbox,
    fire(id, event, value) {
      const el = elements.get(id);
      if (value !== undefined) el.value = String(value);
      el.listeners[event]({ target: el, preventDefault() {} });
    },
    snapshot: () => JSON.parse(stored.get(model.storageKey)),
  };
}

test("rating, saving, reloading, reflecting and starting fresh preserves historical snapshots", () => {
  const client = app();
  const wheel = client.elements.get("balance-wheel");
  assert.equal(client.elements.get("rated-count").textContent, "0 of 8 rated");
  assert.equal(wheel.children.filter((el) => el.tag === "polygon").length, 0);
  client.fire("balance-form", "submit");
  assert.match(client.elements.get("balance-status").textContent, /Please rate Family/);
  for (let index = 0; index < 8; index++) client.fire(`score-area-${index}`, "input", index);
  assert.equal(wheel.children.filter((el) => el.tag === "circle" && el.attributes.class === "wheel-dot").length, 8);
  assert.equal(wheel.children.filter((el) => el.tag === "polygon").length, 1);
  client.fire("reflection-step", "input", "Walk on Saturday");
  client.fire("balance-form", "submit");
  const snapshot = client.snapshot();
  assert.equal(snapshot.entries.length, 1);
  assert.equal(snapshot.entries[0].categories[0].score, 0);
  assert.equal(snapshot.entries[0].reflections.step, "Walk on Saturday");
  client.fire("reflection-step", "input", "Call a friend");
  client.fire("balance-form", "submit");
  assert.equal(client.snapshot().entries.length, 1, "saving again updates the session's saved check-in");
  const reloaded = app({ raw: client.stored.get(model.storageKey) });
  assert.equal(reloaded.elements.get("reflection-step").value, "Call a friend");
  assert.equal(reloaded.elements.get("balance-history").children.length, 1);
  client.fire("new-checkin", "click");
  assert.equal(client.snapshot().draft.categories[0].score, null);
  assert.equal(client.snapshot().draft.reflections.step, "");
  assert.equal(client.snapshot().entries[0].reflections.step, "Call a friend");
});

test("customizing categories validates names and keeps removed areas in saved check-ins", () => {
  const client = app();
  for (let index = 0; index < 8; index++) client.fire(`score-area-${index}`, "input", 5);
  client.fire("balance-form", "submit");
  client.fire("name-area-0", "input", "Friends");
  assert.match(client.elements.get("name-area-1").validityMessage, /different name/);
  client.fire("name-area-0", "input", "Chosen family");
  assert.equal(client.elements.get("name-area-1").validityMessage, "");
  client.fire("add-category", "click");
  const added = client.snapshot().draft.categories.at(-1);
  assert.equal(added.name, "");
  client.fire(`name-${added.id}`, "input", "Creativity");
  const container = client.elements.get("balance-categories");
  const firstRemove = container.children[0].children[0].children[1];
  firstRemove.listeners.click();
  assert.equal(client.snapshot().draft.categories.some((area) => area.id === "area-0"), false);
  assert.equal(client.snapshot().entries[0].categories[0].name, "Family");
});

test("malformed stored data stays untouched and storage failures never announce successful saves", () => {
  const corrupt = app({ raw: "{broken" });
  assert.equal(corrupt.elements.get("balance-warning").hidden, false);
  corrupt.fire("score-area-0", "input", 0);
  assert.equal(corrupt.stored.get(model.storageKey), "{broken");
  assert.equal(corrupt.errors.length, 1);
  const blocked = app({ failWrite: true });
  for (let index = 0; index < 8; index++) blocked.fire(`score-area-${index}`, "input", 10);
  blocked.fire("balance-form", "submit");
  assert.equal(blocked.elements.get("balance-warning").hidden, false);
  assert.match(blocked.elements.get("balance-status").textContent, /only in memory, not saved/);
  assert.equal(blocked.stored.size, 0);
});

test("clearing history requires confirmation and retains the current draft", () => {
  const client = app();
  for (let index = 0; index < 8; index++) client.fire(`score-area-${index}`, "input", 5);
  client.fire("balance-form", "submit");
  client.sandbox.window.confirm = () => false;
  client.fire("clear-history", "click");
  assert.equal(client.snapshot().entries.length, 1);
  client.sandbox.window.confirm = () => true;
  client.fire("clear-history", "click");
  assert.equal(client.snapshot().entries.length, 0);
  assert.equal(client.snapshot().draft.categories[0].score, 5);
});

test("copying saved check-ins and deleting individual entries never mutates the original draft snapshot", () => {
  const client = app();
  for (let index = 0; index < 8; index++) client.fire(`score-area-${index}`, "input", 5);
  client.fire("balance-form", "submit");
  client.fire("new-checkin", "click");
  const entry = client.elements.get("balance-history").children[0];
  const actions = entry.children.at(-1);
  actions.children[0].listeners.click();
  assert.equal(client.snapshot().draft.categories[0].score, 5);
  client.fire("score-area-0", "input", 10);
  assert.equal(client.snapshot().entries[0].categories[0].score, 5);
  client.fire("balance-form", "submit");
  assert.equal(client.snapshot().entries.length, 2);
  const newestActions = client.elements.get("balance-history").children[0].children.at(-1);
  newestActions.children[1].listeners.click();
  assert.equal(client.snapshot().entries.length, 1);
  assert.equal(client.snapshot().draft.categories[0].score, 10);
});

test("storage recovery is explicit and only removes this tracker's data", () => {
  const client = app({ raw: "{broken" });
  client.stored.set("unrelated-key", "keep");
  client.sandbox.window.confirm = () => false;
  client.fire("balance-reset-storage", "click");
  assert.equal(client.stored.get(model.storageKey), "{broken");
  client.sandbox.window.confirm = () => true;
  client.fire("balance-reset-storage", "click");
  assert.equal(client.snapshot().entries.length, 0);
  assert.equal(client.snapshot().draft.categories[0].score, null);
  assert.equal(client.stored.get("unrelated-key"), "keep");
  assert.equal(client.elements.get("balance-warning").hidden, true);
});
