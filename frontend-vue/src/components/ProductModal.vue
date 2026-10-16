<script setup>
import { onMounted, ref } from 'vue'
import { formatPrecio } from '../utils/formatPrice'
import { stars } from '../utils/stars'
import { imgSrc, placeholderSVG } from '../utils/placeholderImage'

const props = defineProps({
  producto: { type: Object, default: null },
  qty: { type: Number, default: 1 },
})
const emit = defineEmits(['close', 'inc-qty', 'dec-qty', 'add'])

const mediaRef = ref(null)
const lupaRef = ref(null)

function onImgError(e) {
  if (!props.producto) return
  e.target.onerror = null
  e.target.src = placeholderSVG(props.producto)
}

/* Lupa de ampliación: mismo algoritmo que el frontend anterior */
onMounted(() => {
  const wrap = mediaRef.value
  const lupa = lupaRef.value
  if (!wrap || !lupa) return
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const img = wrap.querySelector('img')
  if (!img) return

  const LUPA_D = 140
  const LUPA_ZOOM = 2.4
  lupa.style.width = lupa.style.height = `${LUPA_D}px`

  wrap.addEventListener('mousemove', (e) => {
    const box = wrap.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    if (x < 0 || y < 0 || x > box.width || y > box.height) {
      wrap.classList.remove('is-lupa')
      return
    }
    if (!img.complete || !img.naturalWidth) return

    wrap.classList.add('is-lupa')

    const half = LUPA_D / 2
    const cx = Math.min(Math.max(x, half), box.width - half)
    const cy = Math.min(Math.max(y, half), box.height - half)
    lupa.style.left = `${cx - half}px`
    lupa.style.top = `${cy - half}px`

    // Réplica del object-fit: cover dentro de la lupa
    const escala = Math.max(
      box.width / img.naturalWidth,
      box.height / img.naturalHeight,
    )
    const dw = img.naturalWidth * escala
    const dh = img.naturalHeight * escala
    const ox = (box.width - dw) / 2
    const oy = (box.height - dh) / 2
    lupa.style.backgroundImage = `url("${img.currentSrc || img.src}")`
    lupa.style.backgroundSize = `${dw * LUPA_ZOOM}px ${dh * LUPA_ZOOM}px`
    lupa.style.backgroundPosition =
      `${half - (cx - ox) * LUPA_ZOOM}px ${half - (cy - oy) * LUPA_ZOOM}px`
  })

  wrap.addEventListener('mouseleave', () => wrap.classList.remove('is-lupa'))
})
</script>

<template>
  <div class="modal" :hidden="!producto">
    <div class="modal__backdrop" @click="emit('close')"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal__close" aria-label="Cerrar" @click="emit('close')">✕</button>
      <div class="modal__media" ref="mediaRef">
        <img :src="producto ? imgSrc(producto) : ''" :alt="producto ? producto.nombre : ''" @error="onImgError" />
        <span class="lupa" ref="lupaRef" aria-hidden="true"></span>
      </div>
      <div class="modal__body">
        <span class="tag">{{ producto?.categoria }}</span>
        <h3 id="modalTitle">{{ producto?.nombre }}</h3>
        <div v-if="producto?.rating" class="rating">
          <span class="stars">{{ stars(producto.rating) }}</span>
          {{ producto.rating }} · {{ producto.resenas }} reseñas
        </div>
        <p>{{ producto?.descripcion }}</p>
        <ul class="modal__specs">
          <li v-for="(v, k) in producto?.especificaciones || {}" :key="k">
            <span>{{ k }}</span><strong>{{ v }}</strong>
          </li>
        </ul>
        <div class="modal__price">
          <span class="price">{{ producto ? formatPrecio(producto.precio) : '' }}</span>
          <span class="price-old">{{ producto?.precioAntes ? formatPrecio(producto.precioAntes) : '' }}</span>
        </div>
        <div class="qty">
          <button aria-label="Restar" @click="emit('dec-qty')">−</button>
          <input type="number" :value="qty" min="1" max="20" readonly />
          <button aria-label="Sumar" @click="emit('inc-qty')">+</button>
        </div>
        <button class="btn btn--primary btn--block" @click="emit('add')">Agregar al carrito</button>
      </div>
    </div>
  </div>
</template>
