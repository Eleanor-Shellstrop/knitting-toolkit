import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Knitting Toolkit' } },
    {
      path: '/gauge',
      name: 'gauge',
      component: () => import('./views/GaugeSizeView.vue'),
      meta: { title: 'Gauge & Size Advisor' },
    },
    {
      path: '/yarns',
      name: 'yarns',
      component: () => import('./views/YarnMatchView.vue'),
      meta: { title: 'Yarn Match' },
    },
    {
      path: '/yarns/:id(\\d+)',
      name: 'yarn',
      component: () => import('./views/YarnDetailView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { title: 'Yarn Match' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./views/AboutView.vue'),
      meta: { title: 'About' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
  const t = to.meta.title;
  document.title = t && t !== 'Knitting Toolkit' ? `${t} · Knitting Toolkit` : 'Knitting Toolkit';
});
