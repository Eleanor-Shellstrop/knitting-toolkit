<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: { type: Object, required: true },
});

const tone = computed(
  () => ({ 'as-written': 'good', watch: 'fair', custom: 'poor', incomplete: 'muted' })[props.result.verdict],
);
const kicker = computed(
  () =>
    ({
      'as-written': 'Good news',
      watch: 'Workable, with care',
      custom: 'Time for custom math',
      incomplete: 'Waiting for numbers',
    })[props.result.verdict],
);
</script>

<template>
  <section class="verdict card" :class="tone" aria-live="polite">
    <p class="kicker">{{ kicker }}</p>
    <h2>{{ result.headline }}</h2>
    <ul v-if="result.warnings?.length" class="warnings">
      <li v-for="(w, i) in result.warnings" :key="i" :class="w.level">
        <span class="dot" aria-hidden="true" />
        <span>{{ w.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.verdict {
  border-left: 5px solid var(--border);
}
.good {
  border-left-color: var(--good);
}
.fair {
  border-left-color: var(--fair);
}
.poor {
  border-left-color: var(--poor);
}
.kicker {
  margin: 0 0 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.good .kicker {
  color: var(--good);
}
.fair .kicker {
  color: var(--fair);
}
.poor .kicker {
  color: var(--poor);
}
h2 {
  font-size: clamp(1.4rem, 3vw, 1.75rem);
  margin-bottom: 0;
}
.warnings {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 8px;
}
.warnings li {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 10px;
  font-size: 0.9375rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 8px;
  background: var(--muted);
}
.warn .dot {
  background: var(--fair);
}
.severe .dot {
  background: var(--poor);
}
</style>
