<script setup>
defineProps({
  fibers: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div class="fiber" :class="{ compact }">
    <div class="bar" role="img" :aria-label="fibers.map((f) => `${f.percent}% ${f.name}`).join(', ')">
      <span
        v-for="f in fibers"
        :key="f.name"
        :class="['seg', f.category]"
        :style="{ flexBasis: f.percent + '%' }"
        :title="`${f.percent}% ${f.name}`"
      />
    </div>
    <ul v-if="!compact" class="legend">
      <li v-for="f in fibers" :key="f.name">
        <i :class="f.category" aria-hidden="true" />
        <span class="num">{{ f.percent }}%</span> {{ f.name }}
        <span v-if="f.felts" class="felts">felts</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--surface-2);
  gap: 2px;
}
.compact .bar {
  height: 6px;
}
.seg {
  flex-grow: 0;
  flex-shrink: 1;
}
.animal {
  background: var(--fiber-animal);
}
.plant {
  background: var(--fiber-plant);
}
.synthetic {
  background: var(--fiber-synthetic);
}
.regenerated {
  background: var(--fiber-regenerated);
}
.legend {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 0.8125rem;
}
.legend li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.felts {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fair);
  font-weight: 600;
}
</style>
