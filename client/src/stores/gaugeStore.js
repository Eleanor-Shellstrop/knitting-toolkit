import { defineStore } from 'pinia';
import { convertCount, evaluateSizes } from '../lib/gauge.js';
import { convertGauge, convertLength, round } from '../lib/units.js';

let uid = 0;
const id = () => `${Date.now().toString(36)}-${(uid++).toString(36)}`;

const example = () => ({
  unit: 'in',
  patternName: 'Example raglan pullover',
  pattern: { sts: 20, rows: 28 },
  yours: { sts: 22, rows: 30 },
  targetChest: 40,
  tolerance: 1,
  stitchMultiple: 4,
  edgeStitches: 0,
  sizes: [
    { id: id(), name: 'S', chest: 34 },
    { id: id(), name: 'M', chest: 38 },
    { id: id(), name: 'L', chest: 42 },
    { id: id(), name: 'XL', chest: 46 },
    { id: id(), name: '2XL', chest: 50 },
  ],
  conversions: [
    { id: id(), label: 'Sleeve cuff', kind: 'sts', count: 44 },
    { id: id(), label: 'Upper arm', kind: 'sts', count: 64 },
    { id: id(), label: 'Raglan depth', kind: 'rows', count: 56 },
  ],
});

export const useGaugeStore = defineStore('gauge', {
  state: example,

  getters: {
    result(state) {
      return evaluateSizes({
        sizes: state.sizes,
        pattern: state.pattern,
        yours: state.yours,
        targetChest: state.targetChest,
        tolerance: state.tolerance,
        stitchMultiple: state.stitchMultiple,
        edgeStitches: state.edgeStitches,
        unit: state.unit,
      });
    },

    /** Pattern counts re-expressed at your gauge (same physical size). */
    convertedCounts(state) {
      return state.conversions.map((c) => {
        const from = c.kind === 'rows' ? state.pattern.rows : state.pattern.sts;
        const to = c.kind === 'rows' ? state.yours.rows : state.yours.sts;
        const ok = from > 0 && to > 0 && c.count > 0;
        return { ...c, converted: ok ? convertCount(c.count, from, to) : null };
      });
    },
  },

  actions: {
    addSize() {
      const last = this.sizes.at(-1);
      this.sizes.push({ id: id(), name: '', chest: last?.chest ? last.chest + (this.unit === 'in' ? 4 : 10) : null });
    },
    removeSize(sizeId) {
      this.sizes = this.sizes.filter((s) => s.id !== sizeId);
    },
    addConversion() {
      this.conversions.push({ id: id(), label: '', kind: 'sts', count: null });
    },
    removeConversion(convId) {
      this.conversions = this.conversions.filter((c) => c.id !== convId);
    },

    /** Switch inches ↔ cm, converting every value so the inputs stay equivalent. */
    setUnit(to) {
      const from = this.unit;
      if (from === to) return;
      const len = (v) => (v ? round(convertLength(v, from, to), 1) : v);
      const g = (v) => (v ? round(convertGauge(v, from, to), 1) : v);
      this.pattern = { sts: g(this.pattern.sts), rows: g(this.pattern.rows) };
      this.yours = { sts: g(this.yours.sts), rows: g(this.yours.rows) };
      this.targetChest = len(this.targetChest);
      this.tolerance = to === 'cm' ? 2.5 : 1;
      this.sizes = this.sizes.map((s) => ({ ...s, chest: len(s.chest) }));
      this.unit = to;
    },

    loadExample() {
      this.$patch(example());
    },

    clear() {
      this.$patch({
        patternName: '',
        pattern: { sts: null, rows: null },
        yours: { sts: null, rows: null },
        targetChest: null,
        stitchMultiple: 1,
        edgeStitches: 0,
        sizes: [{ id: id(), name: '', chest: null }],
        conversions: [],
      });
    },

    /** Plain-object copy of the inputs, for saving to the stash. */
    snapshot() {
      return JSON.parse(JSON.stringify(this.$state));
    },

    restore(snapshot) {
      this.$patch(JSON.parse(JSON.stringify(snapshot)));
    },
  },

  persist: true,
});
