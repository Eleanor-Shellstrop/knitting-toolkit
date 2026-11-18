<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container bar">
      <RouterLink to="/" class="brand">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <span>Knitting Toolkit</span>
      </RouterLink>
      <nav aria-label="Main">
        <RouterLink to="/gauge">Gauge &amp; size</RouterLink>
        <RouterLink to="/yarns">Yarn match</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <main id="main">
    <RouterView />
  </main>

  <footer class="site-footer">
    <div class="container">
      <p class="small muted">
        Built with Vue 3, Pinia, Express and PostgreSQL. Yarn specs are from typical ball bands —
        always swatch.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.skip {
  position: absolute;
  left: -999px;
  top: 8px;
  background: var(--surface);
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 10;
}
.skip:focus {
  left: 8px;
}
.site-header {
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 5;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 60px;
  flex-wrap: wrap;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 650;
  font-size: 1.1rem;
  color: var(--text);
  text-decoration: none;
}
nav {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}
nav a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  padding: 6px 10px;
  border-radius: 999px;
}
nav a:hover {
  color: var(--text);
  background: var(--surface-2);
}
nav a.router-link-active {
  color: var(--accent);
  background: var(--accent-soft);
}
@media (max-width: 480px) {
  .bar {
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .brand span {
    font-size: 1rem;
  }
  nav a {
    padding: 6px 8px;
    font-size: 0.875rem;
  }
}
.site-footer {
  border-top: 1px solid var(--border);
  padding: 20px 0;
}
.site-footer p {
  margin: 0;
}
</style>
