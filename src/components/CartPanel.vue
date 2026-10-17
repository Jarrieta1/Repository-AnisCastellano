<script setup>
import { ref, toRef } from 'vue'
import { formatPrecio } from '../utils/formatPrice'
import { imgSrc, placeholderSVG } from '../utils/placeholderImage'
import { useFocusTrap } from '../composables/useFocusTrap'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  // [{ producto, cantidad }]
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'inc', 'dec', 'del', 'checkout', 'shop'])

const cartRef = ref(null)
useFocusTrap(cartRef, toRef(props, 'abierto'))

function onImgError(e, producto) {
  e.target.onerror = null
  e.target.src = placeholderSVG(producto)
}
</script>

<template>
  <aside
    ref="cartRef"
    class="cart"
    :class="{ 'is-open': abierto }"
    role="dialog"
    aria-modal="true"
    aria-labelledby="cartTitle"
    tabindex="-1"
    :inert="!abierto"
  >
    <div class="cart__header">
      <h3 id="cartTitle">Tu carrito</h3>
      <button aria-label="Cerrar carrito" @click="emit('close')">✕</button>
    </div>

    <div class="cart__items" :style="{ display: items.length ? 'flex' : 'none' }">
      <div v-for="item in items" :key="item.producto.id" class="cart-item">
        <img
          :src="imgSrc(item.producto)"
          :alt="item.producto.nombre"
          loading="lazy"
          @error="(e) => onImgError(e, item.producto)"
        />
        <div>
          <h4>{{ item.producto.nombre }}</h4>
          <small>{{ formatPrecio(item.producto.precio) }} c/u</small>
          <div class="cart-item__qty">
            <button :aria-label="`Restar ${item.producto.nombre}`" @click="emit('dec', item.producto.id)">−</button>
            <span aria-live="polite">{{ item.cantidad }}</span>
            <button :aria-label="`Sumar ${item.producto.nombre}`" @click="emit('inc', item.producto.id)">+</button>
          </div>
        </div>
        <div class="cart-item__side">
          <span class="price">{{ formatPrecio(item.producto.precio * item.cantidad) }}</span>
          <button class="cart-item__remove" :aria-label="`Quitar ${item.producto.nombre} del carrito`" @click="emit('del', item.producto.id)">Quitar</button>
        </div>
      </div>
    </div>

    <div class="cart__empty" :class="{ 'is-visible': items.length === 0 }">
      <span class="cart__empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </span>
      <p>Tu carrito está vacío</p>
      <button class="btn btn--primary" @click="emit('shop')">Ver catálogo</button>
    </div>

    <div class="cart__footer" :hidden="items.length === 0">
      <div class="cart__total">
        <span>Total</span>
        <strong>{{ formatPrecio(total) }}</strong>
      </div>
      <button class="btn btn--primary btn--block" @click="emit('checkout')">Finalizar pedido</button>
      <small>Te redirigiremos a WhatsApp para confirmar tu compra.</small>
    </div>
  </aside>

  <div class="cart-overlay" :hidden="!abierto" @click="emit('close')"></div>
</template>
