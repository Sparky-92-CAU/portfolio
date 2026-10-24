(() => {
  "use strict";
  const defaults = ["Family", "Friends", "Spirituality", "Romance", "Health", "Career", "Finances", "Fun or leisure"];
  const reflectionKeys = ["balance", "values", "step"];
  const storageKey = "portfolio-life-balance-v1";

  function today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function newDraft(categories = defaults.map((name, index) => ({ id: `area-${index}`, name }))) {
    return {
      date: today(),
      categories: categories.map(({ id, name }) => ({ id, name, score: null })),
      reflections: { balance: "", values: "", step: "" },
    };
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validDraft(draft, saved = false) {
    return draft && validDate(draft.date) && Array.isArray(draft.categories)
      && draft.categories.length >= 3 && draft.categories.length <= 12
      && draft.categories.every((area) => area && typeof area.id === "string" && area.id.length > 0
        && typeof area.name === "string" && area.name.length <= 36
        && ((!saved && area.score === null) || (Number.isInteger(area.score) && area.score >= 0 && area.score <= 10))
        && (!saved || area.name.trim().length > 0))
      && new Set(draft.categories.map((area) => area.id)).size === draft.categories.length
      && (!saved || new Set(draft.categories.map((area) => area.name.trim().toLowerCase())).size === draft.categories.length)
      && draft.reflections && reflectionKeys.every((key) => typeof draft.reflections[key] === "string" && draft.reflections[key].length <= 3000);
  }

  function parseState(raw) {
    const state = JSON.parse(raw);
    if (!state || state.version !== 1 || !validDraft(state.draft) || !Array.isArray(state.entries)
      || !state.entries.every((entry) => validDraft(entry, true) && typeof entry.id === "string" && entry.id.length > 0
        && typeof entry.savedAt === "string" && Number.isFinite(Date.parse(entry.savedAt)))
      || new Set(state.entries.map((entry) => entry.id)).size !== state.entries.length) {
      throw new Error("Invalid life balance data");
    }
    return state;
  }

  function point(index, count, score, radius = 190) {
    const angle = (index * Math.PI * 2 / count) - Math.PI / 2;
    return { x: 320 + Math.cos(angle) * radius * score / 10, y: 320 + Math.sin(angle) * radius * score / 10 };
  }

  function sortedEntries(entries) {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt));
  }

  function changes(current, previous) {
    return current.categories.map((area) => {
      const old = previous?.categories.find((candidate) => candidate.id === area.id);
      return { ...area, change: old ? area.score - old.score : null };
    });
  }

  globalThis.LifeBalanceModel = { defaults, reflectionKeys, storageKey, today, newDraft, validDate, validDraft, parseState, point, sortedEntries, changes };
})();
