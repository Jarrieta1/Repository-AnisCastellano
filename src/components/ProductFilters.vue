<script setup>
defineProps({
  busqueda: { type: String, default: '' },
  categoria: { type: String, default: 'Todos' },
  orden: { type: String, default: 'default' },
  categorias: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:busqueda', 'update:orden', 'select-categoria'])
</script>

<template>
  <div class="toolbar">
    <div class="search">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        type="search"
        placeholder="Buscar producto..."
        autocomplete="off"
        :value="busqueda"
        @input="emit('update:busqueda', $event.target.value)"
      />
    </div>

    <div class="filters" role="tablist" aria-label="Categorías">
      <button
        v-for="cat in categorias"
        :key="cat"
        class="chip"
        :class="{ 'is-active': cat === categoria }"
        role="tab"
        @click="emit('select-categoria', cat)"
      >
        {{ cat }}
      </button>
    </div>

    <select
      class="sort"
      aria-label="Ordenar productos"
      :value="orden"
      @change="emit('update:orden', $event.target.value)"
    >
      <option value="default">Ordenar: Destacados</option>
      <option value="price-asc">Precio: menor a mayor</option>
      <option value="price-desc">Precio: mayor a menor</option>
      <option value="name-asc">Nombre: A-Z</option>
    </select>
  </div>
</template>
