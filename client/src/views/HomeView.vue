<script setup>
import { useRouter } from 'vue-router';
import { useStashStore } from '../stores/stashStore.js';
import { useGaugeStore } from '../stores/gaugeStore.js';

const stash = useStashStore();
const gauge = useGaugeStore();
const router = useRouter();

function openCalc(calc) {
  gauge.restore(calc.snapshot);
  router.push('/gauge');
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
</script>

<template>
  <div class="container page">
    <section class="hero">
      <p class="eyebrow">A knitter's toolkit</p>
      <h1>Do the sweater math before you cast on.</h1>
      <p class="lede">
        Your swatch never matches the pattern, and the yarn it calls for is never in your stash.
        These tools tell you which size to knit at <em>your</em> gauge and which yarns will play
        nicely together in one sweater.
      </p>
    </section>

    <section class="tools">
      <RouterLink to="/gauge" class="tool card">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="2" /><path d="M8 8v5M12 8v3M16 8v5M20 8v3M24 8v5" /></svg>
        </span>
        <h2>Gauge &amp; Size Advisor</h2>
        <p>
          My gauge is off from the pattern's. Can I knit another size, or do I need a custom cast-on?
          Get a verdict, the working, and the stitch counts.
        </p>
        <span class="go">Open the advisor →</span>
      </RouterLink>

      <RouterLink to="/yarns" class="tool card">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><circle cx="12" cy="16" r="7" /><circle cx="21" cy="16" r="7" /></svg>
        </span>
        <h2>Yarn Match</h2>
        <p>
          Using Cascade 220 Superwash? Find yarns from other brands with compatible gauge, fiber
          and care, so the whole sweater still survives the washing machine.
        </p>
        <span class="go">Find compatible yarns →</span>
      </RouterLink>
    </section>

    <section v-if="!stash.isEmpty" class="stash">
      <h2>Your saved items</h2>
      <div class="stash-grid">
        <div v-if="stash.calcs.length" class="card">
          <h3>Calculations</h3>
          <ul>
            <li v-for="c in stash.calcs" :key="c.id">
              <button type="button" class="link" @click="openCalc(c)">{{ c.label }}</button>
              <span class="small muted">{{ c.headline }} · {{ fmtDate(c.savedAt) }}</span>
              <button type="button" class="icon-btn" :aria-label="`Delete ${c.label}`" @click="stash.removeCalc(c.id)">×</button>
            </li>
          </ul>
        </div>
        <div v-if="stash.yarns.length" class="card">
          <h3>Yarns</h3>
          <ul>
            <li v-for="y in stash.yarns" :key="y.id">
              <RouterLink :to="`/yarns/${y.id}`">{{ y.brand }} {{ y.name }}</RouterLink>
              <span class="small muted">{{ y.weight_name }} · {{ y.blend }}</span>
              <button type="button" class="icon-btn" :aria-label="`Remove ${y.name}`" @click="stash.toggleYarn(y)">×</button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 24px 0 36px;
  max-width: 760px;
}
.eyebrow {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-bottom: 10px;
}
h1 {
  font-size: clamp(2.2rem, 6vw, 3.4rem);
}
.tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.tool {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text);
  text-decoration: none;
  padding: 26px;
  transition: transform 0.15s, border-color 0.15s;
}
.tool:hover {
  color: var(--text);
  border-color: var(--accent);
  transform: translateY(-2px);
}
.tool p {
  color: var(--muted);
  flex: 1;
}
.icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.icon svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}
.go {
  font-weight: 600;
  color: var(--accent);
}
.stash {
  margin-top: 48px;
}
.stash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.stash ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.stash li {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.stash li:last-child {
  border-bottom: 0;
}
.stash li > :first-child {
  font-weight: 600;
}
.stash li .small {
  grid-column: 1;
}
.stash li .icon-btn {
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--accent);
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
