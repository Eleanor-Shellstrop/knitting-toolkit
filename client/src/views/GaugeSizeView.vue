<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useGaugeStore } from '../stores/gaugeStore.js';
import { useStashStore } from '../stores/stashStore.js';
import { formatLength, gaugeLabel, GAUGE_SPAN } from '../lib/units.js';
import SizeTableInput from '../components/SizeTableInput.vue';
import SizeResultCard from '../components/SizeResultCard.vue';

const gauge = useGaugeStore();
const stash = useStashStore();
const { result, convertedCounts } = storeToRefs(gauge);

const span = computed(() => GAUGE_SPAN[gauge.unit]);
const per = computed(() => gaugeLabel(gauge.unit));
const len = (v) => formatLength(v, gauge.unit);
const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + formatLength(Math.abs(v), gauge.unit);

const saved = ref(false);
function save() {
  stash.saveCalc({ label: gauge.patternName, headline: result.value.headline, snapshot: gauge.snapshot() });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}
</script>

<template>
  <div class="container page">
    <header class="intro">
      <h1>Gauge &amp; Size Advisor</h1>
      <p class="lede">
        Enter the pattern's gauge, your swatch gauge and the pattern's finished chest sizes. You'll see
        what each size really measures at your gauge, and whether knitting a different size will work
        or you need to do the custom math.
      </p>
    </header>

    <div class="layout">
      <form class="inputs card" @submit.prevent>
        <div class="toolbar">
          <div class="segmented" role="group" aria-label="Units">
            <button type="button" :aria-pressed="gauge.unit === 'in'" @click="gauge.setUnit('in')">Inches</button>
            <button type="button" :aria-pressed="gauge.unit === 'cm'" @click="gauge.setUnit('cm')">Centimetres</button>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="btn btn-sm btn-ghost" @click="gauge.loadExample()">Example</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="gauge.clear()">Clear</button>
          </div>
        </div>

        <fieldset>
          <label for="pname">Pattern name (optional)</label>
          <input id="pname" v-model.trim="gauge.patternName" placeholder="e.g. Flax pullover" />
        </fieldset>

        <fieldset>
          <legend>Gauge <span class="muted small">({{ per }})</span></legend>
          <div class="gauge-grid">
            <span />
            <span class="col-head">Stitches</span>
            <span class="col-head">Rows</span>

            <span class="row-head">Pattern</span>
            <input v-model.number="gauge.pattern.sts" type="number" min="0" step="0.5" inputmode="decimal" aria-label="Pattern stitches" />
            <input v-model.number="gauge.pattern.rows" type="number" min="0" step="0.5" inputmode="decimal" aria-label="Pattern rows" />

            <span class="row-head">Your swatch</span>
            <input v-model.number="gauge.yours.sts" type="number" min="0" step="0.5" inputmode="decimal" aria-label="Your stitches" />
            <input v-model.number="gauge.yours.rows" type="number" min="0" step="0.5" inputmode="decimal" aria-label="Your rows" />
          </div>
          <p class="hint small muted">Measure your swatch after washing and blocking it the way you'll treat the sweater.</p>
        </fieldset>

        <fieldset>
          <legend>What you want</legend>
          <div class="field-grid">
            <div>
              <label for="target">Finished chest ({{ gauge.unit }})</label>
              <input id="target" v-model.number="gauge.targetChest" type="number" min="0" step="0.25" inputmode="decimal" />
            </div>
            <div>
              <label for="tol">Close enough within ±</label>
              <input id="tol" v-model.number="gauge.tolerance" type="number" min="0" step="0.25" inputmode="decimal" />
            </div>
          </div>
          <p class="hint small muted">Finished chest = your chest measurement + the ease the pattern recommends.</p>
        </fieldset>

        <fieldset>
          <legend>Pattern sizes</legend>
          <SizeTableInput />
        </fieldset>

        <fieldset>
          <legend>Stitch pattern <span class="muted small">(for a custom cast-on)</span></legend>
          <div class="field-grid">
            <div>
              <label for="mult">Multiple of</label>
              <input id="mult" v-model.number="gauge.stitchMultiple" type="number" min="1" step="1" inputmode="numeric" />
            </div>
            <div>
              <label for="edge">Plus</label>
              <input id="edge" v-model.number="gauge.edgeStitches" type="number" min="0" step="1" inputmode="numeric" />
            </div>
          </div>
        </fieldset>

        <button type="button" class="btn btn-primary" :disabled="result.verdict === 'incomplete'" @click="save">
          {{ saved ? 'Saved ✓' : 'Save this calculation' }}
        </button>
      </form>

      <div class="results">
        <SizeResultCard :result="result" />

        <section v-if="result.sizes" class="card">
          <h3>Every size at your gauge</h3>
          <p class="small muted">
            Scale factor {{ result.factor.toFixed(3) }} = pattern {{ gauge.pattern.sts }} sts ÷ your
            {{ gauge.yours.sts }} sts {{ per }}.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th class="num">Pattern says</th>
                  <th class="num">You'd get</th>
                  <th class="num">vs. target</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(s, i) in result.sizes"
                  :key="i"
                  :class="{ rec: i === result.recommendedIndex, fits: s.fits }"
                >
                  <td>
                    <strong>{{ s.name }}</strong>
                    <span v-if="i === result.recommendedIndex" class="pill pill-accent">closest</span>
                    <span v-if="i === result.usualIndex" class="pill">your usual</span>
                  </td>
                  <td class="num">{{ len(s.chest) }}</td>
                  <td class="num">{{ len(s.actualChest) }}</td>
                  <td class="num" :class="s.fits ? 'ok' : 'off'">{{ signed(s.diff) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="result.custom" class="card" :class="{ highlight: result.verdict === 'custom' }">
          <h3>Custom cast-on</h3>
          <p class="math num">
            {{ len(gauge.targetChest) }} × {{ gauge.yours.sts }} sts ÷ {{ span }}{{ gauge.unit === 'in' ? '"' : ' cm' }}
            = {{ result.custom.rawStitches.toFixed(1) }} sts
          </p>
          <p class="castOn">
            Cast on <strong class="num">{{ result.custom.castOn }}</strong> sts for the body
            <span class="muted small">
              (rounded to a multiple of {{ gauge.stitchMultiple || 1 }}<template v-if="gauge.edgeStitches"> + {{ gauge.edgeStitches }}</template>,
              gives {{ len(result.custom.actualChest) }})
            </span>
          </p>
          <p class="small muted">
            Knitting in pieces? Split that between front and back and add seam stitches.
            Use the converter below for sleeves, yokes and anything worked over a set number of rows.
          </p>
        </section>

        <section class="card">
          <h3>Stitch &amp; row converter</h3>
          <p class="small muted">Turn any count from the pattern into the count that gives the same size at your gauge.</p>
          <div class="table-wrap">
            <table class="converter">
              <thead>
                <tr>
                  <th>What</th>
                  <th>Type</th>
                  <th class="num">Pattern</th>
                  <th class="num">Yours</th>
                  <th><span class="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(c, i) in gauge.conversions" :key="c.id">
                  <td><input v-model.trim="c.label" placeholder="e.g. Sleeve cuff" :aria-label="`Converter row ${i + 1} label`" /></td>
                  <td>
                    <select v-model="c.kind" :aria-label="`Converter row ${i + 1} type`">
                      <option value="sts">sts</option>
                      <option value="rows">rows</option>
                    </select>
                  </td>
                  <td><input v-model.number="c.count" type="number" min="0" inputmode="numeric" :aria-label="`Converter row ${i + 1} pattern count`" /></td>
                  <td class="num">
                    <strong v-if="convertedCounts[i]?.converted != null">{{ Math.round(convertedCounts[i].converted) }}</strong>
                    <span v-else class="muted">—</span>
                  </td>
                  <td>
                    <button type="button" class="icon-btn" :aria-label="`Remove ${c.label || 'row'}`" @click="gauge.removeConversion(c.id)">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-sm" @click="gauge.addConversion()">+ Add count</button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro {
  margin-bottom: 24px;
}
.layout {
  display: grid;
  gap: 20px;
  align-items: start;
}
@media (min-width: 900px) {
  .layout {
    grid-template-columns: minmax(320px, 400px) 1fr;
  }
  .inputs {
    position: sticky;
    top: 76px;
  }
}
.results {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.toolbar-actions {
  display: flex;
  gap: 2px;
}
.gauge-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 10px;
  align-items: center;
}
.col-head,
.row-head {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--muted);
}
.hint {
  margin: 8px 0 0;
}
.inputs .btn-primary {
  width: 100%;
}
.inputs .btn-primary:disabled {
  opacity: 0.5;
  cursor: default;
}
tr.rec td {
  background: var(--accent-soft);
}
td .pill {
  margin-left: 6px;
}
td.ok {
  color: var(--good);
  font-weight: 600;
}
td.off {
  color: var(--muted);
}
.highlight {
  border-color: var(--poor);
  border-width: 2px;
}
.math {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.9rem;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  overflow-x: auto;
}
.castOn {
  font-size: 1.1rem;
}
.castOn strong {
  font-size: 1.6rem;
  color: var(--accent);
}
.converter td {
  padding: 6px 6px;
}
.converter input,
.converter select {
  min-height: 36px;
  padding: 6px 8px;
}
.converter td:nth-child(1) {
  min-width: 130px;
}
.converter td:nth-child(2) {
  width: 84px;
}
.converter td:nth-child(3) {
  width: 90px;
}
.converter td:nth-child(5) {
  width: 44px;
}
.converter + .btn {
  margin-top: 12px;
}
</style>
