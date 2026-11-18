import { defineStore } from 'pinia';
import { api } from '../api/client.js';

export const useYarnStore = defineStore('yarn', {
  state: () => ({
    query: '',
    weight: null,
    results: [],
    searching: false,
    searchError: null,

    target: null,
    matches: [],
    mode: 'mix', // 'mix' = same garment, 'substitute' = replace entirely
    tolerance: 1,
    loadingMatches: false,
    matchError: null,
  }),

  getters: {
    conflictCount: (state) => state.matches.filter((m) => m.verdict === 'conflict').length,
  },

  actions: {
    async search(q = this.query) {
      this.query = q;
      this.searching = true;
      this.searchError = null;
      const requested = `${q}|${this.weight}`;
      this._lastSearch = requested;
      try {
        const rows = await api.searchYarns(q.trim(), this.weight ?? undefined);
        if (this._lastSearch === requested) this.results = rows; // drop stale responses
      } catch (err) {
        this.searchError = err.message;
      } finally {
        if (this._lastSearch === requested) this.searching = false;
      }
    },

    async loadTarget(id) {
      this.matchError = null;
      if (this.target?.id !== id) {
        this.target = null;
        this.matches = [];
      }
      try {
        this.target = await api.getYarn(id);
        await this.loadMatches();
      } catch (err) {
        this.matchError = err.message;
      }
    },

    async loadMatches() {
      if (!this.target) return;
      this.loadingMatches = true;
      this.matchError = null;
      const key = `${this.target.id}|${this.mode}|${this.tolerance}`;
      this._lastMatch = key;
      try {
        const data = await api.getMatches(this.target.id, { mode: this.mode, tolerance: this.tolerance });
        if (this._lastMatch === key) this.matches = data.matches;
      } catch (err) {
        this.matchError = err.message;
      } finally {
        if (this._lastMatch === key) this.loadingMatches = false;
      }
    },

    setMode(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      return this.loadMatches();
    },

    setTolerance(t) {
      this.tolerance = t;
      return this.loadMatches();
    },
  },

  // Only remember preferences; results are always fetched fresh.
  persist: { pick: ['mode', 'tolerance', 'query'] },
});
