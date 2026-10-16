<script setup>
defineProps({
  categorias: { type: Array, default: () => [] },
})
const emit = defineEmits(['select-categoria'])

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer__grid">
      <div>
        <a href="#inicio" class="brand brand--footer">
          <span class="brand__mark">AC</span>
          <span class="brand__text">
            <strong>Anis Castellano</strong>
            <small>Tienda Cosmetic</small>
          </span>
        </a>
        <p>Belleza, cuidado y estilo en un solo lugar.</p>
        <div class="footer__social">
          <a href="https://www.facebook.com/share/19XnJoSTaP/" target="_blank" rel="noopener" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/cosmeticanis" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>
      </div>
      <div>
        <h4>Tienda</h4>
        <a href="#catalogo">Catálogo</a>
        <a href="#nosotros">Nosotros</a>
        <a href="#contacto">Contacto</a>
      </div>
      <div>
        <h4>Categorías</h4>
        <div>
          <a
            v-for="cat in categorias"
            :key="cat"
            href="#catalogo"
            @click="emit('select-categoria', cat)"
          >
            {{ cat }}
          </a>
        </div>
      </div>
      <div>
        <h4>Horario</h4>
        <p>Lun a Sáb · 9:00 - 19:00</p>
        <p>Domingo · Cerrado</p>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© {{ year }} Anis Castellano Tienda Cosmetic</span>
      <span>Hecho con 💗</span>
    </div>
  </footer>
</template>
