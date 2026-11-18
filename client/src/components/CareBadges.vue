<script setup>
import { computed } from 'vue';

const props = defineProps({
  wash: { type: String, required: true },
  dry: { type: String, required: true },
});

const WASH = {
  machine_warm: { label: 'Machine wash warm', dots: 2 },
  machine_cold: { label: 'Machine wash cool', dots: 1 },
  hand_wash: { label: 'Hand wash', hand: true },
  dry_clean: { label: 'Dry clean', clean: true },
};
const DRY = {
  tumble_normal: { label: 'Tumble dry', tumble: true, dots: 2 },
  tumble_low: { label: 'Tumble dry low', tumble: true, dots: 1 },
  line_dry: { label: 'Line dry', line: 'v' },
  lay_flat: { label: 'Dry flat', line: 'h' },
};

const w = computed(() => WASH[props.wash] ?? { label: props.wash });
const d = computed(() => DRY[props.dry] ?? { label: props.dry });
</script>

<template>
  <ul class="care" aria-label="Care instructions">
    <li>
      <!-- Simplified laundry-symbol style icons -->
      <svg v-if="!w.clean" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h18l-2.2 11.5a2 2 0 0 1-2 1.5H7.2a2 2 0 0 1-2-1.5L3 7z" />
        <path d="M3 7c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0" />
        <path v-if="w.hand" d="M10 16v-4.5a1 1 0 0 1 2 0V15m0-3.5v-1a1 1 0 0 1 2 0V15" />
        <circle v-for="n in w.dots || 0" :key="n" :cx="n === 1 && w.dots === 1 ? 12 : 9 + (n - 1) * 6" cy="14" r="1.2" class="fill" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
      <span>{{ w.label }}</span>
    </li>
    <li>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle v-if="d.tumble" cx="12" cy="12" r="5.5" />
        <circle v-for="n in d.tumble ? d.dots : 0" :key="n" :cx="d.dots === 1 ? 12 : 10 + (n - 1) * 4" cy="12" r="1.1" class="fill" />
        <path v-if="d.line === 'h'" d="M7 12h10" />
        <path v-if="d.line === 'v'" d="M10 7v10M14 7v10" />
      </svg>
      <span>{{ d.label }}</span>
    </li>
  </ul>
</template>

<style scoped>
.care {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 999px;
  padding: 3px 10px 3px 6px;
}
svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .fill {
  fill: currentColor;
  stroke: none;
}
</style>
