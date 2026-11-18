<script setup>
import { useGaugeStore } from '../stores/gaugeStore.js';

const gauge = useGaugeStore();
</script>

<template>
  <div class="sizes">
    <div class="head" aria-hidden="true">
      <span>Size</span>
      <span>Finished chest ({{ gauge.unit === 'in' ? 'in' : 'cm' }})</span>
      <span />
    </div>
    <div v-for="(size, i) in gauge.sizes" :key="size.id" class="row">
      <input v-model.trim="size.name" :aria-label="`Size ${i + 1} name`" placeholder="e.g. M" />
      <input
        v-model.number="size.chest"
        type="number"
        min="0"
        step="0.25"
        inputmode="decimal"
        :aria-label="`Size ${size.name || i + 1} finished chest`"
      />
      <button
        type="button"
        class="icon-btn"
        :aria-label="`Remove size ${size.name || i + 1}`"
        :disabled="gauge.sizes.length === 1"
        @click="gauge.removeSize(size.id)"
      >
        ×
      </button>
    </div>
    <button type="button" class="btn btn-sm" @click="gauge.addSize()">+ Add size</button>
  </div>
</template>

<style scoped>
.head,
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 36px;
  gap: 8px;
  align-items: center;
}
.head {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.row {
  margin-bottom: 8px;
}
.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
  background: none;
}
</style>
