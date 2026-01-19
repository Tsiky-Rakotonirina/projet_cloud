import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { observeAuthState, currentUser } from '@/services/firebase/authService';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/Map.vue')
  },
  {
    path: '/recap',
    name: 'recap',
    component: () => import('@/views/Recap.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
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
