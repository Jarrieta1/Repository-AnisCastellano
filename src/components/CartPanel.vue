<script setup>
import { formatPrecio } from '../utils/formatPrice'
import { imgSrc, placeholderSVG } from '../utils/placeholderImage'

defineProps({
  abierto: { type: Boolean, default: false },
  // [{ producto, cantidad }]
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'inc', 'dec', 'del', 'checkout', 'shop'])

function onImgError(e, producto) {
  e.target.onerror = null
  e.target.src = placeholderSVG(producto)
}
</script>

<template>
  <aside class="cart" :class="{ 'is-open': abierto }" :aria-hidden="String(!abierto)">
    <div class="cart__header">
      <h3>Tu carrito</h3>
      <button aria-label="Cerrar carrito" @click="emit('close')">✕</button>
    </div>

    <div class="cart__items" :style="{ display: items.length ? 'flex' : 'none' }">
      <div v-for="item in items" :key="item.producto.id" class="cart-item">
        <img
          :src="imgSrc(item.producto)"
          :alt="item.producto.nombre"
          @error="(e) => onImgError(e, item.producto)"
        />
        <div>
          <h4>{{ item.producto.nombre }}</h4>
          <small>{{ formatPrecio(item.producto.precio) }} c/u</small>
          <div class="cart-item__qty">
            <button aria-label="Restar" @click="emit('dec', item.producto.id)">−</button>
            <span>{{ item.cantidad }}</span>
            <button aria-label="Sumar" @click="emit('inc', item.producto.id)">+</button>
          </div>
        </div>
        <div class="cart-item__side">
          <span class="price">{{ formatPrecio(item.producto.precio * item.cantidad) }}</span>
          <button class="cart-item__remove" @click="emit('del', item.producto.id)">Quitar</button>
        </div>
      </div>
    </div>

    <div class="cart__empty" :class="{ 'is-visible': items.length === 0 }">
      <span>🛍️</span>
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
