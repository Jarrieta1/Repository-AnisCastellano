/* =========================================================
   Anis Castellano Tienda Cosmetic
   El catálogo se carga desde la API /api/productos
   (Express lee y parsea productos_capilares.csv en el
   servidor; el navegador nunca lee el CSV directamente).
   Las fotos viven en img/ con slug del producto.
   ========================================================= */

let PRODUCTS = [];

async function cargarProductos() {
  const res = await fetch("/api/productos");
  if (!res.ok) throw new Error(`API /api/productos respondió ${res.status}`);
  const datos = await res.json();
  if (!Array.isArray(datos) || !datos.length)
    throw new Error("La API devolvió un catálogo vacío");
  return datos;
}

/* ---------- Estado ---------- */
const state = {
  categoria: "Todos",
  busqueda: "",
  orden: "default",
  favoritos: new Set(JSON.parse(localStorage.getItem("acc-favs") || "[]")),
  carrito: JSON.parse(localStorage.getItem("acc-cart") || "[]"),
  productoActual: null,
  qty: 1,
};

/* ---------- Utilidades ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const formatPrecio = (n) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

function placeholderSVG(producto) {
  const label = producto.categoria;
  const iniciales = producto.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f3eaf6"/>
          <stop offset="100%" stop-color="#fbf3d9"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <circle cx="200" cy="225" r="88" fill="#ffffff" opacity="0.85"/>
      <text x="200" y="245" font-family="Georgia, serif" font-size="54" fill="#4d1b5d" text-anchor="middle" font-weight="bold">${iniciales}</text>
      <text x="200" y="360" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#6f6a63" text-anchor="middle">${label}</text>
      <text x="200" y="390" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#c99212" text-anchor="middle">Coloca tu foto en /img</text>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.trim());
}

function imgSrc(producto) {
  return producto.imagen || placeholderSVG(producto);
}

/* ---------- Lupa (zoom de imágenes) ---------- */
const LUPA_D = 140; // diámetro en px
const LUPA_ZOOM = 2.4;

function montarLupa(wrap) {
  if (!wrap || wrap.dataset.lupa) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const img = wrap.querySelector("img");
  if (!img) return;
  wrap.dataset.lupa = "1";

  const lupa = document.createElement("span");
  lupa.className = "lupa";
  lupa.setAttribute("aria-hidden", "true");
  lupa.style.width = lupa.style.height = `${LUPA_D}px`;
  wrap.appendChild(lupa);

  wrap.addEventListener("mousemove", (e) => {
    const box = wrap.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    if (x < 0 || y < 0 || x > box.width || y > box.height) {
      wrap.classList.remove("is-lupa");
      return;
    }
    if (!img.complete || !img.naturalWidth) return;

    // La lupa se muestra sin escala en la imagen (evita el zoom de hover)
    wrap.classList.add("is-lupa");

    const half = LUPA_D / 2;
    const cx = Math.min(Math.max(x, half), box.width - half);
    const cy = Math.min(Math.max(y, half), box.height - half);
    lupa.style.left = `${cx - half}px`;
    lupa.style.top = `${cy - half}px`;

    // Réplica del object-fit: cover dentro de la lupa
    const escala = Math.max(
      box.width / img.naturalWidth,
      box.height / img.naturalHeight,
    );
    const dw = img.naturalWidth * escala;
    const dh = img.naturalHeight * escala;
    const ox = (box.width - dw) / 2;
    const oy = (box.height - dh) / 2;
    lupa.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lupa.style.backgroundSize = `${dw * LUPA_ZOOM}px ${dh * LUPA_ZOOM}px`;
    lupa.style.backgroundPosition =
      `${half - (cx - ox) * LUPA_ZOOM}px ${half - (cy - oy) * LUPA_ZOOM}px`;
  });

  wrap.addEventListener("mouseleave", () => wrap.classList.remove("is-lupa"));
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0))
  );
}

function persistir() {
  localStorage.setItem("acc-cart", JSON.stringify(state.carrito));
  localStorage.setItem("acc-favs", JSON.stringify([...state.favoritos]));
}

/* ---------- Filtros y render ---------- */
function obtenerCategorias() {
  return ["Todos", ...new Set(PRODUCTS.map((p) => p.categoria))];
}

function renderFiltros() {
  const cont = $("#filters");
  cont.innerHTML = "";
  obtenerCategorias().forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (state.categoria === cat ? " is-active" : "");
    btn.textContent = cat;
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", () => {
      state.categoria = cat;
      renderFiltros();
      renderProductos();
    });
    cont.appendChild(btn);
  });
}

function productosFiltrados() {
  let lista = PRODUCTS.filter((p) => {
    const okCat =
      state.categoria === "Todos" || p.categoria === state.categoria;
    const q = state.busqueda.trim().toLowerCase();
    const okBusqueda =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q);
    return okCat && okBusqueda;
  });

  switch (state.orden) {
    case "price-asc":
      lista = lista.sort((a, b) => a.precio - b.precio);
      break;
    case "price-desc":
      lista = lista.sort((a, b) => b.precio - a.precio);
      break;
    case "name-asc":
      lista = lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      break;
    default:
      lista = lista.sort(
        (a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0),
      );
  }
  return lista;
}

function renderProductos() {
  const grid = $("#productGrid");
  const empty = $("#emptyState");
  const lista = productosFiltrados();

  $("#results").textContent =
    lista.length === 0
      ? "Sin resultados"
      : `${lista.length} producto${lista.length > 1 ? "s" : ""}`;

  grid.innerHTML = "";
  empty.hidden = lista.length > 0;

  lista.forEach((p, i) => {
    const fav = state.favoritos.has(p.id);
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${i * 40}ms`;

    let badge = "";
    if (p.descuento > 0) badge = `<span class="badge">-${p.descuento}%</span>`;
    else if (p.nuevo) badge = `<span class="badge badge--gold">Nuevo</span>`;
    else if (p.destacado) badge = `<span class="badge badge--dark">Top</span>`;

    card.innerHTML = `
      <div class="card__media">
        ${badge}
        <button class="wish ${fav ? "is-on" : ""}" data-fav="${p.id}" aria-label="Favorito">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>
          </svg>
        </button>
        <img src="${imgSrc(p)}" alt="${p.nombre}" loading="lazy"
             onerror="this.onerror=null;this.src='${placeholderSVG(p)}'" />
      </div>
      <div class="card__body">
        <span class="card__cat">${p.categoria}</span>
        <h3 class="card__title">${p.nombre}</h3>
        ${
          p.rating
            ? `<div class="card__rating">
          <span class="stars">${stars(p.rating)}</span>
          <span>${p.rating} (${p.resenas})</span>
        </div>`
            : ""
        }
        <div class="card__price">
          <span class="price">${formatPrecio(p.precio)}</span>
          ${p.precioAntes ? `<span class="price-old">${formatPrecio(p.precioAntes)}</span>` : ""}
        </div>
        <div class="card__actions">
          <button class="btn btn--primary" data-add="${p.id}">Agregar</button>
          <button class="btn btn--soft" data-view="${p.id}">Ver detalle</button>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

/* ---------- Modal ---------- */
function abrirModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  state.productoActual = p;
  state.qty = 1;

  const img = $("#modalImg");
  img.src = imgSrc(p);
  img.alt = p.nombre;
  img.onerror = () => {
    img.onerror = null;
    img.src = placeholderSVG(p);
  };

  $("#modalCat").textContent = p.categoria;
  $("#modalTitle").textContent = p.nombre;
  $("#modalRating").innerHTML = p.rating
    ? `<span class="stars">${stars(p.rating)}</span> ${p.rating} · ${p.resenas} reseñas`
    : "";
  $("#modalDesc").textContent = p.descripcion;
  $("#modalPrice").textContent = formatPrecio(p.precio);
  $("#modalOldPrice").textContent = p.precioAntes
    ? formatPrecio(p.precioAntes)
    : "";
  $("#qtyInput").value = 1;

  const specs = $("#modalSpecs");
  specs.innerHTML = "";
  Object.entries(p.especificaciones || {}).forEach(([k, v]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${k}</span><strong>${v}</strong>`;
    specs.appendChild(li);
  });

  $("#productModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  $("#productModal").hidden = true;
  document.body.style.overflow = "";
  state.productoActual = null;
}

/* ---------- Carrito ---------- */
function agregarAlCarrito(id, qty = 1) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const existente = state.carrito.find((i) => i.id === id);
  if (existente) existente.cantidad = Math.min(20, existente.cantidad + qty);
  else state.carrito.push({ id, cantidad: Math.min(20, qty) });
  persistir();
  renderCarrito();
  toast(`${p.nombre} agregado al carrito`);
}

function cambiarCantidad(id, delta) {
  const item = state.carrito.find((i) => i.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0)
    state.carrito = state.carrito.filter((i) => i.id !== id);
  item.cantidad = Math.min(20, item.cantidad);
  persistir();
  renderCarrito();
}

function eliminarDelCarrito(id) {
  state.carrito = state.carrito.filter((i) => i.id !== id);
  persistir();
  renderCarrito();
}

function renderCarrito() {
  const cont = $("#cartItems");
  const empty = $("#cartEmpty");
  const footer = $("#cartFooter");
  const total = state.carrito.reduce((acc, item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    return acc + (p ? p.precio * item.cantidad : 0);
  }, 0);
  const count = state.carrito.reduce((acc, i) => acc + i.cantidad, 0);

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = formatPrecio(total);

  const vacio = state.carrito.length === 0;
  empty.classList.toggle("is-visible", vacio);
  footer.hidden = vacio;
  cont.style.display = vacio ? "none" : "flex";

  cont.innerHTML = "";
  state.carrito.forEach((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (!p) return;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${imgSrc(p)}" alt="${p.nombre}"
           onerror="this.onerror=null;this.src='${placeholderSVG(p)}'" />
      <div>
        <h4>${p.nombre}</h4>
        <small>${formatPrecio(p.precio)} c/u</small>
        <div class="cart-item__qty">
          <button data-dec="${p.id}" aria-label="Restar">−</button>
          <span>${item.cantidad}</span>
          <button data-inc="${p.id}" aria-label="Sumar">+</button>
        </div>
      </div>
      <div class="cart-item__side">
        <span class="price">${formatPrecio(p.precio * item.cantidad)}</span>
        <button class="cart-item__remove" data-del="${p.id}">Quitar</button>
      </div>`;
    cont.appendChild(div);
  });
}

function abrirCarrito(open) {
  $("#cartPanel").classList.toggle("is-open", open);
  $("#cartPanel").setAttribute("aria-hidden", String(!open));
  $("#cartOverlay").hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
}

function finalizarPedido() {
  if (!state.carrito.length) return;
  const lineas = state.carrito.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    return `• ${p.nombre} x${item.cantidad} — ${formatPrecio(p.precio * item.cantidad)}`;
  });
  const total = state.carrito.reduce((acc, item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    return acc + p.precio * item.cantidad;
  }, 0);
  const texto =
    `¡Hola Anis Castellano Tienda Cosmetic! 👋\n\n` +
    `Quiero hacer este pedido:\n${lineas.join("\n")}\n\n` +
    `*Total: ${formatPrecio(total)}*\n\n` +
    `Gracias.`;
  window.open(
    `https://wa.me/573004310874?text=${encodeURIComponent(texto)}`,
    "_blank",
  );
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
}

/* ---------- Eventos ---------- */
function bindEvents() {
  // Buscador
  $("#searchInput").addEventListener("input", (e) => {
    state.busqueda = e.target.value;
    renderProductos();
  });

  // Orden
  $("#sortSelect").addEventListener("change", (e) => {
    state.orden = e.target.value;
    renderProductos();
  });

  // Reset filtros
  $("#resetFilters").addEventListener("click", () => {
    state.categoria = "Todos";
    state.busqueda = "";
    state.orden = "default";
    $("#searchInput").value = "";
    $("#sortSelect").value = "default";
    renderFiltros();
    renderProductos();
  });

  // Grid: agregar / detalle / favoritos (delegación)
  $("#productGrid").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const view = e.target.closest("[data-view]");
    const fav = e.target.closest("[data-fav]");
    if (add) agregarAlCarrito(Number(add.dataset.add));
    if (view) abrirModal(Number(view.dataset.view));
    if (fav) {
      const id = Number(fav.dataset.fav);
      if (state.favoritos.has(id)) state.favoritos.delete(id);
      else state.favoritos.add(id);
      persistir();
      renderProductos();
    }
  });

  // Modal
  montarLupa($(".modal__media"));
  $$("[data-close]").forEach((el) => el.addEventListener("click", cerrarModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cerrarModal();
      abrirCarrito(false);
    }
  });
  $("#qtyMinus").addEventListener("click", () => {
    state.qty = Math.max(1, state.qty - 1);
    $("#qtyInput").value = state.qty;
  });
  $("#qtyPlus").addEventListener("click", () => {
    state.qty = Math.min(20, state.qty + 1);
    $("#qtyInput").value = state.qty;
  });
  $("#modalAdd").addEventListener("click", () => {
    if (state.productoActual) {
      agregarAlCarrito(state.productoActual.id, state.qty);
      cerrarModal();
      abrirCarrito(true);
    }
  });

  // Carrito
  $("#cartBtn").addEventListener("click", () => abrirCarrito(true));
  $("#cartClose").addEventListener("click", () => abrirCarrito(false));
  $("#cartOverlay").addEventListener("click", () => abrirCarrito(false));
  $("#cartShop").addEventListener("click", () => {
    abrirCarrito(false);
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  });
  $("#cartItems").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const del = e.target.closest("[data-del]");
    if (inc) cambiarCantidad(Number(inc.dataset.inc), 1);
    if (dec) cambiarCantidad(Number(dec.dataset.dec), -1);
    if (del) eliminarDelCarrito(Number(del.dataset.del));
  });
  $("#checkoutBtn").addEventListener("click", finalizarPedido);

  // Nav móvil
  const navToggle = $("#navToggle");
  const nav = $("#nav");
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }),
  );
}

function renderFooterCategorias() {
  const cont = $("#footerCats");
  cont.innerHTML = "";
  const cats = [...new Set(PRODUCTS.map((p) => p.categoria))];
  cats.forEach((cat) => {
    const a = document.createElement("a");
    a.href = "#catalogo";
    a.textContent = cat;
    a.dataset.footerCat = cat;
    cont.appendChild(a);
  });
}

function bindFooterCategorias() {
  $$("[data-footer-cat]").forEach((a) =>
    a.addEventListener("click", () => {
      state.categoria = a.dataset.footerCat;
      renderFiltros();
      renderProductos();
    }),
  );
}

/* ---------- Init ---------- */
async function init() {
  $("#year").textContent = new Date().getFullYear();
  renderCarrito();
  bindEvents();

  const grid = $("#productGrid");
  const empty = $("#emptyState");
  const results = $("#results");

  results.textContent = "Cargando productos...";
  grid.innerHTML = "";
  empty.hidden = true;

  try {
    PRODUCTS = await cargarProductos();
  } catch (err) {
    console.error(err);
    results.textContent = "";
    grid.innerHTML = "";
    empty.hidden = false;
    empty.querySelector("h3").textContent = "No se pudo cargar el catálogo";
    empty.querySelector("p").textContent =
      "No pudimos consultar la API del catálogo. Intenta de nuevo en unos segundos.";
    return;
  }

  renderFiltros();
  renderFooterCategorias();
  bindFooterCategorias();
  renderProductos();
}

document.addEventListener("DOMContentLoaded", init);
