<script setup>
import { computed } from 'vue'
import { formatPrecio } from '../utils/formatPrice'
import { stars } from '../utils/stars'
import { imgSrc, placeholderSVG } from '../utils/placeholderImage'

const props = defineProps({
  producto: { type: Object, required: true },
  esFavorito: { type: Boolean, default: false },
  indice: { type: Number, default: 0 },
})
const emit = defineEmits(['add', 'view', 'toggle-fav'])

const badge = computed(() => {
  const p = props.producto
  if (p.descuento > 0) return { texto: `-${p.descuento}%`, clase: 'badge' }
  if (p.nuevo) return { texto: 'Nuevo', clase: 'badge badge--gold' }
  if (p.destacado) return { texto: 'Top', clase: 'badge badge--dark' }
  return null
})

function onImgError(e) {
  e.target.onerror = null
  e.target.src = placeholderSVG(props.producto)
}
</script>

<template>
  <article class="card" :style="{ animationDelay: `${indice * 40}ms` }">
    <div class="card__media">
      <span v-if="badge" :class="badge.clase">{{ badge.texto }}</span>
      <button
        class="wish"
        :class="{ 'is-on': esFavorito }"
        :aria-label="esFavorito ? `Quitar ${producto.nombre} de favoritos` : `Agregar ${producto.nombre} a favoritos`"
        :aria-pressed="esFavorito"
        @click="emit('toggle-fav', producto.id)"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>
        </svg>
      </button>
      <img
        :src="imgSrc(producto)"
        :alt="producto.nombre"
        loading="lazy"
        @error="onImgError"
      />
    </div>
    <div class="card__body">
      <span class="card__cat">{{ producto.categoria }}</span>
      <h3 class="card__title">{{ producto.nombre }}</h3>
      <div v-if="producto.rating" class="card__rating">
        <span class="stars" aria-hidden="true">{{ stars(producto.rating) }}</span>
        <span>{{ producto.rating }} ({{ producto.resenas }})</span>
      </div>
      <div class="card__price">
        <span class="price">{{ formatPrecio(producto.precio) }}</span>
        <span v-if="producto.precioAntes" class="price-old">{{ formatPrecio(producto.precioAntes) }}</span>
      </div>
      <div class="card__actions">
        <button class="btn btn--primary" @click="emit('add', producto.id)">Agregar</button>
        <button class="btn btn--soft" @click="emit('view', producto.id)">Ver detalle</button>
      </div>
    </div>
  </article>
</template>
