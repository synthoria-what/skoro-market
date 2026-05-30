const SITE = {
  title: "СкороМаркет",
  subtitle: "продукты у дома",
  mark: "S",
  catalogVersion: "ru-products-v1",
  hero: "Готовые наборы",
  heroAccent: "и продукты",
  copy: "Соберите корзину для быстрого обеда или ужина: свежие продукты, лапша, овощи и напитки уже в каталоге.",
  cta: "Собрать корзину",
  db: "skoromarket_static_db",
  cart: "skoromarket_static_cart",
  session: "skoromarket_static_user",
  heroImage: "assets/hero-noodles.jpg",
  search: "Найти продукт",
  promos: [["15 мин", "быстрая доставка"], ["от 109 ₽", "товары на каждый день"], ["Самовывоз", "или доставка домой"]],
};

const INITIAL_PRODUCTS = [
  { id: "milk", name: "Молоко", category: "Молочное", price: 109, old_price: 139, image: "assets/dj-milk.webp", badge: "15 мин", description: "Молоко в упаковке, карточка товара с реальным фото продукта." },
  { id: "eggs", name: "Яйца", category: "Бакалея", price: 139, old_price: 169, image: "assets/dj-eggs.webp", badge: "Выгодно", description: "Упаковка яиц для завтраков и домашней выпечки." },
  { id: "apple", name: "Яблоко", category: "Фрукты", price: 69, old_price: 89, image: "assets/dj-apple.webp", badge: "Свежие", description: "Сочное яблоко, товарная карточка для фруктовой полки." },
  { id: "strawberry", name: "Клубника", category: "Фрукты", price: 249, old_price: 299, image: "assets/dj-strawberry.webp", badge: "Сезон", description: "Клубника для десертов, завтраков и перекусов." },
  { id: "kiwi", name: "Киви", category: "Фрукты", price: 129, old_price: 159, image: "assets/dj-kiwi.webp", badge: "Витамин", description: "Киви с ярким вкусом, подходит для смузи и фруктовых тарелок." },
  { id: "cucumber", name: "Огурец", category: "Овощи", price: 89, old_price: 119, image: "assets/dj-cucumber.webp", badge: "Хруст", description: "Огурец для салатов, сэндвичей и легких закусок." },
  { id: "green-bell-pepper", name: "Болгарский перец", category: "Овощи", price: 119, old_price: 149, image: "assets/dj-green-pepper.webp", badge: "Эко", description: "Зеленый болгарский перец для салатов и горячих блюд." },
  { id: "potatoes", name: "Картофель", category: "Овощи", price: 99, old_price: 129, image: "assets/dj-potatoes.webp", badge: "Запас", description: "Картофель для гарниров, супов и запекания." },
  { id: "rice", name: "Рис", category: "Бакалея", price: 159, old_price: 199, image: "assets/dj-rice.webp", badge: "Домой", description: "Рис в упаковке для гарниров и домашних блюд." },
  { id: "cooking-oil", name: "Растительное масло", category: "Бакалея", price: 189, old_price: 229, image: "assets/dj-cooking-oil.webp", badge: "Кухня", description: "Растительное масло для жарки, салатов и выпечки." },
  { id: "honey-jar", name: "Мед", category: "Бакалея", price: 279, old_price: 349, image: "assets/dj-honey.webp", badge: "Сладко", description: "Банка меда к чаю, каше или десертам." },
  { id: "nescafe-coffee", name: "Кофе Nescafe", category: "Напитки", price: 399, old_price: 499, image: "assets/dj-coffee.webp", badge: "2 по цене 1", description: "Растворимый кофе Nescafe в фирменной упаковке." },
  { id: "juice", name: "Сок", category: "Напитки", price: 169, old_price: 209, image: "assets/dj-juice.webp", badge: "Витамин", description: "Сок в упаковке для завтрака и перекуса." },
  { id: "water", name: "Вода", category: "Напитки", price: 69, old_price: 89, image: "assets/dj-water.webp", badge: "Холодная", description: "Питьевая вода в бутылке для ежедневного заказа." },
];

let state = { products: [], category: "Все", query: "", cart: {}, user: null, delivery: "Доставка", authMode: "login", sort: "popular", editing: null };
const app = document.querySelector("#app");
const money = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";

const storageDb = {
  async load() {
    const raw = localStorage.getItem(`${SITE.db}:fallback`);
    if (!raw) return { products: [], users: [] };
    return JSON.parse(raw);
  },
  async save(data) {
    localStorage.setItem(`${SITE.db}:fallback`, JSON.stringify(data));
  },
};

let dbp = null;
function openDb() {
  if (!("indexedDB" in window)) return null;
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const request = indexedDB.open(SITE.db, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("products", { keyPath: "id" });
      db.createObjectStore("users", { keyPath: "email" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbp;
}

async function storeAll(name) {
  try {
    const db = await openDb();
    if (!db) throw new Error("no indexeddb");
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(name, "readonly");
      const req = tx.objectStore(name).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return (await storageDb.load())[name] || [];
  }
}

async function storePut(name, item) {
  try {
    const db = await openDb();
    if (!db) throw new Error("no indexeddb");
    await new Promise((resolve, reject) => {
      const tx = db.transaction(name, "readwrite");
      tx.objectStore(name).put(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const data = await storageDb.load();
    data[name] = (data[name] || []).filter((row) => row.id !== item.id && row.email !== item.email);
    data[name].push(item);
    await storageDb.save(data);
  }
}

async function storeDelete(name, key) {
  try {
    const db = await openDb();
    if (!db) throw new Error("no indexeddb");
    await new Promise((resolve, reject) => {
      const tx = db.transaction(name, "readwrite");
      tx.objectStore(name).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const data = await storageDb.load();
    data[name] = (data[name] || []).filter((row) => row.id !== key && row.email !== key);
    await storageDb.save(data);
  }
}

async function seedProducts() {
  const products = await storeAll("products");
  const versionKey = `${SITE.db}:catalogVersion`;
  if (products.length && localStorage.getItem(versionKey) === SITE.catalogVersion) return products;
  const defaultsById = new Map(INITIAL_PRODUCTS.map((product) => [product.id, product]));
  if (products.length) {
    for (const product of products) {
      const fresh = defaultsById.get(product.id);
      if (fresh) await storePut("products", { ...product, name: fresh.name });
    }
    for (const product of INITIAL_PRODUCTS) {
      if (!products.some((item) => item.id === product.id)) await storePut("products", product);
    }
    localStorage.setItem(versionKey, SITE.catalogVersion);
    return await storeAll("products");
  }
  for (const product of INITIAL_PRODUCTS) await storePut("products", product);
  localStorage.setItem(versionKey, SITE.catalogVersion);
  return INITIAL_PRODUCTS;
}

function loadCart() {
  state.cart = JSON.parse(localStorage.getItem(SITE.cart) || "{}");
}
function saveCart() {
  localStorage.setItem(SITE.cart, JSON.stringify(state.cart));
}
function cartItems() {
  return Object.entries(state.cart).map(([id, qty]) => ({ product: state.products.find((item) => item.id === id), qty })).filter((item) => item.product && item.qty > 0);
}
function cartTotal() {
  return cartItems().reduce((sum, item) => sum + item.product.price * item.qty, 0);
}
function setCart(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
  saveCart();
  render();
}
function filteredProducts() {
  const needle = state.query.trim().toLowerCase();
  const items = state.products.filter((product) => (state.category === "Все" || product.category === state.category) && (!needle || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(needle)));
  if (state.sort === "price") return items.sort((a, b) => a.price - b.price);
  if (state.sort === "discount") return items.sort((a, b) => b.old_price - b.price - (a.old_price - a.price));
  return items;
}

function render() {
  if (location.hash === "#admin") return renderAdmin();
  const categories = ["Все", ...new Set(state.products.map((product) => product.category))];
  const products = filteredProducts();
  const count = cartItems().reduce((sum, item) => sum + item.qty, 0);
  app.innerHTML = `
    <main>
      <header class="topbar">
        <div class="brand"><span>${SITE.mark}</span><div><strong>${SITE.title}</strong><small>${SITE.subtitle}</small></div></div>
        <input id="search" class="search" value="${state.query}" placeholder="${SITE.search}" />
        <div class="actions"><button id="adminOpen">Админ</button><button id="authOpen">${state.user ? state.user.name : "Войти"}</button><button id="cartFocus">Корзина <b>${count}</b></button></div>
      </header>
      <section class="hero">
        <div class="hero-card">
          <div class="hero-nav"><button type="button" id="scrollCatalogTop">←</button><div><button type="button">♡</button><button type="button">⋮</button></div></div>
          <div class="hero-copy">
            <h1>${SITE.hero}<span>${SITE.heroAccent}</span></h1>
            <p>${SITE.copy}</p>
            <div class="hero-meta"><span>Время: 15 мин</span><span>Итого от: 109 ₽</span></div>
            <div class="hero-actions"><button id="scrollCatalog">${SITE.cta}</button><button type="button" id="cartFocusHero">+</button></div>
          </div>
          <img src="${SITE.heroImage}" alt="${SITE.title}" />
        </div>
      </section>
      <section class="promo">${SITE.promos.map(([a, b]) => `<div><strong>${a}</strong><span>${b}</span></div>`).join("")}</section>
      <section class="layout" id="catalog">
        <aside class="filters"><h2>Категории</h2>${categories.map((category) => `<button class="${category === state.category ? "active" : ""}" data-category="${category}">${category}</button>`).join("")}</aside>
        <section><div class="head"><div><h2>Лента товаров</h2><span>${products.length} позиций</span></div><select id="sort"><option value="popular" ${state.sort === "popular" ? "selected" : ""}>Популярное</option><option value="price" ${state.sort === "price" ? "selected" : ""}>По цене</option><option value="discount" ${state.sort === "discount" ? "selected" : ""}>По скидке</option></select></div><div class="grid">${products.map(renderProduct).join("")}</div></section>
        ${renderCart()}
      </section>
      ${renderAuth()}
    </main>`;
  bindEvents();
}

function renderProduct(product) {
  const qty = state.cart[product.id] || 0;
  return `<article class="card"><div class="photo"><img src="${product.image}" alt="${product.name}" /><span>${product.badge}</span></div><small>${product.category}</small><h3>${product.name}</h3><p>${product.description}</p><div class="price"><strong>${money(product.price)}</strong><del>${money(product.old_price)}</del></div>${qty ? `<div class="qty"><button data-dec="${product.id}">-</button><b>${qty}</b><button data-inc="${product.id}">+</button></div>` : `<button class="buy" data-add="${product.id}">В корзину</button>`}</article>`;
}
function renderCart() {
  const items = cartItems();
  return `<aside class="cart" id="cart"><h2>Корзина</h2><div class="cart-list">${items.length ? items.map(({ product, qty }) => `<div class="cart-row"><div><strong>${product.name}</strong><span>${qty} x ${money(product.price)}</span></div><div class="qty"><button data-dec="${product.id}">-</button><b>${qty}</b><button data-inc="${product.id}">+</button></div></div>`).join("") : "<p>Добавьте товары из ленты.</p>"}</div><div class="total"><span>Итого</span><b>${money(cartTotal())}</b></div><div class="segments"><button class="${state.delivery === "Доставка" ? "active" : ""}" data-delivery="Доставка">Доставка</button><button class="${state.delivery === "Самовывоз" ? "active" : ""}" data-delivery="Самовывоз">Самовывоз</button></div><textarea id="address" rows="3" placeholder="Адрес доставки или пункт самовывоза"></textarea><button class="checkout" id="checkout" ${items.length ? "" : "disabled"}>Оформить заказ</button><div class="notice" id="orderNotice"></div></aside>`;
}
function renderAuth() {
  return `<div class="modal" id="authModal"><section class="auth"><div class="segments"><button class="${state.authMode === "login" ? "active" : ""}" data-auth-mode="login">Вход</button><button class="${state.authMode === "register" ? "active" : ""}" data-auth-mode="register">Регистрация</button></div><h2>${state.authMode === "login" ? "Войти" : "Создать профиль"}</h2><form id="authForm">${state.authMode === "register" ? '<input name="name" placeholder="Имя" />' : ""}<input name="email" type="email" placeholder="Email" required /><input name="password" type="password" placeholder="Пароль" required /><button class="checkout">${state.authMode === "login" ? "Войти" : "Зарегистрироваться"}</button>${state.user ? '<button type="button" id="logout">Выйти</button>' : ""}<button type="button" id="authClose">Закрыть</button></form><div class="notice" id="authNotice"></div></section></div>`;
}

function adminProduct() {
  return state.editing || { id: "", name: "", category: "", price: "", old_price: "", image: "assets/", badge: "", description: "" };
}
function renderAdmin() {
  const item = adminProduct();
  app.innerHTML = `
    <main class="admin-page">
      <header class="topbar"><div class="brand"><span>${SITE.mark}</span><div><strong>${SITE.title}</strong><small>админ-панель</small></div></div><div></div><div class="actions"><button id="siteOpen">На сайт</button></div></header>
      <section class="admin-layout">
        <form class="admin-form" id="productForm">
          <h1>${state.editing ? "Редактировать товар" : "Добавить товар"}</h1>
          <label>ID<input name="id" value="${item.id}" ${state.editing ? "readonly" : ""} required /></label>
          <label>Название<input name="name" value="${item.name}" required /></label>
          <label>Категория<input name="category" value="${item.category}" required /></label>
          <div class="admin-two"><label>Цена<input name="price" type="number" min="1" value="${item.price}" required /></label><label>Старая цена<input name="old_price" type="number" min="1" value="${item.old_price}" required /></label></div>
          <label>Фото<input name="image" value="${item.image}" required /></label>
          <label>Бейдж<input name="badge" value="${item.badge}" /></label>
          <label>Описание<textarea name="description" rows="4" required>${item.description}</textarea></label>
          <div class="admin-actions"><button class="checkout">${state.editing ? "Сохранить" : "Добавить"}</button><button type="button" id="resetAdmin">Сбросить</button></div>
          <div class="notice" id="adminNotice"></div>
        </form>
        <section class="admin-table"><div class="head"><div><h2>Товары</h2><span>${state.products.length} позиций</span></div></div>${state.products.map(renderAdminRow).join("")}</section>
      </section>
    </main>`;
  bindAdminEvents();
}
function renderAdminRow(product) {
  return `<article class="admin-row"><img src="${product.image}" alt="${product.name}" /><div><strong>${product.name}</strong><span>${product.id} · ${product.category} · ${money(product.price)}</span><p>${product.description}</p></div><div class="admin-row-actions"><button data-edit="${product.id}">Редактировать</button><button data-delete="${product.id}">Удалить</button></div></article>`;
}

function bindEvents() {
  document.querySelector("#adminOpen")?.addEventListener("click", () => { location.hash = "admin"; });
  document.querySelector("#search")?.addEventListener("input", (event) => { state.query = event.target.value; render(); });
  document.querySelector("#sort")?.addEventListener("change", (event) => { state.sort = event.target.value; render(); });
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.category; render(); }));
  document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => setCart(button.dataset.add, 1)));
  document.querySelectorAll("[data-inc]").forEach((button) => button.addEventListener("click", () => setCart(button.dataset.inc, (state.cart[button.dataset.inc] || 0) + 1)));
  document.querySelectorAll("[data-dec]").forEach((button) => button.addEventListener("click", () => setCart(button.dataset.dec, (state.cart[button.dataset.dec] || 0) - 1)));
  document.querySelectorAll("[data-delivery]").forEach((button) => button.addEventListener("click", () => { state.delivery = button.dataset.delivery; render(); }));
  document.querySelector("#scrollCatalog")?.addEventListener("click", () => document.querySelector("#catalog").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("#scrollCatalogTop")?.addEventListener("click", () => document.querySelector("#catalog").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("#cartFocus")?.addEventListener("click", () => document.querySelector("#cart").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("#cartFocusHero")?.addEventListener("click", () => document.querySelector("#cart").scrollIntoView({ behavior: "smooth" }));
  document.querySelector("#authOpen")?.addEventListener("click", () => document.querySelector("#authModal").classList.add("open"));
  document.querySelector("#authClose")?.addEventListener("click", () => document.querySelector("#authModal").classList.remove("open"));
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => { state.authMode = button.dataset.authMode; render(); document.querySelector("#authModal").classList.add("open"); }));
  document.querySelector("#authForm")?.addEventListener("submit", submitAuth);
  document.querySelector("#logout")?.addEventListener("click", logout);
  document.querySelector("#checkout")?.addEventListener("click", checkout);
}
function bindAdminEvents() {
  document.querySelector("#siteOpen")?.addEventListener("click", () => { location.hash = ""; });
  document.querySelector("#productForm")?.addEventListener("submit", saveProduct);
  document.querySelector("#resetAdmin")?.addEventListener("click", () => { state.editing = null; renderAdmin(); });
  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => { state.editing = state.products.find((product) => product.id === button.dataset.edit); renderAdmin(); }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteProduct(button.dataset.delete)));
}

async function submitAuth(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const users = await storeAll("users");
  const email = data.email.trim().toLowerCase();
  if (state.authMode === "register") {
    if (users.some((user) => user.email === email)) return showNotice("authNotice", "Такой email уже зарегистрирован.");
    const user = { name: data.name || "Пользователь", email, password: data.password };
    await storePut("users", user);
    state.user = { name: user.name, email: user.email };
  } else {
    const user = users.find((item) => item.email === email && item.password === data.password);
    if (!user) return showNotice("authNotice", "Неверный email или пароль.");
    state.user = { name: user.name, email: user.email };
  }
  localStorage.setItem(SITE.session, JSON.stringify(state.user));
  render();
}
function logout() {
  state.user = null;
  localStorage.removeItem(SITE.session);
  render();
}
function showNotice(id, text) {
  const notice = document.querySelector(`#${id}`);
  notice.textContent = text;
  notice.classList.add("show");
}
async function saveProduct(event) {
  event.preventDefault();
  const product = Object.fromEntries(new FormData(event.target).entries());
  product.price = Number(product.price);
  product.old_price = Number(product.old_price);
  await storePut("products", product);
  state.products = await storeAll("products");
  state.editing = null;
  renderAdmin();
}
async function deleteProduct(id) {
  if (!confirm("Удалить товар?")) return;
  await storeDelete("products", id);
  delete state.cart[id];
  saveCart();
  state.products = await storeAll("products");
  state.editing = null;
  renderAdmin();
}
function checkout() {
  const notice = document.querySelector("#orderNotice");
  notice.textContent = state.user ? `${state.user.name}, заказ на ${money(cartTotal())} принят. ${state.delivery}: ${document.querySelector("#address").value || "уточним при подтверждении"}.` : "Для оформления войдите или зарегистрируйтесь.";
  notice.classList.add("show");
}
async function start() {
  loadCart();
  state.user = JSON.parse(localStorage.getItem(SITE.session) || "null");
  state.products = await seedProducts();
  render();
}
window.addEventListener("hashchange", render);
start();
