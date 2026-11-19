<script setup>
import { onMounted, ref, watch } from 'vue';
import { useYarnStore } from '../stores/yarnStore.js';

const yarns = useYarnStore();
const text = ref(yarns.query);
let timer;

watch(text, (q) => {
  clearTimeout(timer);
  timer = setTimeout(() => yarns.search(q), 200);
});

const weights = [
  { value: null, label: 'Any weight' },
  { value: 1, label: 'Fingering' },
  { value: 2, label: 'Sport' },
  { value: 3, label: 'DK' },
  { value: 4, label: 'Worsted / Aran' },
  { value: 5, label: 'Bulky' },
  { value: 6, label: 'Super bulky' },
];

function setWeight(w) {
  yarns.weight = w;
  yarns.search(text.value);
}

onMounted(() => yarns.search(text.value));
</script>

<template>
  <form class="search" role="search" @submit.prevent="yarns.search(text)">
    <label for="yarn-q" class="sr-only">Search yarns</label>
    <input
      id="yarn-q"
      v-model="text"
      type="search"
      placeholder="Search brand or yarn, e.g. “Cascade 220 Superwash”"
      autocomplete="off"
    />
    <label for="yarn-w" class="sr-only">Yarn weight</label>
    <select id="yarn-w" :value="yarns.weight ?? ''" @change="setWeight($event.target.value === '' ? null : Number($event.target.value))">
      <option v-for="w in weights" :key="w.label" :value="w.value ?? ''">{{ w.label }}</option>
    </select>
  </form>
</template>

<style scoped>
.search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.search input {
  min-height: 48px;
  font-size: 1rem;
  border-radius: 999px;
  padding-left: 18px;
}
.search select {
  min-height: 48px;
  border-radius: 999px;
  width: auto;
}
input::placeholder {
  color: var(--placeholder-text);
}
@media (max-width: 520px) {
  .search {
    grid-template-columns: 1fr;
  }
  .search select {
    width: 100%;
  }
}
</style>
