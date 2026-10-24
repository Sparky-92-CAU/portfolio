const apiElement = document.querySelector('meta[name="cat-store-api"]');
const configuredApiUrl = apiElement?.content.trim() || "";
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const apiBaseUrl = (configuredApiUrl || (isLocalHost ? "http://localhost:8081" : ""))
  .replace(/\/$/, "");

const authPanel = document.querySelector("#auth-panel");
const accountBar = document.querySelector("#account-bar");
const accountName = document.querySelector("#account-name");
const accountRole = document.querySelector("#account-role");
const storeNotice = document.querySelector("#store-notice");
const loginForm = document.querySelector("#login-form");
const loginEmail = document.querySelector("#login-email");
const loginPassword = document.querySelector("#login-password");
const loginModeButtons = document.querySelectorAll("[data-login-mode]");
const registerSection = document.querySelector("#register-section");
const showRegisterButton = document.querySelector("#show-register");
const registerForm = document.querySelector("#register-form");
const signOutButton = document.querySelector("#sign-out");
const catGrid = document.querySelector("#cat-grid");
const catalogEmpty = document.querySelector("#catalog-empty");
const cartPanel = document.querySelector("#cart-panel");
const cartList = document.querySelector("#cart-list");
const cartTotal = document.querySelector("#cart-total");
const placeOrderButton = document.querySelector("#place-order");
const customerPanel = document.querySelector("#customer-panel");
const customerOrders = document.querySelector("#customer-orders");
const customerOrdersEmpty = document.querySelector("#customer-orders-empty");
const refreshCustomerOrdersButton = document.querySelector("#refresh-customer-orders");
const adminPanel = document.querySelector("#admin-panel");
const adminInventory = document.querySelector("#admin-inventory");
const adminOrders = document.querySelector("#admin-orders");
const adminOrdersEmpty = document.querySelector("#admin-orders-empty");
const refreshAdminDataButton = document.querySelector("#refresh-admin-data");
const catForm = document.querySelector("#cat-form");
const catIdInput = document.querySelector("#cat-id");
const catNameInput = document.querySelector("#cat-name");
const catBreedInput = document.querySelector("#cat-breed");
const catAgeInput = document.querySelector("#cat-age");
const catPriceInput = document.querySelector("#cat-price");
const catDescriptionInput = document.querySelector("#cat-description");
const newCatButton = document.querySelector("#new-cat");
const cancelCatEditButton = document.querySelector("#cancel-cat-edit");
const saveCatButton = document.querySelector("#save-cat");

let accessToken = "";
let currentUser = null;
let loginMode = "customer";
let catalog = [];
const cart = new Map();

function setStoreNotice(message, state = "info") {
  storeNotice.textContent = message;
  storeNotice.dataset.state = state;
}

async function apiRequest(path, options = {}) {
  if (!apiBaseUrl) {
    throw new Error("The store API URL is not configured for this deployment.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  let result = null;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`The store API returned an unreadable response (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(result?.message || `Request failed with HTTP ${response.status}.`);
  }
  return result;
}

function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function makeButton(label, className, onClick, disabled = false) {
  const button = makeElement("button", className, label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function updateAuthenticatedUi() {
  const signedIn = Boolean(currentUser);
  const isCustomer = currentUser?.role === "CUSTOMER";
  const isAdmin = currentUser?.role === "ADMIN";

  authPanel.hidden = signedIn;
  accountBar.hidden = !signedIn;
  customerPanel.hidden = !isCustomer;
  adminPanel.hidden = !isAdmin;
  cartPanel.hidden = !isCustomer || cart.size === 0;

  if (currentUser) {
    accountName.textContent = currentUser.displayName;
    accountRole.textContent = currentUser.role === "ADMIN" ? "Admin" : "Customer";
  }
}

function renderCatalog() {
  catGrid.replaceChildren();
  catalogEmpty.hidden = catalog.length !== 0;

  for (const cat of catalog) {
    const card = makeElement("article", "cat-card");
    const illustration = makeElement("div", "cat-card-art", "🐈");
    illustration.setAttribute("aria-hidden", "true");
    const content = makeElement("div", "cat-card-content");
    const name = makeElement("h3", "", cat.name);
    const breed = makeElement("p", "cat-card-breed", cat.breed);
    const years = Math.floor(cat.ageMonths / 12);
    const months = cat.ageMonths % 12;
    const ageLabel = years === 0
      ? `${months} months old`
      : months === 0
        ? `${years} ${years === 1 ? "year" : "years"} old`
        : `${years} ${years === 1 ? "year" : "years"}, ${months} months old`;
    const description = makeElement("p", "cat-card-description", cat.description);
    const footer = makeElement("div", "cat-card-footer");
    const detail = makeElement("div");
    detail.append(
      makeElement("span", "cat-price", formatMoney(cat.priceCents)),
      makeElement("br"),
      makeElement("span", "cat-card-age", ageLabel)
    );

    let orderButton;
    if (currentUser?.role === "CUSTOMER") {
      const inCart = cart.has(cat.id);
      orderButton = makeButton(
        inCart ? "Remove" : "Add to order",
        inCart ? "cat-button cat-button-secondary" : "cat-button cat-button-primary",
        () => {
          if (cart.has(cat.id)) {
            cart.delete(cat.id);
          } else {
            cart.set(cat.id, cat);
          }
          renderCatalog();
          renderCart();
        }
      );
    } else if (currentUser?.role === "ADMIN") {
      orderButton = makeButton("Admin view", "cat-button cat-button-secondary", () => {
        adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      orderButton = makeButton("Sign in to order", "cat-button cat-button-primary", () => {
        setStoreNotice("Sign in or create a customer account to place an order.");
        authPanel.scrollIntoView({ behavior: "smooth", block: "center" });
        loginEmail.focus();
      });
    }

    footer.append(detail, orderButton);
    content.append(name, breed, description, footer);
    card.append(illustration, content);
    catGrid.append(card);
  }
  updateAuthenticatedUi();
}

function renderCart() {
  cartList.replaceChildren();
  let totalCents = 0;
  for (const cat of cart.values()) {
    totalCents += cat.priceCents;
    const row = makeElement("li", "cat-cart-item");
    const details = makeElement("div");
    details.append(
      makeElement("strong", "", cat.name),
      makeElement("span", "", `${cat.breed} · ${formatMoney(cat.priceCents)}`)
    );
    row.append(details, makeButton("Remove", "cat-remove-button", () => {
      cart.delete(cat.id);
      renderCatalog();
      renderCart();
    }));
    cartList.append(row);
  }
  cartTotal.textContent = formatMoney(totalCents);
  updateAuthenticatedUi();
}

function renderOrders(container, orders, { admin = false } = {}) {
  container.replaceChildren();
  for (const order of orders) {
    const card = makeElement("article", "cat-order-card");
    const heading = makeElement("div", "cat-order-heading");
    const headingDetails = makeElement("div");
    headingDetails.append(
      makeElement("strong", "", `Order #${order.id}`),
      makeElement("p", "", new Date(order.createdAt).toLocaleString())
    );
    const status = makeElement("span", "cat-status-pill", order.status);
    status.dataset.status = order.status;
    heading.append(headingDetails, status);

    if (admin) {
      card.append(makeElement("p", "", `${order.customerName} · ${order.customerEmail}`));
    }
    const items = makeElement("ul", "cat-order-items");
    for (const item of order.items) {
      items.append(makeElement(
        "li",
        "",
        `${item.name} (${item.breed}) · ${formatMoney(item.unitPriceCents)}`
      ));
    }
    card.append(
      heading,
      makeElement("p", "", `Order total: ${formatMoney(order.totalCents)}`),
      items
    );

    if (admin && order.status === "PLACED") {
      const actions = makeElement("div", "cat-order-actions");
      actions.append(
        makeButton("Mark fulfilled", "cat-button cat-button-primary", () => {
          changeOrderStatus(order.id, "FULFILLED");
        }),
        makeButton("Cancel order", "cat-button cat-button-secondary", () => {
          changeOrderStatus(order.id, "CANCELLED");
        })
      );
      card.append(actions);
    }
    container.append(card);
  }
}

async function loadCatalog() {
  setStoreNotice("Connecting to the cat store API…");
  catalog = await apiRequest("/api/cats");
  renderCatalog();
  setStoreNotice("Connected. Listings are loaded from the database.", "success");
}

async function loadAccountData() {
  if (currentUser?.role === "CUSTOMER") {
    const orders = await apiRequest("/api/customer/orders");
    renderOrders(customerOrders, orders);
    customerOrdersEmpty.hidden = orders.length !== 0;
    return;
  }

  async function refreshStoreData() {
    try {
      await Promise.all([loadCatalog(), loadAccountData()]);
      setStoreNotice("Store data refreshed.", "success");
    } catch (error) {
      setStoreNotice(error.message, "error");
    }
  }

  if (currentUser?.role === "ADMIN") {
    const [inventory, orders] = await Promise.all([
      apiRequest("/api/admin/cats"),
      apiRequest("/api/admin/orders"),
    ]);
    renderInventory(inventory);
    renderOrders(adminOrders, orders, { admin: true });
    adminOrdersEmpty.hidden = orders.length !== 0;
  }
}

function renderInventory(inventory) {
  adminInventory.replaceChildren();
  for (const cat of inventory) {
    const row = makeElement("article", "cat-inventory-row");
    const details = makeElement("div");
    const meta = makeElement("div", "cat-inventory-meta");
    const status = makeElement("span", "cat-status-pill", cat.status);
    status.dataset.status = cat.status;
    meta.append(status, makeElement("span", "", formatMoney(cat.priceCents)));
    details.append(
      makeElement("strong", "", `${cat.name} · ${cat.breed}`),
      makeElement("p", "", `${cat.ageMonths} months old`),
      meta
    );

    const actions = makeElement("div", "cat-admin-actions");
    if (cat.status === "AVAILABLE") {
      actions.append(
        makeButton("Edit", "cat-button cat-button-secondary", () => editCat(cat)),
        makeButton("Archive", "cat-button cat-button-secondary", () => archiveCat(cat))
      );
    } else if (cat.status === "ARCHIVED") {
      actions.append(makeButton("Restore", "cat-button cat-button-secondary", () => restoreCat(cat)));
    }
    row.append(details, actions);
    adminInventory.append(row);
  }
}

function renderCartAfterOrder() {
  cart.clear();
  renderCatalog();
  renderCart();
}

function resetCatForm() {
  catForm.reset();
  catIdInput.value = "";
  saveCatButton.textContent = "Save listing";
  catForm.hidden = true;
}

function editCat(cat) {
  catIdInput.value = String(cat.id);
  catNameInput.value = cat.name;
  catBreedInput.value = cat.breed;
  catAgeInput.value = String(cat.ageMonths);
  catPriceInput.value = (cat.priceCents / 100).toFixed(2);
  catDescriptionInput.value = cat.description;
  saveCatButton.textContent = "Update listing";
  catForm.hidden = false;
  catForm.scrollIntoView({ behavior: "smooth", block: "center" });
  catNameInput.focus();
}

async function archiveCat(cat) {
  if (!window.confirm(`Archive ${cat.name}? Its order history will be retained.`)) {
    return;
  }
  try {
    await apiRequest(`/api/admin/cats/${cat.id}`, { method: "DELETE" });
    await loadAccountData();
    await loadCatalog();
    setStoreNotice(`${cat.name} was archived.`, "success");
  } catch (error) {
    setStoreNotice(error.message, "error");
  }
}

async function restoreCat(cat) {
  try {
    await apiRequest(`/api/admin/cats/${cat.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "AVAILABLE" }),
    });
    await loadAccountData();
    await loadCatalog();
    setStoreNotice(`${cat.name} is available in the catalog again.`, "success");
  } catch (error) {
    setStoreNotice(error.message, "error");
  }
}

async function changeOrderStatus(orderId, status) {
  try {
    await apiRequest(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await loadAccountData();
    await loadCatalog();
    setStoreNotice(`Order #${orderId} was ${status.toLowerCase()}.`, "success");
  } catch (error) {
    setStoreNotice(error.message, "error");
  }
}

loginModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loginMode = button.dataset.loginMode;
    loginModeButtons.forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    registerSection.hidden = loginMode !== "customer";
    registerForm.hidden = true;
    showRegisterButton.textContent = "New customer? Create an account";
  });
});

showRegisterButton.addEventListener("click", () => {
  registerForm.hidden = !registerForm.hidden;
  showRegisterButton.textContent = registerForm.hidden
    ? "New customer? Create an account"
    : "Already registered? Sign in";
});

refreshCustomerOrdersButton.addEventListener("click", refreshStoreData);
refreshAdminDataButton.addEventListener("click", refreshStoreData);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStoreNotice("Signing in…");
  let result;
  try {
    result = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
        accountType: loginMode.toUpperCase(),
      }),
    });
  } catch (error) {
    setStoreNotice(error.message, "error");
    return;
  }
  await finishSignIn(result, `Welcome, ${result.user.displayName}.`);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  setStoreNotice("Creating your customer account…");
  let result;
  try {
    result = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password"),
        phone: formData.get("phone") || null,
      }),
    });
  } catch (error) {
    setStoreNotice(error.message, "error");
    return;
  }
  registerForm.reset();
  await finishSignIn(result, "Customer account created. You are signed in.");
});

async function finishSignIn(result, successMessage) {
  accessToken = result.accessToken;
  currentUser = result.user;
  cart.clear();
  updateAuthenticatedUi();
  loginForm.reset();
  try {
    await loadCatalog();
    await loadAccountData();
    setStoreNotice(successMessage, "success");
  } catch (error) {
    setStoreNotice(`Signed in, but could not load account data: ${error.message}`, "error");
  }
}

signOutButton.addEventListener("click", () => {
  accessToken = "";
  currentUser = null;
  cart.clear();
  resetCatForm();
  updateAuthenticatedUi();
  renderCart();
  renderCatalog();
  setStoreNotice("You have signed out.");
});

placeOrderButton.addEventListener("click", async () => {
  if (cart.size === 0) {
    return;
  }
  placeOrderButton.disabled = true;
  setStoreNotice("Saving your order…");
  try {
    const result = await apiRequest("/api/customer/orders", {
      method: "POST",
      body: JSON.stringify({ catIds: Array.from(cart.keys()) }),
    });
    renderCartAfterOrder();
    await loadAccountData();
    await loadCatalog();
    setStoreNotice(`Order #${result.id} was saved. No payment was taken.`, "success");
  } catch (error) {
    setStoreNotice(error.message, "error");
  } finally {
    placeOrderButton.disabled = false;
  }
});

newCatButton.addEventListener("click", () => {
  resetCatForm();
  catForm.hidden = false;
  catForm.scrollIntoView({ behavior: "smooth", block: "center" });
  catNameInput.focus();
});

cancelCatEditButton.addEventListener("click", resetCatForm);

catForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const price = Number.parseFloat(catPriceInput.value);
  const priceCents = Math.round(price * 100);
  if (!Number.isFinite(price) || !Number.isSafeInteger(priceCents) || priceCents <= 0) {
    setStoreNotice("Enter a valid price greater than zero.", "error");
    catPriceInput.focus();
    return;
  }

  const catId = catIdInput.value;
  const payload = {
    name: catNameInput.value,
    breed: catBreedInput.value,
    ageMonths: Number(catAgeInput.value),
    description: catDescriptionInput.value,
    priceCents,
  };
  saveCatButton.disabled = true;
  setStoreNotice(catId ? "Updating listing…" : "Adding listing…");
  try {
    await apiRequest(catId ? `/api/admin/cats/${catId}` : "/api/admin/cats", {
      method: catId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetCatForm();
    await loadAccountData();
    await loadCatalog();
    setStoreNotice(catId ? "Listing updated." : "Cat listing added.", "success");
  } catch (error) {
    setStoreNotice(error.message, "error");
  } finally {
    saveCatButton.disabled = false;
  }
});

updateAuthenticatedUi();
renderCart();
loadCatalog().catch((error) => {
  setStoreNotice(`Could not load the store: ${error.message}`, "error");
});
