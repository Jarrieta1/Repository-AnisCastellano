<script setup>
import { ref } from 'vue'

defineProps({
  cartCount: { type: Number, default: 0 },
})
const emit = defineEmits(['open-cart'])

const navOpen = ref(false)

function toggleNav() {
  navOpen.value = !navOpen.value
}

function closeNav() {
  navOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header__top">
      <div class="container header__top-inner">
        <span>✨ Solo punto físico · Pagos seguros</span>
        <span class="header__top-contact">WhatsApp: +57 300 431 0874</span>
      </div>
    </div>

    <div class="container header__main">
      <button
        class="nav-toggle"
        aria-label="Abrir menú"
        :aria-expanded="String(navOpen)"
        @click="toggleNav"
      >
        <span></span><span></span><span></span>
      </button>

      <a href="#inicio" class="brand" @click="closeNav">
        <span class="brand__mark">AC</span>
        <span class="brand__text">
          <strong>Anis Castellano</strong>
          <small>Tienda Cosmetic</small>
        </span>
      </a>

      <nav class="nav" :class="{ 'is-open': navOpen }">
        <a href="#inicio" @click="closeNav">Inicio</a>
        <a href="#catalogo" @click="closeNav">Catálogo</a>
        <a href="#nosotros" @click="closeNav">Nosotros</a>
        <a href="#contacto" @click="closeNav">Contacto</a>
      </nav>

      <button class="cart-btn" aria-label="Abrir carrito" @click="emit('open-cart')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="cart-btn__count">{{ cartCount }}</span>
      </button>
    </div>
  </header>
</template>
