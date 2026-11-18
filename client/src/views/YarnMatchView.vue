<script setup>
import { useYarnStore } from '../stores/yarnStore.js';
import YarnSearch from '../components/YarnSearch.vue';
import CareBadges from '../components/CareBadges.vue';
import FiberBar from '../components/FiberBar.vue';

const yarns = useYarnStore();
const gaugeText = (y) => (y.gauge_min === y.gauge_max ? `${y.gauge_min}` : `${y.gauge_min}–${y.gauge_max}`);
</script>

<template>
  <div class="container page">
    <header class="intro">
      <h1>Yarn Match</h1>
      <p class="lede">
        Pick the yarn you're knitting with. You'll get yarns from other brands ranked by how well
        they'd work alongside it in the same sweater (or instead of it), with the reasons for each score.
      </p>
    </header>

    <YarnSearch />

    <p v-if="yarns.searchError" class="notice notice-poor" role="alert">{{ yarns.searchError }}</p>

    <p class="count small muted" aria-live="polite">
      <template v-if="yarns.searching">Searching…</template>
      <template v-else>{{ yarns.results.length }} yarn{{ yarns.results.length === 1 ? '' : 's' }}</template>
    </p>

    <ul class="results">
      <li v-for="y in yarns.results" :key="y.id">
        <RouterLink :to="`/yarns/${y.id}`" class="result card">
          <div class="name">
            <span class="brand">{{ y.brand }}</span>
            <strong>{{ y.name }}</strong>
          </div>
          <div class="meta small muted">
            {{ y.weight_name }} ({{ y.weight_common_names.split(',')[0] }}) · {{ gaugeText(y) }} sts / 4" ·
            {{ y.yards_per_skein }} yds / {{ y.grams_per_skein }} g
          </div>
          <FiberBar :fibers="y.fibers" compact />
          <div class="row">
            <span class="small">{{ y.blend }}</span>
            <CareBadges :wash="y.wash_method" :dry="y.dry_method" />
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.intro {
  margin-bottom: 20px;
}
.count {
  margin: 14px 0 10px;
}
.results {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.result {
  display: grid;
  gap: 8px;
  color: var(--text);
  text-decoration: none;
  height: 100%;
  padding: 16px 18px;
  transition: border-color 0.15s;
}
.result:hover {
  color: var(--text);
  border-color: var(--accent);
}
.name {
  display: flex;
  flex-direction: column;
}
.brand {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: 600;
}
.name strong {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 650;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  justify-content: space-between;
  align-items: center;
}
@media (max-width: 360px) {
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
