<script setup>
import { computed, watch } from 'vue';
import { useYarnStore } from '../stores/yarnStore.js';
import { useStashStore } from '../stores/stashStore.js';
import YarnMatchCard from '../components/YarnMatchCard.vue';
import CareBadges from '../components/CareBadges.vue';
import FiberBar from '../components/FiberBar.vue';

const props = defineProps({ id: { type: Number, required: true } });

const yarns = useYarnStore();
const stash = useStashStore();

watch(() => props.id, (id) => yarns.loadTarget(id), { immediate: true });

const t = computed(() => (yarns.target?.id === props.id ? yarns.target : null));
const gaugeText = computed(() =>
  t.value ? (t.value.gauge_min === t.value.gauge_max ? `${t.value.gauge_min}` : `${t.value.gauge_min}–${t.value.gauge_max}`) : '',
);
const needleText = computed(() =>
  t.value ? (t.value.needle_mm_min === t.value.needle_mm_max ? `${t.value.needle_mm_min}` : `${t.value.needle_mm_min}–${t.value.needle_mm_max}`) : '',
);
const tolerances = [1, 2, 3];
</script>

<template>
  <div class="container page">
    <RouterLink to="/yarns" class="back small">← All yarns</RouterLink>

    <p v-if="yarns.matchError && !t" class="notice notice-poor" role="alert">{{ yarns.matchError }}</p>

    <template v-if="t">
      <section class="target card">
        <div class="t-head">
          <div>
            <p class="brand">{{ t.brand }}</p>
            <h1>{{ t.name }}</h1>
          </div>
          <button type="button" class="btn btn-sm" :aria-pressed="stash.hasYarn(t.id)" @click="stash.toggleYarn(t)">
            {{ stash.hasYarn(t.id) ? '★ In your stash' : '☆ Save to stash' }}
          </button>
        </div>
        <dl class="specs">
          <div><dt>Weight</dt><dd>{{ t.weight_name }} <span class="muted">({{ t.weight_common_names }})</span></dd></div>
          <div><dt>Gauge</dt><dd class="num">{{ gaugeText }} sts / 4"</dd></div>
          <div><dt>Needle</dt><dd class="num">{{ needleText }} mm</dd></div>
          <div><dt>Put-up</dt><dd class="num">{{ t.yards_per_skein }} yds / {{ t.grams_per_skein }} g</dd></div>
          <div><dt>Construction</dt><dd>{{ t.construction }}</dd></div>
        </dl>
        <FiberBar :fibers="t.fibers" />
        <CareBadges :wash="t.wash_method" :dry="t.dry_method" />
      </section>

      <section class="controls">
        <div>
          <h2>Compatible yarns</h2>
          <p class="small muted mode-help">
            <template v-if="yarns.mode === 'mix'">
              <strong>Mix</strong>: both yarns go into the same sweater (stripes, colorwork, a contrast yoke).
              Care follows the stricter yarn, so anything that can't take your yarn's wash routine is flagged.
            </template>
            <template v-else>
              <strong>Substitute</strong>: the other yarn replaces yours for the whole sweater. Care differences
              cost points but aren't deal-breakers.
            </template>
          </p>
        </div>
        <div class="control-row">
          <div class="segmented" role="group" aria-label="Match mode">
            <button type="button" :aria-pressed="yarns.mode === 'mix'" @click="yarns.setMode('mix')">Mix in one sweater</button>
            <button type="button" :aria-pressed="yarns.mode === 'substitute'" @click="yarns.setMode('substitute')">Substitute</button>
          </div>
          <label class="tol">
            <span>Gauge within</span>
            <select :value="yarns.tolerance" @change="yarns.setTolerance(Number($event.target.value))">
              <option v-for="n in tolerances" :key="n" :value="n">±{{ n }} st / 4"</option>
            </select>
          </label>
        </div>
      </section>

      <p v-if="yarns.matchError" class="notice notice-poor" role="alert">{{ yarns.matchError }}</p>

      <p class="small muted" aria-live="polite">
        <template v-if="yarns.loadingMatches">Scoring yarns…</template>
        <template v-else>
          {{ yarns.matches.length }} candidates
          <template v-if="yarns.mode === 'mix' && yarns.conflictCount"> · {{ yarns.conflictCount }} with care conflicts</template>
        </template>
      </p>

      <div class="matches" :class="{ loading: yarns.loadingMatches }">
        <YarnMatchCard v-for="m in yarns.matches" :key="m.yarn.id" :match="m" :mode="yarns.mode" />
        <p v-if="!yarns.loadingMatches && !yarns.matches.length" class="card muted">
          No yarns in the database fall within that gauge range. Try widening the gauge tolerance.
        </p>
      </div>
    </template>

    <p v-else-if="!yarns.matchError" class="muted">Loading…</p>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 14px;
  text-decoration: none;
}
.target {
  display: grid;
  gap: 16px;
}
.t-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.brand {
  margin: 0;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}
h1 {
  margin: 0;
}
.specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
}
.specs dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-weight: 600;
}
.specs dd {
  margin: 0;
  text-transform: none;
}
.controls {
  margin: 32px 0 8px;
  display: grid;
  gap: 12px;
}
.controls h2 {
  margin-bottom: 4px;
}
.mode-help {
  max-width: 70ch;
  margin: 0;
}
.control-row {
  display: flex;
  gap: 12px 20px;
  flex-wrap: wrap;
  align-items: center;
}
.tol {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.tol select {
  width: auto;
  min-height: 36px;
  padding: 6px 10px;
}
.matches {
  display: grid;
  gap: 14px;
  transition: opacity 0.15s;
}
.matches.loading {
  opacity: 0.5;
}
</style>
