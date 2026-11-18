<template>
  <div class="container page about">
    <h1>About this project</h1>
    <p class="lede">
      I'm a knitter and a developer. I kept hitting the same two problems before casting on a
      sweater, so I built tools that solve them and used the project to show how I approach a
      full-stack app.
    </p>

    <section class="grid">
      <div class="card">
        <h2>The problems</h2>
        <ol>
          <li>
            <strong>Gauge vs. size.</strong> When my gauge doesn't match the pattern's, can I knit a different
            size and still get the fit I want, or do I need to work out a custom size?
          </li>
          <li>
            <strong>Mixing yarns.</strong> If I'm knitting with Cascade 220 Superwash (100% wool, 22 sts / 4",
            wash cool, tumble dry low), which other yarns can go into the <em>same</em> sweater without
            felting, sagging or knitting up at a different gauge?
          </li>
        </ol>
      </div>

      <div class="card">
        <h2>Tech stack</h2>
        <ul>
          <li><strong>Vue 3</strong> (Composition API, <code>&lt;script setup&gt;</code>) + <strong>Vue Router</strong></li>
          <li><strong>Pinia</strong> stores, persisted to localStorage so there's no login</li>
          <li><strong>Node / Express</strong> REST API</li>
          <li><strong>PostgreSQL</strong>: normalized schema, CHECK-constrained enums, a reporting view built with
            <code>json_agg</code> / <code>string_agg</code>, and <code>pg_trgm</code> fuzzy search</li>
          <li><strong>Vitest</strong> unit tests for the gauge math and the matching algorithm</li>
        </ul>
      </div>
    </section>

    <section class="card">
      <h2>How the gauge math works</h2>
      <p>
        A pattern's stitch counts are fixed, so a different gauge scales every width by
        <code>pattern sts ÷ your sts</code>. At 22 sts / 4" on a 20 sts / 4" pattern, every size comes out
        about 9% smaller. The advisor scales each size, finds the one closest to the chest you want, and
        then looks at <em>how far</em> that is from the size you'd usually knit. A jump of one size is usually
        fine. Two sizes needs attention, because the armhole, neck and sleeves belong to the other size. Three
        or more sizes, or no size within your tolerance, means a custom cast-on:
        <code>chest × sts ÷ 4"</code>, rounded to your stitch-pattern repeat.
      </p>
    </section>

    <section class="card">
      <h2>How yarn matching works</h2>
      <p>
        SQL narrows the candidates to yarns in an adjacent weight class with an overlapping gauge. A scoring
        function then rates each one out of 100:
      </p>
      <ul>
        <li><strong>Gauge (30):</strong> how far apart the gauges are, judged more strictly when mixing.</li>
        <li><strong>Care (25):</strong> the garment follows the strictest care label. When mixing, a yarn that would
          felt in your yarn's wash routine is a hard conflict.</li>
        <li><strong>Fiber (20):</strong> felting, elasticity, warmth and fiber family, weighted by blend percentage.</li>
        <li><strong>Density (15):</strong> yards per gram, which affects drape and whether one yarn drags on another.</li>
        <li><strong>Construction (10):</strong> plied, single, chainette.</li>
      </ul>
      <p class="small muted">
        Yarn data is a hand-curated set of about 80 yarns based on typical ball-band specs. Check the
        current label, and always swatch.
      </p>
    </section>
  </div>
</template>

<style scoped>
.about {
  display: grid;
  gap: 20px;
}
.about > h1,
.about > .lede {
  margin-bottom: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
ol,
ul {
  padding-left: 1.2em;
  margin: 0;
  display: grid;
  gap: 8px;
}
code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.875em;
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: 4px;
}
.card p:last-child {
  margin-bottom: 0;
}
</style>
