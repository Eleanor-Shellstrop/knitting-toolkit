<script setup>
import { computed } from 'vue';
import CareBadges from './CareBadges.vue';
import FiberBar from './FiberBar.vue';

const props = defineProps({
  match: { type: Object, required: true },
  mode: { type: String, required: true },
});

const VERDICT = {
  great: { label: 'Great match', tone: 'good' },
  good: { label: 'Good match', tone: 'good' },
  possible: { label: 'Possible — swatch first', tone: 'fair' },
  poor: { label: 'Poor match', tone: 'poor' },
  conflict: { label: 'Care conflict', tone: 'poor' },
};
const v = computed(() => VERDICT[props.match.verdict]);
const y = computed(() => props.match.yarn);
const ring = computed(() => `conic-gradient(var(--${v.value.tone}) ${props.match.score * 3.6}deg, var(--surface-2) 0)`);
const CARE = {
  machine_warm: 'machine wash warm',
  machine_cold: 'machine wash cool',
  hand_wash: 'hand wash',
  dry_clean: 'dry clean',
  tumble_normal: 'tumble dry',
  tumble_low: 'tumble dry low',
  line_dry: 'line dry',
  lay_flat: 'dry flat',
};
</script>

<template>
  <article class="match card">
    <header>
      <div class="score" :style="{ background: ring }" :aria-label="`Score ${match.score} out of 100`">
        <span class="num">{{ match.score }}</span>
      </div>
      <div class="title">
        <p class="brand">{{ y.brand }}</p>
        <h3>
          <RouterLink :to="`/yarns/${y.id}`">{{ y.name }}</RouterLink>
        </h3>
        <p class="spec small muted">
          {{ y.weight_name }} · {{ y.gauge_min === y.gauge_max ? y.gauge_min : `${y.gauge_min}–${y.gauge_max}` }} sts / 4" ·
          {{ y.yards_per_skein }} yds / {{ y.grams_per_skein }} g
        </p>
      </div>
      <span :class="['pill', `pill-${v.tone}`]">{{ v.label }}</span>
    </header>

    <p v-for="c in match.conflicts" :key="c" class="notice notice-poor small">{{ c }}</p>

    <ul class="factors">
      <li v-for="f in match.factors" :key="f.key">
        <span :class="['status', f.status]" :aria-label="f.status" />
        <span class="flabel">{{ f.label }}</span>
        <span class="note">{{ f.note }}</span>
        <span class="pts num muted">{{ Math.round(f.points) }}/{{ f.max }}</span>
      </li>
    </ul>

    <footer>
      <FiberBar :fibers="y.fibers" compact />
      <div class="foot-row">
        <CareBadges :wash="y.wash_method" :dry="y.dry_method" />
        <span v-if="mode === 'mix' && match.garmentCare" class="small muted">
          Sweater care: {{ CARE[match.garmentCare.wash_method] }}, {{ CARE[match.garmentCare.dry_method] }}
        </span>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.match {
  display: grid;
  gap: 14px;
}
header {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 14px;
  align-items: center;
}
.score {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: relative;
}
.score::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--surface);
}
.score span {
  position: relative;
  font-weight: 600;
  font-size: 1.05rem;
}
.brand {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: 600;
}
h3 {
  margin: 0;
  font-size: 1.15rem;
}
h3 a {
  color: var(--text);
  text-decoration: none;
}
h3 a:hover {
  color: var(--accent);
  text-decoration: underline;
}
.spec {
  margin: 2px 0 0;
}
.notice {
  margin: 0;
}
.factors {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}
.factors li {
  display: grid;
  grid-template-columns: 10px 96px 1fr auto;
  gap: 10px;
  align-items: baseline;
  font-size: 0.875rem;
}
.status {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  align-self: center;
}
.status.good {
  background: var(--good);
}
.status.fair {
  background: var(--fair);
}
.status.poor {
  background: var(--poor);
}
.flabel {
  font-weight: 600;
}
footer {
  display: grid;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.foot-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
}
@media (max-width: 560px) {
  header {
    grid-template-columns: 48px 1fr;
  }
  header .pill {
    grid-column: 2;
    justify-self: start;
  }
  .score {
    width: 48px;
    height: 48px;
  }
  .factors li {
    grid-template-columns: 10px 1fr auto;
  }
  .factors .note {
    grid-column: 2 / -1;
    grid-row: 2;
    color: var(--muted);
  }
  .factors .pts {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
