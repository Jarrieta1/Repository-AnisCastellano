<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  productos: { type: Array, default: () => [] },
  favoritos: { type: Array, default: () => [] },
})
const emit = defineEmits(['add', 'view', 'toggle-fav'])
</script>

<template>
  <div class="grid">
    <ProductCard
      v-for="(p, i) in productos"
      :key="p.id"
      :producto="p"
      :indice="i"
      :es-favorito="favoritos.includes(p.id)"
      @add="emit('add', $event)"
      @view="emit('view', $event)"
      @toggle-fav="emit('toggle-fav', $event)"
    />
  </div>
</template>
