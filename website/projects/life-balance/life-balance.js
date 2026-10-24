(() => {
  "use strict";
  const model = globalThis.LifeBalanceModel;
  const byId = (id) => document.getElementById(id);
  const svgNS = "http://www.w3.org/2000/svg";
  let state = { version: 1, draft: model.newDraft(), entries: [] };
  let storageBlocked = false;
  let editingSavedId = null;

  function announce(message) { byId("balance-status").textContent = message; }

  function storageWarning(message) {
    byId("balance-warning-text").textContent = message;
    byId("balance-warning").hidden = false;
    byId("draft-status").textContent = "Changes are only in memory until browser storage is available.";
  }

  try {
    const raw = localStorage.getItem(model.storageKey);
    if (raw !== null) state = model.parseState(raw);
  } catch (error) {
    storageBlocked = true;
    console.error("Life balance data could not be loaded.", error);
    storageWarning("Saved tracker data could not be read. Existing data has not been overwritten. You can use a temporary wheel, or explicitly clear tracker data to start fresh.");
  }

  function persist() {
    announce("");
    if (storageBlocked) return false;
    try {
      localStorage.setItem(model.storageKey, JSON.stringify(state));
      byId("balance-warning").hidden = true;
      byId("draft-status").textContent = "Draft saved automatically in this browser.";
      return true;
    } catch (error) {
      console.error("Life balance data could not be saved.", error);
      storageWarning("Browser storage is unavailable or full. Your latest changes are only in memory and will be lost if you leave. Free space or enable storage, then try again.");
      return false;
    }
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function svg(tag, attributes, text) {
    const node = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function drawWheel() {
    const wheel = byId("balance-wheel");
    const areas = state.draft.categories;
    const rated = areas.filter((area) => area.score !== null).length;
    wheel.replaceChildren(
      svg("title", { id: "wheel-title" }, "Your satisfaction wheel"),
      svg("desc", { id: "wheel-description" }, areas.map((area) => `${area.name || "Unnamed area"}: ${area.score === null ? "not rated" : `${area.score} out of 10`}`).join(". ")),
    );
    for (let score = 2; score <= 10; score += 2) {
      wheel.append(svg("circle", { cx: 320, cy: 320, r: 19 * score, class: "wheel-ring" }));
      wheel.append(svg("text", { x: 326, y: 320 - 19 * score + 14, class: "wheel-scale" }, String(score)));
    }
    wheel.append(svg("text", { x: 326, y: 336, class: "wheel-scale" }, "0"));
    areas.forEach((area, index) => {
      const edge = model.point(index, areas.length, 10);
      wheel.append(svg("line", { x1: 320, y1: 320, x2: edge.x, y2: edge.y, class: "wheel-spoke" }));
      const labelPoint = model.point(index, areas.length, 10, 250);
      const label = svg("text", { x: labelPoint.x, y: labelPoint.y, class: "wheel-label" });
      const name = area.name.trim() || "Unnamed area";
      const lines = name.match(/.{1,14}(?:\s|$)|.{1,14}/g) || [name];
      lines.forEach((line, lineIndex) => label.append(svg("tspan", { x: labelPoint.x, dy: lineIndex === 0 ? -(lines.length - 1) * 8 : 17 }, line.trim())));
      wheel.append(label);
    });
    if (rated === areas.length) {
      wheel.append(svg("polygon", {
        points: areas.map((area, index) => {
          const point = model.point(index, areas.length, area.score);
          return `${point.x},${point.y}`;
        }).join(" "),
        class: "wheel-shape",
      }));
    }
    areas.forEach((area, index) => {
      if (area.score === null) return;
      const point = model.point(index, areas.length, area.score);
      const dot = svg("circle", { cx: point.x, cy: point.y, r: 5.5, class: "wheel-dot" });
      dot.append(svg("title", {}, `${area.name}: ${area.score}/10`));
      wheel.append(dot);
    });
    byId("rated-count").textContent = `${rated} of ${areas.length} rated`;
  }

  function validateNames() {
    const names = state.draft.categories.map((area) => area.name.trim().toLowerCase());
    state.draft.categories.forEach((area, index) => {
      const input = byId(`name-${area.id}`);
      input.setCustomValidity(!names[index] ? "Give this life area a name." : names.indexOf(names[index]) !== index ? "Use a different name for each life area." : "");
    });
  }

  function renderCategories() {
    const container = byId("balance-categories");
    container.replaceChildren();
    state.draft.categories.forEach((area) => {
      const row = element("div", undefined, "balance-category");
      const heading = element("div", undefined, "balance-category-heading");
      const label = element("label");
      const name = element("input");
      name.id = `name-${area.id}`;
      name.type = "text";
      name.maxLength = 36;
      name.required = true;
      name.value = area.name;
      name.setAttribute("aria-label", `Life area name: ${area.name || "new area"}`);
      name.addEventListener("input", () => {
        area.name = name.value;
        name.setAttribute("aria-label", `Life area name: ${area.name || "new area"}`);
        ratingLabel.textContent = `Satisfaction: ${area.name || "new area"}`;
        remove.setAttribute("aria-label", `Remove ${area.name || "new area"}`);
        midpoint.setAttribute("aria-label", `Rate ${area.name || "new area"} 5 out of 10`);
        validateNames();
        drawWheel();
        persist();
      });
      label.append(name);
      const remove = element("button", "Remove", "balance-remove");
      remove.type = "button";
      remove.disabled = state.draft.categories.length <= 3;
      remove.setAttribute("aria-label", `Remove ${area.name || "new area"}`);
      remove.addEventListener("click", () => {
        if ((area.score !== null || area.name.trim()) && !window.confirm(`Remove "${area.name || "this area"}" from this draft? Saved check-ins will not change.`)) return;
        state.draft.categories = state.draft.categories.filter((candidate) => candidate.id !== area.id);
        renderCategories();
        drawWheel();
        persist();
        byId("add-category").focus();
      });
      heading.append(label, remove);
      const ratingLabel = element("label", `Satisfaction: ${area.name || "new area"}`, "balance-rating-label");
      ratingLabel.htmlFor = `score-${area.id}`;
      const ratingRow = element("div", undefined, "balance-rating-row");
      const slider = element("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "10";
      slider.step = "1";
      slider.value = area.score === null ? "5" : String(area.score);
      slider.id = `score-${area.id}`;
      slider.setAttribute("aria-describedby", "rating-help");
      slider.setAttribute("aria-valuetext", area.score === null ? "Not rated; move to choose a score" : `${area.score} out of 10`);
      const output = element("output", area.score === null ? "Not rated" : `${area.score} / 10`);
      output.htmlFor = slider.id;
      const midpoint = element("button", "Rate 5", "balance-rate-midpoint");
      midpoint.type = "button";
      midpoint.hidden = area.score !== null;
      midpoint.setAttribute("aria-label", `Rate ${area.name || "new area"} 5 out of 10`);
      function rate() {
        area.score = Number(slider.value);
        output.textContent = `${area.score} / 10`;
        slider.setAttribute("aria-valuetext", `${area.score} out of 10`);
        midpoint.hidden = true;
        drawWheel();
        persist();
      }
      slider.addEventListener("input", rate);
      midpoint.addEventListener("click", () => { slider.value = "5"; rate(); slider.focus(); });
      ratingRow.append(slider, output);
      row.append(heading, ratingLabel, ratingRow, midpoint);
      container.append(row);
    });
    byId("add-category").disabled = state.draft.categories.length >= 12;
    validateNames();
  }

  function fillDraft() {
    byId("checkin-date").value = state.draft.date;
    for (const key of model.reflectionKeys) byId(`reflection-${key}`).value = state.draft.reflections[key];
    renderCategories();
    drawWheel();
  }

  function formattedDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function renderHistory() {
    const container = byId("balance-history");
    container.replaceChildren();
    const entries = model.sortedEntries(state.entries);
    byId("history-empty").hidden = entries.length !== 0;
    byId("clear-history").hidden = entries.length === 0;
    entries.forEach((entry, index) => {
      const details = element("details", undefined, "balance-history-entry");
      const savedTime = new Date(entry.savedAt).toLocaleString();
      details.append(element("summary", `${formattedDate(entry.date)} - ${entry.categories.length} areas | saved ${savedTime}`));
      const table = element("table");
      table.append(element("caption", `Satisfaction ratings for ${formattedDate(entry.date)}`));
      const head = element("thead");
      const headerRow = element("tr");
      for (const title of ["Life area", "Score / 10", "Change"]) {
        const th = element("th", title);
        th.scope = "col";
        headerRow.append(th);
      }
      head.append(headerRow);
      const body = element("tbody");
      for (const area of model.changes(entry, entries[index + 1])) {
        const row = element("tr");
        const title = element("th", area.name);
        title.scope = "row";
        row.append(title, element("td", String(area.score)), element("td", area.change === null ? "No comparison" : area.change > 0 ? `+${area.change}` : String(area.change)));
        body.append(row);
      }
      table.append(head, body);
      details.append(table);
      if (entries[index + 1]) details.append(element("p", `Compared with ${formattedDate(entries[index + 1].date)} (saved ${new Date(entries[index + 1].savedAt).toLocaleString()}).`, "balance-help"));
      const titles = { balance: "Balance and attention", values: "Values alignment", step: "One small step" };
      for (const key of model.reflectionKeys) {
        details.append(element("h3", titles[key]), element("p", entry.reflections[key] || "No reflection recorded."));
      }
      const actions = element("div", undefined, "balance-actions");
      const load = element("button", "View wheel / copy to draft", "balance-secondary");
      load.type = "button";
      load.addEventListener("click", () => {
        if (!window.confirm("Replace your current draft with a copy of this check-in? The saved original will stay unchanged.")) return;
        state.draft = { date: entry.date, categories: entry.categories.map((area) => ({ ...area })), reflections: { ...entry.reflections } };
        editingSavedId = null;
        fillDraft();
        persist();
        announce("Saved check-in copied to your draft. Saving creates a separate check-in.");
        byId("checkin-date").focus();
      });
      const remove = element("button", "Delete check-in", "balance-secondary");
      remove.type = "button";
      remove.addEventListener("click", () => {
        if (!window.confirm(`Permanently delete the check-in for ${formattedDate(entry.date)}?`)) return;
        state.entries = state.entries.filter((candidate) => candidate.id !== entry.id);
        if (editingSavedId === entry.id) editingSavedId = null;
        const saved = persist();
        renderHistory();
        announce(saved ? "Check-in deleted." : "Check-in removed only in memory; browser storage has not been updated.");
        byId("history-heading").tabIndex = -1;
        byId("history-heading").focus();
      });
      actions.append(load, remove);
      details.append(actions);
      container.append(details);
    });
  }

  byId("checkin-date").addEventListener("input", (event) => {
    if (!model.validDate(event.target.value)) {
      byId("draft-status").textContent = "Choose a valid date to save this change.";
      return;
    }
    state.draft.date = event.target.value;
    persist();
  });
  for (const key of model.reflectionKeys) {
    byId(`reflection-${key}`).addEventListener("input", (event) => {
      state.draft.reflections[key] = event.target.value;
      persist();
    });
  }
  byId("add-category").addEventListener("click", () => {
    if (state.draft.categories.length >= 12) return;
    const area = { id: crypto.randomUUID(), name: "", score: null };
    state.draft.categories.push(area);
    renderCategories();
    drawWheel();
    persist();
    byId(`name-${area.id}`).focus();
  });
  byId("new-checkin").addEventListener("click", () => {
    if (!window.confirm("Start a fresh check-in with your current life areas? Unsaved ratings and reflections in this draft will be cleared. Saved check-ins stay unchanged.")) return;
    state.draft = model.newDraft(state.draft.categories);
    editingSavedId = null;
    fillDraft();
    persist();
    announce("Fresh check-in started. Your life areas have been kept.");
    byId("checkin-date").focus();
  });
  byId("balance-form").addEventListener("submit", (event) => {
    event.preventDefault();
    validateNames();
    if (!byId("balance-form").reportValidity()) return;
    const unrated = state.draft.categories.find((area) => area.score === null);
    if (unrated) {
      announce(`Please rate ${unrated.name} before saving. Every area needs a satisfaction score.`);
      byId(`score-${unrated.id}`).focus();
      return;
    }
    if (storageBlocked) {
      announce("Cannot save while stored data is unreadable. Clear tracker data using the warning above to enable saving.");
      return;
    }
    const entry = {
      ...state.draft,
      categories: state.draft.categories.map((area) => ({ ...area, name: area.name.trim() })),
      reflections: { ...state.draft.reflections },
      id: editingSavedId || crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    state.entries = [...state.entries.filter((candidate) => candidate.id !== entry.id), entry];
    editingSavedId = entry.id;
    const saved = persist();
    renderHistory();
    announce(saved ? "Check-in saved in this browser. You can revisit it below or start a new check-in." : "Check-in is only in memory, not saved to this browser. Resolve the storage warning and try saving again.");
  });
  byId("clear-history").addEventListener("click", () => {
    if (!window.confirm("Permanently delete all saved life balance check-ins? Your current draft will stay.")) return;
    state.entries = [];
    editingSavedId = null;
    const saved = persist();
    renderHistory();
    announce(saved ? "Saved check-ins deleted. Your draft has been kept." : "History cleared only in memory; browser storage has not been updated.");
  });
  byId("balance-reset-storage").addEventListener("click", () => {
    if (!window.confirm("Permanently clear ALL life balance data in this browser, including your draft and saved check-ins? This cannot be undone.")) return;
    try {
      localStorage.removeItem(model.storageKey);
    } catch (error) {
      console.error("Life balance data could not be cleared.", error);
      storageWarning("Browser storage could not be cleared. Check your browser settings and try again. No data was reset.");
      return;
    }
    storageBlocked = false;
    editingSavedId = null;
    state = { version: 1, draft: model.newDraft(), entries: [] };
    fillDraft();
    renderHistory();
    const saved = persist();
    announce(saved ? "Tracker data cleared. A fresh wheel is ready." : "Old tracker data cleared, but the new draft could not be saved.");
  });
  fillDraft();
  renderHistory();
})();
