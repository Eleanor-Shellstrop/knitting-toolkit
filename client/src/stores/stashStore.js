import { defineStore } from 'pinia';

// A no-login "stash": favorite yarns and saved gauge calculations, persisted in
// localStorage through pinia-plugin-persistedstate.
export const useStashStore = defineStore('stash', {
  state: () => ({
    yarns: [], // { id, brand, name, weight_name, blend }
    calcs: [], // { id, label, savedAt, headline, snapshot }
  }),

  getters: {
    hasYarn: (state) => (id) => state.yarns.some((y) => y.id === id),
    isEmpty: (state) => state.yarns.length === 0 && state.calcs.length === 0,
  },

  actions: {
    toggleYarn(yarn) {
      if (this.hasYarn(yarn.id)) {
        this.yarns = this.yarns.filter((y) => y.id !== yarn.id);
      } else {
        const { id, brand, name, weight_name, blend } = yarn;
        this.yarns.unshift({ id, brand, name, weight_name, blend });
      }
    },

    saveCalc({ label, headline, snapshot }) {
      this.calcs.unshift({
        id: `${Date.now().toString(36)}`,
        label: label || 'Untitled pattern',
        headline,
        savedAt: new Date().toISOString(),
        snapshot,
      });
      this.calcs = this.calcs.slice(0, 20);
    },

    removeCalc(id) {
      this.calcs = this.calcs.filter((c) => c.id !== id);
    },
  },

  persist: true,
});
