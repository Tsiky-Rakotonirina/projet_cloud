import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { observeAuthState, currentUser } from '@/services/firebase/auth.service';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/tabs/',
    component: () => import('@/views/Tabs.vue'),
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'tabs-home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'recap',
        name: 'tabs-recap',
        component: () => import('@/views/Recap.vue')
      },
      {
        path: 'notifications',
        name: 'tabs-notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'map',
        name: 'tabs-map',
        component: () => import('@/views/Map.vue')
      }
    ]
  },
  {
    path: '/home',
    redirect: '/tabs/home'
  },
  {
    path: '/recap',
    redirect: '/tabs/recap'
  },
  {
    path: '/map',
    redirect: '/tabs/map'
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/seed',
    name: 'seed',
    component: () => import('@/views/SeedView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Initialiser l'observateur d'auth state
observeAuthState((user) => {
  console.log("Router : user state changed :", user?.email || "null");
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  console.log("Navigation :", {
    from: from.name,
    to: to.name,
    isAuthenticated: !!currentUser.value,
    requiresAuth
  });
  
  if (requiresAuth && !currentUser.value) {
    console.log("Accès refusé, redirection vers login");
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register') && currentUser.value) {
    console.log("Utilisateur déjà connecté, redirection vers home");
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router
