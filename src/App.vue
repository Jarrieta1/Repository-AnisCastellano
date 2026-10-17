<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { cargarProductos } from './services/productService'
import { formatPrecio } from './utils/formatPrice'
import Navbar from './components/Navbar.vue'
import ProductFilters from './components/ProductFilters.vue'
import ProductList from './components/ProductList.vue'
import ProductModal from './components/ProductModal.vue'
import CartPanel from './components/CartPanel.vue'
import AppFooter from './components/AppFooter.vue'

/* ---------- Estado ---------- */
const productos = ref([])
const cargando = ref(true)
const error = ref('')
const categoria = ref('Todos')
const busqueda = ref('')
const orden = ref('default')
const favoritos = ref(JSON.parse(localStorage.getItem('acc-favs') || '[]'))
const carrito = ref(JSON.parse(localStorage.getItem('acc-cart') || '[]'))
const productoModal = ref(null)
const modalQty = ref(1)
const carritoAbierto = ref(false)
const toastMsg = ref('')
const toastAccionTexto = ref('')
let toastAccionFn = null
let toastTimer = null

/* ---------- Persistencia (mismas claves que el frontend anterior) ---------- */
watch(
  carrito,
  () => localStorage.setItem('acc-cart', JSON.stringify(carrito.value)),
  { deep: true },
)
watch(
  favoritos,
  () => localStorage.setItem('acc-favs', JSON.stringify(favoritos.value)),
  { deep: true },
)

/* ---------- Datos derivados ---------- */
const categorias = computed(() => [
  'Todos',
  ...new Set(productos.value.map((p) => p.categoria)),
])

const categoriasPie = computed(() => [
  ...new Set(productos.value.map((p) => p.categoria)),
])

const productosFiltrados = computed(() => {
  let lista = productos.value.filter((p) => {
    const okCat = categoria.value === 'Todos' || p.categoria === categoria.value
    const q = busqueda.value.trim().toLowerCase()
    const okBusqueda =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q)
    return okCat && okBusqueda
  })

  switch (orden.value) {
    case 'price-asc':
      lista = lista.slice().sort((a, b) => a.precio - b.precio)
      break
    case 'price-desc':
      lista = lista.slice().sort((a, b) => b.precio - a.precio)
      break
    case 'name-asc':
      lista = lista.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      break
    default:
      lista = lista
        .slice()
        .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))
  }
  return lista
})

const resultadosTexto = computed(() => {
  if (cargando.value) return 'Cargando productos…'
  if (error.value) return ''
  const n = productosFiltrados.value.length
  return n === 0 ? 'Sin resultados' : `${n} producto${n > 1 ? 's' : ''}`
})

const mostrarVacio = computed(
  () =>
    !cargando.value &&
    (error.value !== '' || productosFiltrados.value.length === 0),
)

const carritoItems = computed(() =>
  carrito.value
    .map((item) => {
      const p = productos.value.find((x) => x.id === item.id)
      return p ? { producto: p, cantidad: item.cantidad } : null
    })
    .filter(Boolean),
)

const carritoCount = computed(() =>
  carrito.value.reduce((acc, i) => acc + i.cantidad, 0),
)

const carritoTotal = computed(() =>
  carrito.value.reduce((acc, item) => {
    const p = productos.value.find((x) => x.id === item.id)
    return acc + (p ? p.precio * item.cantidad : 0)
  }, 0),
)

/* ---------- Carga de productos ---------- */
async function init() {
  cargando.value = true
  try {
    productos.value = await cargarProductos()
    error.value = ''
    leerFiltrosDeURL()
  } catch (err) {
    console.error(err)
    error.value = err.message
  } finally {
    cargando.value = false
  }
}

/* ---------- Filtros ---------- */
function resetFiltros() {
  categoria.value = 'Todos'
  busqueda.value = ''
  orden.value = 'default'
}

/* ---------- Sync filtros ↔ URL ---------- */
function leerFiltrosDeURL() {
  const params = new URLSearchParams(window.location.search)
  const cat = params.get('cat')
  const q = params.get('q')
  const ord = params.get('orden')
  if (cat && categorias.value.includes(cat)) categoria.value = cat
  if (q) busqueda.value = q
  if (ord && ['default', 'price-asc', 'price-desc', 'name-asc'].includes(ord))
    orden.value = ord
}

watch([categoria, busqueda, orden], () => {
  const params = new URLSearchParams()
  if (categoria.value !== 'Todos') params.set('cat', categoria.value)
  if (busqueda.value.trim()) params.set('q', busqueda.value.trim())
  if (orden.value !== 'default') params.set('orden', orden.value)
  const qs = params.toString()
  history.replaceState(null, '', qs ? `?${qs}${location.hash}` : `${location.pathname}${location.hash}`)
})

function seleccionarCategoria(cat) {
  categoria.value = cat
}

function alternarFavorito(id) {
  const i = favoritos.value.indexOf(id)
  if (i >= 0) favoritos.value.splice(i, 1)
  else favoritos.value.push(id)
}

/* ---------- Modal ---------- */
function abrirModal(id) {
  const p = productos.value.find((x) => x.id === id)
  if (!p) return
  productoModal.value = p
  modalQty.value = 1
}

function cerrarModal() {
  productoModal.value = null
}

function sumarQty() {
  modalQty.value = Math.min(20, modalQty.value + 1)
}

function restarQty() {
  modalQty.value = Math.max(1, modalQty.value - 1)
}

function agregarDesdeModal() {
  if (!productoModal.value) return
  agregarAlCarrito(productoModal.value.id, modalQty.value)
  cerrarModal()
  carritoAbierto.value = true
}

/* ---------- Carrito ---------- */
function agregarAlCarrito(id, qty = 1) {
  const p = productos.value.find((x) => x.id === id)
  if (!p) return
  const existente = carrito.value.find((i) => i.id === id)
  if (existente) existente.cantidad = Math.min(20, existente.cantidad + qty)
  else carrito.value.push({ id, cantidad: Math.min(20, qty) })
  toast(`${p.nombre} agregado al carrito`)
}

function cambiarCantidad(id, delta) {
  const item = carrito.value.find((i) => i.id === id)
  if (!item) return
  item.cantidad += delta
  if (item.cantidad <= 0)
    carrito.value = carrito.value.filter((i) => i.id !== id)
  else item.cantidad = Math.min(20, item.cantidad)
}

function eliminarDelCarrito(id) {
  const idx = carrito.value.findIndex((i) => i.id === id)
  if (idx < 0) return
  const [item] = carrito.value.splice(idx, 1)
  const p = productos.value.find((x) => x.id === item.id)
  toast(`${p?.nombre ?? 'Producto'} retirado del carrito`, {
    texto: 'Deshacer',
    fn: () => carrito.value.splice(idx, 0, item),
  })
}

function irAlCatalogo() {
  carritoAbierto.value = false
  scrollSuave(document.getElementById('catalogo'))
}

function scrollSuave(el) {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

function finalizarPedido() {
  if (!carrito.value.length) return
  const lineas = carrito.value.map((item) => {
    const p = productos.value.find((x) => x.id === item.id)
    return `• ${p.nombre} x${item.cantidad} — ${formatPrecio(p.precio * item.cantidad)}`
  })
  const texto =
    `¡Hola Anis Castellano Tienda Cosmetic! 👋\n\n` +
    `Quiero hacer este pedido:\n${lineas.join('\n')}\n\n` +
    `*Total: ${formatPrecio(carritoTotal.value)}*\n\n` +
    `Gracias.`
  window.open(
    `https://wa.me/573004310874?text=${encodeURIComponent(texto)}`,
    '_blank',
  )
}

/* ---------- Toast ---------- */
function toast(msg, accion = null) {
  toastMsg.value = msg
  toastAccionTexto.value = accion?.texto ?? ''
  toastAccionFn = accion?.fn ?? null
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
    toastAccionTexto.value = ''
    toastAccionFn = null
  }, accion ? 5000 : 2600)
}

function ejecutarToastAccion() {
  toastAccionFn?.()
  toastMsg.value = ''
  toastAccionTexto.value = ''
  toastAccionFn = null
  clearTimeout(toastTimer)
}

/* ---------- Tecla Escape: cierra modal y carrito ---------- */
function onKeydown(e) {
  if (e.key === 'Escape') {
    cerrarModal()
    carritoAbierto.value = false
  }
}

/* ---------- Bloqueo de scroll al abrir modal o carrito ---------- */
watch([productoModal, carritoAbierto], ([modal, cart]) => {
  document.body.style.overflow = modal || cart ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  init()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <a class="skip-link" href="#catalogo">Saltar al catálogo</a>
  <div id="inicio"></div>
  <Navbar :cart-count="carritoCount" @open-cart="carritoAbierto = true" />

  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__content">
        <span class="eyebrow">Línea profesional capilar</span>
        <h1>Belleza que realza tu cabello</h1>
        <p>Descubre shampoos, mascarillas, tratamientos y kits de las mejores marcas. Nutrición, reparación y brillo con precios que te van a encantar.</p>
        <div class="hero__actions">
          <a href="#catalogo" class="btn btn--primary">Ver catálogo</a>
          <a href="#contacto" class="btn btn--ghost">Escribir por WhatsApp</a>
        </div>
        <ul class="hero__features">
          <li><strong>+35</strong><span>Productos</span></li>
          <li><strong>100%</strong><span>Originales</span></li>
          <li><strong>Físico</strong><span>Punto de venta</span></li>
        </ul>
      </div>
      <div class="hero__art" aria-hidden="true">
        <div class="hero__arch">
          <svg class="hero__hair" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke-linecap="round">
              <path d="M40 -20 C 90 60, 20 140, 70 220 C 118 296, 48 350, 88 430" stroke="#ffffff" stroke-width="24" opacity="0.30"/>
              <path d="M110 -20 C 165 55, 90 135, 140 215 C 188 292, 118 348, 158 430" stroke="#ffffff" stroke-width="28" opacity="0.45"/>
              <path d="M185 -20 C 240 60, 165 140, 215 220 C 262 296, 192 352, 232 430" stroke="#ffffff" stroke-width="24" opacity="0.30"/>
              <path d="M75 -20 C 128 58, 53 138, 103 218 C 150 294, 80 350, 120 430" stroke="#E1B21D" stroke-width="6" opacity="0.9"/>
              <path d="M150 -20 C 205 58, 130 138, 180 218 C 226 294, 156 350, 196 430" stroke="#E1B21D" stroke-width="4" opacity="0.55"/>
            </g>
            <path d="M255 78 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5 z" fill="#E1B21D"/>
            <path d="M48 300 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#ffffff" opacity="0.9"/>
            <circle cx="42" cy="150" r="3.5" fill="#E1B21D" opacity="0.8"/>
            <circle cx="262" cy="250" r="3" fill="#ffffff" opacity="0.7"/>
          </svg>
        </div>

        <div class="hero__seal">AC</div>

        <div class="hero__tile hero__tile--1">
          <div class="hero__tile-art">
            <svg viewBox="0 0 64 96" role="img">
              <rect x="24" y="4" width="16" height="14" rx="3" fill="#E1B21D"/>
              <rect x="27" y="16" width="10" height="6" fill="#C99212"/>
              <rect x="12" y="20" width="40" height="72" rx="12" fill="#4D1B5D"/>
              <rect x="16" y="28" width="6" height="48" rx="3" fill="#ffffff" opacity="0.15"/>
              <rect x="18" y="42" width="28" height="30" rx="6" fill="#FDFBF7"/>
              <rect x="23" y="50" width="18" height="4" rx="2" fill="#E1B21D"/>
              <rect x="23" y="58" width="14" height="3" rx="1.5" fill="#C9BCC4"/>
              <rect x="23" y="64" width="16" height="3" rx="1.5" fill="#C9BCC4"/>
            </svg>
          </div>
          <span>Shampoos</span>
        </div>

        <div class="hero__tile hero__tile--2">
          <div class="hero__tile-art">
            <svg viewBox="0 0 64 96" role="img">
              <rect x="10" y="26" width="44" height="15" rx="6" fill="#E1B21D"/>
              <rect x="12" y="37" width="40" height="6" rx="3" fill="#C99212"/>
              <rect x="14" y="42" width="36" height="46" rx="10" fill="#4D1B5D"/>
              <rect x="19" y="50" width="7" height="28" rx="3.5" fill="#ffffff" opacity="0.15"/>
              <circle cx="36" cy="66" r="9" fill="#FDFBF7"/>
              <circle cx="36" cy="66" r="3.5" fill="#E1B21D"/>
            </svg>
          </div>
          <span>Mascarillas</span>
        </div>

        <div class="hero__tile hero__tile--3">
          <div class="hero__tile-art">
            <svg viewBox="0 0 64 96" role="img">
              <rect x="26" y="3" width="12" height="14" rx="5" fill="#4D1B5D"/>
              <rect x="23" y="15" width="18" height="7" rx="2" fill="#E1B21D"/>
              <rect x="16" y="21" width="32" height="67" rx="9" fill="#FDFBF7" stroke="#4D1B5D" stroke-width="2.5"/>
              <rect x="20" y="54" width="24" height="30" rx="6" fill="#E1B21D" opacity="0.85"/>
            </svg>
          </div>
          <span>Tratamientos</span>
        </div>
      </div>
    </div>
  </section>

  <main class="container" id="catalogo">
    <section class="catalog">
      <div class="section-head">
        <div>
          <span class="eyebrow">Nuestros productos</span>
          <h2>Catálogo</h2>
        </div>
        <p class="section-head__text">Filtra por categoría o busca el producto que necesitas.</p>
      </div>

      <ProductFilters
        v-model:busqueda="busqueda"
        v-model:orden="orden"
        :categoria="categoria"
        :categorias="categorias"
        @select-categoria="seleccionarCategoria"
      />

      <p class="results" aria-live="polite">{{ resultadosTexto }}</p>

      <ProductList
        :productos="productosFiltrados"
        :favoritos="favoritos"
        @add="agregarAlCarrito"
        @view="abrirModal"
        @toggle-fav="alternarFavorito"
      />

      <div class="empty" :hidden="!mostrarVacio">
        <span class="empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </span>
        <h3>{{ error ? 'No se pudo cargar el catálogo' : 'No encontramos productos' }}</h3>
        <p>{{ error ? 'No pudimos consultar la API del catálogo. Intenta de nuevo en unos segundos.' : 'Prueba con otra búsqueda o categoría.' }}</p>
        <button class="btn btn--primary" @click="error ? init() : resetFiltros()">
          {{ error ? 'Reintentar' : 'Ver todos' }}
        </button>
      </div>
    </section>

    <section class="about" id="nosotros">
      <div class="about__text">
        <span class="eyebrow">Nosotros</span>
        <h2>Anis Castellano Tienda Cosmetic</h2>
        <p>Somos una boutique especializada en cuidado capilar. Ofrecemos shampoos, mascarillas, tratamientos y kits de marcas profesionales, seleccionados para nutrir, reparar y dar brillo a tu cabello.</p>
        <ul class="about__list">
          <li>Productos originales de marcas profesionales</li>
          <li>Asesoría según tu tipo de cabello</li>
          <li>Atención personalizada en nuestro punto físico</li>
        </ul>
        <a href="#contacto" class="btn btn--primary">Conócenos</a>
      </div>
      <div class="about__panel">
        <div class="about__stat"><strong>5+</strong><span>Años de experiencia</span></div>
        <div class="about__stat"><strong>2k+</strong><span>Clientas felices</span></div>
        <div class="about__stat"><strong>4.9</strong><span>Valoración media</span></div>
      </div>
    </section>
  </main>

  <section class="cta" id="contacto">
    <div class="container cta__inner">
      <div>
        <span class="eyebrow eyebrow--light">Contacto</span>
        <h2>¿Lista para tu próximo glow?</h2>
        <p>Escríbenos y te asesoramos con gusto en tu compra.</p>
      </div>
      <div class="cta__actions">
        <a href="https://wa.me/573004310874" class="btn btn--light" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.facebook.com/share/19XnJoSTaP/" class="btn btn--outline-light" target="_blank" rel="noopener">Facebook</a>
        <a href="https://www.instagram.com/cosmeticanis" class="btn btn--outline-light" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
  </section>

  <AppFooter :categorias="categoriasPie" @select-categoria="seleccionarCategoria" />

  <ProductModal
    :producto="productoModal"
    :qty="modalQty"
    @close="cerrarModal"
    @inc-qty="sumarQty"
    @dec-qty="restarQty"
    @add="agregarDesdeModal"
  />

  <CartPanel
    :abierto="carritoAbierto"
    :items="carritoItems"
    :total="carritoTotal"
    @close="carritoAbierto = false"
    @inc="(id) => cambiarCantidad(id, 1)"
    @dec="(id) => cambiarCantidad(id, -1)"
    @del="eliminarDelCarrito"
    @checkout="finalizarPedido"
    @shop="irAlCatalogo"
  />

  <div class="toast" :class="{ 'is-visible': toastMsg }" role="status" aria-live="polite">
    <span>{{ toastMsg }}</span>
    <button v-if="toastAccionTexto" class="toast__action" @click="ejecutarToastAccion">{{ toastAccionTexto }}</button>
  </div>
</template>
