const storageKey = "portfolio-expense-splitter-v1";
const form = document.querySelector("#expense-form");
const descriptionInput = document.querySelector("#expense-description");
const amountInput = document.querySelector("#expense-amount");
const dateInput = document.querySelector("#expense-date");
const payerInput = document.querySelector("#expense-payer");
const yourShareInput = document.querySelector("#your-share");
const partnerShareLabel = document.querySelector("#partner-share");
const storageWarning = document.querySelector("#storage-warning");
const appStatus = document.querySelector("#app-status");
const currentExpensesList = document.querySelector("#current-expenses");
const settledExpensesList = document.querySelector("#settled-expenses");
const currentEmpty = document.querySelector("#current-empty");
const currentCount = document.querySelector("#current-count");
const settledSection = document.querySelector("#settled-section");
const settledCount = document.querySelector("#settled-count");
const settleButton = document.querySelector("#settle-expenses");
const addButton = document.querySelector("#add-expense");
const balanceLabel = document.querySelector("#balance-label");
const balanceAmount = document.querySelector("#balance-amount");
const balanceHelp = document.querySelector("#balance-help");
const currentTotal = document.querySelector("#current-total");
const youPaidTotal = document.querySelector("#you-paid-total");
const partnerPaidTotal = document.querySelector("#partner-paid-total");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isExpenseRecord(expense) {
  return (
    expense !== null &&
    typeof expense === "object" &&
    typeof expense.id === "string" &&
    typeof expense.description === "string" &&
    expense.description.trim().length > 0 &&
    expense.description.length <= 100 &&
    Number.isSafeInteger(expense.amountCents) &&
    expense.amountCents > 0 &&
    (expense.paidBy === "you" || expense.paidBy === "partner") &&
    Number.isFinite(expense.yourSharePercent) &&
    expense.yourSharePercent >= 0 &&
    expense.yourSharePercent <= 100 &&
    /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
    Number.isFinite(Date.parse(`${expense.date}T00:00:00`)) &&
    typeof expense.createdAt === "string" &&
    Number.isFinite(Date.parse(expense.createdAt)) &&
    (expense.settledAt === null ||
      (typeof expense.settledAt === "string" &&
        Number.isFinite(Date.parse(expense.settledAt))))
  );
}

function showStorageError(message, error) {
  console.error(message, error);
  storageWarning.textContent = message;
  storageWarning.hidden = false;
  form.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = true;
  });
  settleButton.disabled = true;
}

function readExpenses() {
  let saved;

  try {
    saved = localStorage.getItem(storageKey);
  } catch (error) {
    showStorageError(
      "This browser could not access saved expenses. Enable site storage to use the expense tracker.",
      error
    );
    return null;
  }

  if (saved === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isExpenseRecord)) {
      throw new Error("Saved expense data has an unexpected format.");
    }
    return parsed;
  } catch (error) {
    showStorageError(
      "Saved expenses could not be read, so the tracker is disabled to avoid overwriting your data.",
      error
    );
    return null;
  }
}

let expenses = readExpenses();
const storageAvailable = expenses !== null;

if (!storageAvailable) {
  expenses = [];
  currentEmpty.textContent = "Saved expenses aren’t available.";
} else {
  dateInput.value = localDateValue();
}

function displayNotice(message) {
  appStatus.textContent = message;
  appStatus.hidden = false;
}

function saveExpenses(nextExpenses, successMessage) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextExpenses));
  } catch (error) {
    console.error("Unable to save expense changes.", error);
    displayNotice("Could not save that change. Your existing expenses were left unchanged.");
    return false;
  }

  expenses = nextExpenses;
  renderExpenses();
  displayNotice(successMessage);
  return true;
}

function formatMoney(cents) {
  return currency.format(cents / 100);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(`${date}T00:00:00`)
  );
}

function formatPercent(percent) {
  return `${Number(percent.toFixed(1)).toLocaleString("en-US")}%`;
}

function amountOwedByYou(expense) {
  return Math.round((expense.amountCents * expense.yourSharePercent) / 100);
}

function sortedByDate(records) {
  return [...records].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  );
}

function createExpenseRow(expense, isSettled) {
  const row = document.createElement("li");
  row.className = "expense-row";

  const details = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = expense.description;

  const paidBy = expense.paidBy === "you" ? "You" : "Partner";
  const yourShare = amountOwedByYou(expense);
  const partnerShare = expense.amountCents - yourShare;
  const meta = document.createElement("p");
  meta.textContent = `${formatDate(expense.date)} · Paid by ${paidBy} · Your share ${formatPercent(expense.yourSharePercent)} (${formatMoney(yourShare)}) · Partner ${formatMoney(partnerShare)}`;

  details.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "expense-row-actions";

  const amount = document.createElement("strong");
  amount.className = "expense-row-amount";
  amount.textContent = formatMoney(expense.amountCents);
  actions.append(amount);

  if (!isSettled) {
    const removeButton = document.createElement("button");
    removeButton.className = "expense-remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${expense.description}`);
    removeButton.addEventListener("click", () => {
      if (!window.confirm(`Remove “${expense.description}” from current expenses?`)) {
        return;
      }
      saveExpenses(
        expenses.filter((record) => record.id !== expense.id),
        "Expense removed."
      );
    });
    actions.append(removeButton);
  } else {
    const settledLabel = document.createElement("span");
    settledLabel.className = "expense-settled-label";
    settledLabel.textContent = "Settled";
    actions.append(settledLabel);
  }

  row.append(details, actions);
  return row;
}

function renderExpenses() {
  const current = expenses.filter((expense) => expense.settledAt === null);
  const settled = expenses.filter((expense) => expense.settledAt !== null);
  const totalCents = current.reduce((sum, expense) => sum + expense.amountCents, 0);
  const paidByYouCents = current.reduce(
    (sum, expense) => sum + (expense.paidBy === "you" ? expense.amountCents : 0),
    0
  );
  const paidByPartnerCents = current.reduce(
    (sum, expense) => sum + (expense.paidBy === "partner" ? expense.amountCents : 0),
    0
  );
  const balanceCents = current.reduce(
    (sum, expense) =>
      sum +
      (expense.paidBy === "you" ? expense.amountCents : 0) -
      amountOwedByYou(expense),
    0
  );

  currentTotal.textContent = formatMoney(totalCents);
  youPaidTotal.textContent = formatMoney(paidByYouCents);
  partnerPaidTotal.textContent = formatMoney(paidByPartnerCents);
  balanceAmount.textContent = formatMoney(Math.abs(balanceCents));

  if (current.length === 0) {
    balanceLabel.textContent = "No unsettled expenses yet";
    balanceHelp.textContent = "Add an expense to see the current balance.";
  } else if (balanceCents > 0) {
    balanceLabel.textContent = "Partner owes you";
    balanceHelp.textContent = "Based on each person’s share of current expenses.";
  } else if (balanceCents < 0) {
    balanceLabel.textContent = "You owe partner";
    balanceHelp.textContent = "Based on each person’s share of current expenses.";
  } else {
    balanceLabel.textContent = "You’re even";
    balanceHelp.textContent = "You have current expenses, but neither person owes the other.";
  }

  currentCount.textContent = String(current.length);
  currentEmpty.hidden = current.length > 0;
  currentExpensesList.replaceChildren(
    ...sortedByDate(current).map((expense) => createExpenseRow(expense, false))
  );

  settledCount.textContent = String(settled.length);
  settledSection.hidden = settled.length === 0;
  settledExpensesList.replaceChildren(
    ...sortedByDate(settled).map((expense) => createExpenseRow(expense, true))
  );

  settleButton.hidden = current.length === 0;
  settleButton.disabled = !storageAvailable;
}

yourShareInput.addEventListener("input", () => {
  yourShareInput.setCustomValidity("");
  const share = Number(yourShareInput.value);
  partnerShareLabel.textContent =
    yourShareInput.value !== "" && Number.isFinite(share) && share >= 0 && share <= 100
      ? formatPercent(100 - share)
      : "—";
});

descriptionInput.addEventListener("input", () => {
  descriptionInput.setCustomValidity("");
});

amountInput.addEventListener("input", () => {
  amountInput.setCustomValidity("");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageAvailable || !form.reportValidity()) {
    return;
  }

  const amountCents = Math.round(Number(amountInput.value) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    amountInput.setCustomValidity("Enter a valid amount greater than zero.");
    amountInput.reportValidity();
    return;
  }
  amountInput.setCustomValidity("");

  const expense = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: descriptionInput.value.trim(),
    amountCents,
    date: dateInput.value,
    paidBy: payerInput.value,
    yourSharePercent: Number(yourShareInput.value),
    createdAt: new Date().toISOString(),
    settledAt: null,
  };

  if (!expense.description) {
    descriptionInput.setCustomValidity("Enter a short description for this expense.");
    descriptionInput.reportValidity();
    return;
  }
  descriptionInput.setCustomValidity("");

  if (
    !Number.isFinite(expense.yourSharePercent) ||
    expense.yourSharePercent < 0 ||
    expense.yourSharePercent > 100
  ) {
    yourShareInput.setCustomValidity("Your share must be between 0% and 100%.");
    yourShareInput.reportValidity();
    return;
  }
  yourShareInput.setCustomValidity("");

  if (
    !expense.date ||
    !Number.isFinite(Date.parse(`${expense.date}T00:00:00`)) ||
    (expense.paidBy !== "you" && expense.paidBy !== "partner")
  ) {
    displayNotice("Check the expense date and payer, then try again.");
    return;
  }

  if (saveExpenses([...expenses, expense], "Expense added.")) {
    form.reset();
    dateInput.value = localDateValue();
    partnerShareLabel.textContent = "50%";
    descriptionInput.focus();
  }
});

settleButton.addEventListener("click", () => {
  const current = expenses.filter((expense) => expense.settledAt === null);
  if (!storageAvailable || current.length === 0) {
    return;
  }

  const confirmation =
    current.length === 1
      ? "Mark this expense settled? It will remain in your history."
      : `Mark all ${current.length} current expenses settled? They will remain in your history.`;
  if (!window.confirm(confirmation)) {
    return;
  }

  const settledAt = new Date().toISOString();
  const nextExpenses = expenses.map((expense) =>
    expense.settledAt === null ? { ...expense, settledAt } : expense
  );
  saveExpenses(nextExpenses, "Current expenses marked settled. Your history was kept.");
});

renderExpenses();
